import json
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.producers.models import ProducerProfile

from .models import ProducerSubscription, SubscriptionPlan
from .serializers import (
    CheckoutSessionRequestSerializer,
    ProducerSubscriptionSerializer,
    SubscriptionPlanSerializer,
)
from .utils import ensure_default_plans, get_subscription_summary


def _normalize_handle(raw_handle: str) -> str:
    return (raw_handle or '').strip().lstrip('$')


def _infinitepay_post(path: str, payload: dict) -> tuple[int, dict]:
    base_url = getattr(settings, 'INFINITEPAY_API_BASE_URL', 'https://api.checkout.infinitepay.io').rstrip('/')
    url = f'{base_url}/{path.lstrip("/")}'
    # InfinitePay protege a API com camadas anti-bot; sem headers de navegador,
    # algumas requisições Python puras podem retornar 403 (Cloudflare 1010).
    request = Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': (
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
            ),
            'Origin': 'https://www.infinitepay.io',
            'Referer': 'https://www.infinitepay.io/checkout',
        },
        method='POST',
    )

    try:
        with urlopen(request, timeout=20) as response:
            raw = response.read().decode('utf-8')
            return response.getcode(), json.loads(raw) if raw else {}
    except HTTPError as exc:
        body = exc.read().decode('utf-8', errors='ignore')
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = {'detail': body or 'Erro ao chamar API da InfinitePay.'}
        return exc.code, parsed
    except (URLError, TimeoutError) as exc:
        return 503, {'detail': f'Falha de comunicação com InfinitePay: {exc}'}


def _parse_order_nsu(order_nsu: str) -> tuple[int | None, int | None]:
    # Formato esperado: aso-{producer_id}-{plan_id}-{random}
    if not order_nsu:
        return None, None

    parts = order_nsu.split('-')
    if len(parts) < 4 or parts[0] != 'aso':
        return None, None

    try:
        producer_id = int(parts[1])
        plan_id = int(parts[2])
    except (TypeError, ValueError):
        return None, None

    return producer_id, plan_id


def _activate_subscription_from_order(order_nsu: str, transaction_nsu: str = '', slug: str = '') -> bool:
    producer_id, plan_id = _parse_order_nsu(order_nsu)
    if not producer_id or not plan_id:
        return False

    producer = ProducerProfile.objects.filter(id=producer_id).first()
    plan = SubscriptionPlan.objects.filter(id=plan_id, is_active=True).first()
    if not producer or not plan:
        return False

    subscription, _ = ProducerSubscription.objects.get_or_create(
        producer=producer,
        defaults={'plan': plan, 'status': ProducerSubscription.Status.ACTIVE},
    )
    subscription.plan = plan
    subscription.status = ProducerSubscription.Status.ACTIVE
    subscription.starts_at = subscription.starts_at or timezone.now()
    subscription.current_period_start = subscription.current_period_start or timezone.now()
    subscription.stripe_subscription_id = transaction_nsu or subscription.stripe_subscription_id
    subscription.stripe_checkout_session_id = slug or subscription.stripe_checkout_session_id
    subscription.save()
    return True


def _front_planos_url(**params):
    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    query = urlencode({k: v for k, v in params.items() if v not in (None, '')})
    return f'{frontend_base}/planos?{query}' if query else f'{frontend_base}/planos'


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        ensure_default_plans()
        return super().get_queryset().order_by('sort_order', 'monthly_price', 'name')


class CurrentSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ensure_default_plans()
        summary = get_subscription_summary(request.user)
        producer_profile = request.user.producer_profile if hasattr(request.user, 'producer_profile') else None

        if producer_profile and hasattr(producer_profile, 'subscription'):
            serialized_subscription = ProducerSubscriptionSerializer(producer_profile.subscription).data
        else:
            serialized_subscription = None

        return Response(
            {
                'subscription': serialized_subscription,
                'summary': summary,
            }
        )


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        producer_profile = request.user.producer_profile if hasattr(request.user, 'producer_profile') else None
        if producer_profile is None:
            return Response(
                {'detail': 'Apenas usuários com perfil de produtor podem assinar planos.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CheckoutSessionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = SubscriptionPlan.objects.filter(id=serializer.validated_data['plan_id'], is_active=True).first()
        if plan is None:
            return Response(
                {'detail': 'Plano inválido ou indisponível.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if plan.monthly_price <= 0:
            return Response(
                {'detail': 'Este plano não possui cobrança ativa.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handle = _normalize_handle(getattr(settings, 'INFINITEPAY_HANDLE', ''))
        if not handle:
            return Response(
                {'detail': 'INFINITEPAY_HANDLE não configurada no backend.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        backend_base = getattr(settings, 'BACKEND_URL', '').rstrip('/')
        if not backend_base:
            return Response(
                {'detail': 'BACKEND_URL não configurada para callback de pagamento.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        order_nsu = f'aso-{producer_profile.id}-{plan.id}-{uuid4().hex[:12]}'
        payload = {
            'handle': handle,
            'items': [
                {
                    'quantity': 1,
                    'price': int(Decimal(plan.monthly_price) * 100),
                    'description': f'Assinatura {plan.name} - Ache Seu Organico',
                }
            ],
            'order_nsu': order_nsu,
            'redirect_url': f'{backend_base}/api/billing/checkout/callback/',
        }

        webhook_url = getattr(settings, 'INFINITEPAY_WEBHOOK_URL', '').strip()
        if webhook_url:
            payload['webhook_url'] = webhook_url

        status_code, data = _infinitepay_post('/links', payload)
        checkout_url = data.get('url')
        if status_code >= 400 or not checkout_url:
            return Response(
                {'detail': data.get('detail', 'Falha ao criar checkout na InfinitePay.'), 'provider_response': data},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        subscription, _ = ProducerSubscription.objects.get_or_create(
            producer=producer_profile,
            defaults={'plan': plan, 'status': ProducerSubscription.Status.PENDING},
        )
        subscription.plan = plan
        subscription.status = ProducerSubscription.Status.PENDING
        subscription.stripe_checkout_session_id = order_nsu
        subscription.save()

        return Response({'checkout_url': checkout_url, 'session_id': order_nsu, 'order_nsu': order_nsu})


class CheckoutCallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        order_nsu = request.query_params.get('order_nsu', '').strip()
        transaction_nsu = request.query_params.get('transaction_nsu', '').strip()
        slug = request.query_params.get('slug', '').strip()
        receipt_url = request.query_params.get('receipt_url', '').strip()
        capture_method = request.query_params.get('capture_method', '').strip()

        if not order_nsu or not slug or not transaction_nsu:
            return redirect(_front_planos_url(status='error', reason='missing_params'))

        handle = _normalize_handle(getattr(settings, 'INFINITEPAY_HANDLE', ''))
        status_code, payment_data = _infinitepay_post(
            '/payment_check',
            {
                'handle': handle,
                'order_nsu': order_nsu,
                'transaction_nsu': transaction_nsu,
                'slug': slug,
            },
        )

        if status_code >= 400:
            return redirect(_front_planos_url(status='error', reason='provider_check_failed'))

        if payment_data.get('success') and payment_data.get('paid'):
            activated = _activate_subscription_from_order(order_nsu, transaction_nsu=transaction_nsu, slug=slug)
            if activated:
                return redirect(
                    _front_planos_url(
                        status='success',
                        order_nsu=order_nsu,
                        capture_method=capture_method,
                        receipt_url=receipt_url,
                    )
                )
            return redirect(_front_planos_url(status='error', reason='subscription_activation_failed'))

        return redirect(_front_planos_url(status='pending', order_nsu=order_nsu))


class InfinitePayWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}

        order_nsu = str(payload.get('order_nsu', '')).strip()
        transaction_nsu = str(payload.get('transaction_nsu', '')).strip()
        slug = str(payload.get('invoice_slug') or payload.get('slug') or '').strip()
        paid = payload.get('paid') is True

        if not order_nsu:
            return Response({'detail': 'order_nsu ausente.'}, status=status.HTTP_400_BAD_REQUEST)

        if paid:
            activated = _activate_subscription_from_order(order_nsu, transaction_nsu=transaction_nsu, slug=slug)
            if not activated:
                return Response({'detail': 'Não foi possível ativar assinatura.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'ok': True}, status=status.HTTP_200_OK)
