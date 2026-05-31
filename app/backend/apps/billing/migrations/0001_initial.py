# Generated manually to bootstrap billing and subscription management.

from decimal import Decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('producers', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SubscriptionPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.CharField(choices=[('BASIC', 'Básico'), ('PREMIUM', 'Premium')], max_length=20, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('monthly_price', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('currency', models.CharField(default='BRL', max_length=3)),
                ('max_locations', models.PositiveIntegerField(blank=True, null=True)),
                ('max_products', models.PositiveIntegerField(blank=True, null=True)),
                ('boost_results', models.BooleanField(default=False)),
                ('relevance_priority', models.BooleanField(default=False)),
                ('priority_verification', models.BooleanField(default=False)),
                ('stripe_product_id', models.CharField(blank=True, max_length=255)),
                ('stripe_price_id', models.CharField(blank=True, max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
            ],
            options={
                'verbose_name': 'Plano de assinatura',
                'verbose_name_plural': 'Planos de assinatura',
                'ordering': ['sort_order', 'monthly_price', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ProducerSubscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('PENDING', 'Pendente'), ('ACTIVE', 'Ativa'), ('PAST_DUE', 'Em atraso'), ('CANCELED', 'Cancelada')], default='PENDING', max_length=20)),
                ('stripe_customer_id', models.CharField(blank=True, max_length=255)),
                ('stripe_subscription_id', models.CharField(blank=True, max_length=255)),
                ('stripe_checkout_session_id', models.CharField(blank=True, max_length=255)),
                ('current_period_start', models.DateTimeField(blank=True, null=True)),
                ('current_period_end', models.DateTimeField(blank=True, null=True)),
                ('canceled_at', models.DateTimeField(blank=True, null=True)),
                ('starts_at', models.DateTimeField(blank=True, null=True)),
                ('plan', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='subscriptions', to='billing.subscriptionplan', verbose_name='Plano')),
                ('producer', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='subscription', to='producers.producerprofile', verbose_name='Produtor')),
            ],
            options={
                'verbose_name': 'Assinatura do produtor',
                'verbose_name_plural': 'Assinaturas dos produtores',
                'ordering': ['-created_at'],
            },
        ),
    ]
