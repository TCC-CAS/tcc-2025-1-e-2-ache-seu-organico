from rest_framework import serializers

from .models import ProducerSubscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    formatted_price = serializers.SerializerMethodField()
    benefits = serializers.SerializerMethodField()
    limits = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = (
            'id', 'code', 'name', 'description', 'monthly_price', 'formatted_price',
            'currency', 'limits', 'boost_results', 'relevance_priority',
            'priority_verification', 'benefits', 'billing_cycle_months', 'is_active', 'sort_order',
        )

    def get_formatted_price(self, obj):
        if obj.monthly_price == 0:
            return 'Grátis'
        return f'R$ {obj.monthly_price:.2f}'

    def get_benefits(self, obj):
        benefits = []
        if obj.boost_results:
            benefits.append('Impulsionamento de resultados')
        if obj.relevance_priority:
            benefits.append('Mais relevância nas buscas')
        if obj.priority_verification:
            benefits.append('Prioridade na análise de verificação')
        if obj.max_locations is None:
            benefits.append('Pontos de venda ilimitados')
        else:
            benefits.append(f'Até {obj.max_locations} pontos de venda')
        if obj.max_products is None:
            benefits.append('Produtos ilimitados')
        else:
            benefits.append(f'Até {obj.max_products} produtos')
        return benefits

    def get_limits(self, obj):
        return {
            'locations': obj.max_locations,
            'products': obj.max_products,
            'unlimited_locations': obj.max_locations is None,
            'unlimited_products': obj.max_products is None,
        }


class ProducerSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = ProducerSubscription
        fields = (
            'id', 'plan', 'status', 'stripe_customer_id', 'stripe_subscription_id',
            'stripe_checkout_session_id', 'current_period_start', 'current_period_end',
            'canceled_at', 'starts_at', 'created_at', 'updated_at',
        )


class CheckoutSessionRequestSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
