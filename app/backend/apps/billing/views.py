from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

try:
    import stripe
except ImportError:  # pragma: no cover - optional dependency guard
    stripe = None

from apps.producers.models import ProducerProfile

from .models import ProducerSubscription, SubscriptionPlan
from .serializers import (
    CheckoutSessionRequestSerializer,
    ProducerSubscriptionSerializer,
    SubscriptionPlanSerializer,
)
from .utils import ensure_default_plans, get_subscription_summary


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
        if stripe is None:
            return Response(
                {'detail': 'Dependência stripe não está disponível no ambiente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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

        stripe.api_key = settings.STRIPE_SECRET_KEY
        success_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/') + '/planos?status=success'
        cancel_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/') + '/planos?status=cancel'

        session = stripe.checkout.Session.create(
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=str(request.user.id),
            customer_email=request.user.email,
            line_items=[
                {
                    'quantity': 1,
                    'price_data': {
                        'currency': plan.currency.lower(),
                        'unit_amount': int(plan.monthly_price * 100),
                        'recurring': {'interval': 'month'},
                        'product_data': {
                            'name': plan.name,
                            'description': plan.description or plan.name,
                        },
                    },
                }
            ],
            metadata={
                'plan_id': str(plan.id),
                'plan_code': plan.code,
                'producer_profile_id': str(producer_profile.id),
            },
        )

        subscription, _ = ProducerSubscription.objects.get_or_create(
            producer=producer_profile,
            defaults={'plan': plan, 'status': ProducerSubscription.Status.PENDING},
        )
        subscription.plan = plan
        subscription.status = ProducerSubscription.Status.PENDING
        subscription.stripe_checkout_session_id = session.id
        subscription.save()

        return Response({'checkout_url': session.url, 'session_id': session.id})


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if stripe is None:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        payload = request.body
        signature = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'checkout.session.completed':
            metadata = data_object.get('metadata', {}) or {}
            plan_id = metadata.get('plan_id')
            producer_profile_id = metadata.get('producer_profile_id')
            if plan_id and producer_profile_id:
                plan = SubscriptionPlan.objects.filter(id=plan_id).first()
                producer_profile = ProducerProfile.objects.filter(id=producer_profile_id).first()
                if plan and producer_profile:
                    subscription, _ = ProducerSubscription.objects.get_or_create(
                        producer=producer_profile,
                        defaults={'plan': plan, 'status': ProducerSubscription.Status.ACTIVE},
                    )
                    subscription.plan = plan
                    subscription.status = ProducerSubscription.Status.ACTIVE
                    subscription.stripe_customer_id = data_object.get('customer', '') or subscription.stripe_customer_id
                    subscription.stripe_checkout_session_id = data_object.get('id', '') or subscription.stripe_checkout_session_id
                    subscription.save()

        elif event_type in {'customer.subscription.updated', 'customer.subscription.created'}:
            stripe_subscription_id = data_object.get('id', '')
            subscription = ProducerSubscription.objects.filter(stripe_subscription_id=stripe_subscription_id).first()
            if subscription:
                period_start = data_object.get('current_period_start')
                period_end = data_object.get('current_period_end')
                subscription.status = ProducerSubscription.Status.ACTIVE
                subscription.current_period_start = datetime.fromtimestamp(period_start, tz=dt_timezone.utc) if period_start else None
                subscription.current_period_end = datetime.fromtimestamp(period_end, tz=dt_timezone.utc) if period_end else None
                subscription.save()

        elif event_type == 'customer.subscription.deleted':
            stripe_subscription_id = data_object.get('id', '')
            ProducerSubscription.objects.filter(stripe_subscription_id=stripe_subscription_id).update(
                status=ProducerSubscription.Status.CANCELED,
                canceled_at=datetime.now(tz=dt_timezone.utc),
            )

        return Response(status=status.HTTP_200_OK)
