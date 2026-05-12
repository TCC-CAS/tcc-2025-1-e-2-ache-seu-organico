from django.contrib import admin

from .models import ProducerSubscription, SubscriptionPlan


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'code', 'monthly_price', 'max_locations', 'max_products',
        'boost_results', 'relevance_priority', 'priority_verification', 'is_active',
    )
    list_filter = ('code', 'is_active', 'boost_results', 'relevance_priority', 'priority_verification')
    search_fields = ('name', 'code', 'description')
    list_editable = ('monthly_price', 'max_locations', 'max_products', 'is_active')

    fieldsets = (
        ('Identificação', {
            'fields': ('code', 'name', 'description', 'sort_order', 'is_active')
        }),
        ('Limites e preço', {
            'fields': ('monthly_price', 'currency', 'max_locations', 'max_products')
        }),
        ('Benefícios premium', {
            'fields': ('boost_results', 'relevance_priority', 'priority_verification')
        }),
        ('Stripe', {
            'fields': ('stripe_product_id', 'stripe_price_id'),
            'classes': ('collapse',),
        }),
    )


@admin.register(ProducerSubscription)
class ProducerSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('producer', 'plan', 'status', 'starts_at', 'current_period_end', 'created_at')
    list_filter = ('status', 'plan')
    search_fields = ('producer__business_name', 'producer__user__email', 'stripe_subscription_id')
    readonly_fields = ('created_at', 'updated_at')
