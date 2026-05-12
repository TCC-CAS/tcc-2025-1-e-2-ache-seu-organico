from decimal import Decimal

from django.db import migrations


def seed_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('billing', 'SubscriptionPlan')

    plans = [
        {
            'code': 'FREE',
            'name': 'Gratis',
            'description': 'Plano inicial para comecar na plataforma.',
            'monthly_price': Decimal('0.00'),
            'currency': 'BRL',
            'max_locations': 1,
            'max_products': 10,
            'boost_results': False,
            'relevance_priority': False,
            'priority_verification': False,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'code': 'BASIC',
            'name': 'Basico',
            'description': 'Plano para ampliar alcance com mais capacidade operacional.',
            'monthly_price': Decimal('19.90'),
            'currency': 'BRL',
            'max_locations': 5,
            'max_products': 30,
            'boost_results': False,
            'relevance_priority': False,
            'priority_verification': True,
            'is_active': True,
            'sort_order': 2,
        },
        {
            'code': 'PREMIUM',
            'name': 'Premium',
            'description': 'Plano completo com alcance ilimitado e prioridade comercial.',
            'monthly_price': Decimal('49.90'),
            'currency': 'BRL',
            'max_locations': None,
            'max_products': None,
            'boost_results': True,
            'relevance_priority': True,
            'priority_verification': True,
            'is_active': True,
            'sort_order': 3,
        },
    ]

    for payload in plans:
        code = payload['code']
        SubscriptionPlan.objects.update_or_create(
            code=code,
            defaults=payload,
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_plans, noop_reverse),
    ]
