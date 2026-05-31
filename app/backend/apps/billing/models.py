from dateutil.relativedelta import relativedelta
from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class SubscriptionPlan(TimeStampedModel):
    class PlanCode(models.TextChoices):
        FREE = 'FREE', 'Gratuito'
        BASIC = 'BASIC', 'Básico'
        PREMIUM = 'PREMIUM', 'Premium'

    code = models.CharField(max_length=20, choices=PlanCode.choices, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='BRL')
    max_locations = models.PositiveIntegerField(null=True, blank=True)
    max_products = models.PositiveIntegerField(null=True, blank=True)
    boost_results = models.BooleanField(default=False)
    relevance_priority = models.BooleanField(default=False)
    priority_verification = models.BooleanField(default=False)
    # How many months a single payment covers (1 = monthly, 12 = annual)
    billing_cycle_months = models.PositiveSmallIntegerField(
        default=1,
        help_text='Meses cobertos por um único pagamento (1=mensal, 12=anual)',
    )
    stripe_product_id = models.CharField(max_length=255, blank=True)
    stripe_price_id = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Plano de assinatura'
        verbose_name_plural = 'Planos de assinatura'
        ordering = ['sort_order', 'monthly_price', 'name']

    def __str__(self):
        return self.name

    @property
    def has_unlimited_locations(self):
        return self.max_locations is None

    @property
    def has_unlimited_products(self):
        return self.max_products is None

    @classmethod
    def get_default_free(cls):
        plan, _ = cls.objects.get_or_create(
            code=cls.PlanCode.FREE,
            defaults={
                'name': 'Grátis',
                'description': 'Plano inicial para começar na plataforma.',
                'monthly_price': Decimal('0.00'),
                'currency': 'BRL',
                'max_locations': 1,
                'max_products': 10,
                'boost_results': False,
                'relevance_priority': False,
                'priority_verification': False,
                'sort_order': 1,
            },
        )
        return plan

    @classmethod
    def get_default_basic(cls):
        plan, _ = cls.objects.get_or_create(
            code=cls.PlanCode.BASIC,
            defaults={
                'name': 'Básico',
                'description': 'Plano para ampliar alcance com mais capacidade operacional.',
                'monthly_price': Decimal('19.90'),
                'currency': 'BRL',
                'max_locations': 5,
                'max_products': 30,
                'boost_results': False,
                'relevance_priority': False,
                'priority_verification': True,
                'sort_order': 2,
            },
        )
        return plan

    @classmethod
    def get_default_premium(cls):
        plan, _ = cls.objects.get_or_create(
            code=cls.PlanCode.PREMIUM,
            defaults={
                'name': 'Premium',
                'description': 'Plano completo com alcance ilimitado e prioridade comercial.',
                'monthly_price': Decimal('49.90'),
                'currency': 'BRL',
                'max_locations': None,
                'max_products': None,
                'boost_results': True,
                'relevance_priority': True,
                'priority_verification': True,
                'billing_cycle_months': 12,
                'sort_order': 3,
            },
        )
        return plan


class ProducerSubscription(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendente'
        ACTIVE = 'ACTIVE', 'Ativa'
        PAST_DUE = 'PAST_DUE', 'Em atraso'
        CANCELED = 'CANCELED', 'Cancelada'

    producer = models.OneToOneField(
        'producers.ProducerProfile',
        on_delete=models.CASCADE,
        related_name='subscription',
        verbose_name='Produtor',
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        verbose_name='Plano',
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    canceled_at = models.DateTimeField(null=True, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Assinatura do produtor'
        verbose_name_plural = 'Assinaturas dos produtores'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.producer.business_name} - {self.plan.name}'

    @property
    def is_expired(self):
        """True when current_period_end is set and has already passed."""
        return (
            self.current_period_end is not None
            and self.current_period_end < timezone.now()
        )

    @property
    def is_active(self):
        return (
            self.status == self.Status.ACTIVE
            and self.plan.is_active
            and not self.is_expired
        )

    def activate(self):
        now = timezone.now()
        self.status = self.Status.ACTIVE
        if self.starts_at is None:
            self.starts_at = now
        self.current_period_start = now
        self.current_period_end = now + relativedelta(months=self.plan.billing_cycle_months)
        self.save(update_fields=[
            'status', 'starts_at', 'current_period_start', 'current_period_end', 'updated_at',
        ])

    def expire(self):
        """Mark the subscription as past-due (expired without renewal)."""
        self.status = self.Status.PAST_DUE
        self.save(update_fields=['status', 'updated_at'])
