from django.db import DatabaseError
from rest_framework.exceptions import APIException

from .models import SubscriptionPlan


class PlanLimitExceeded(APIException):
    status_code = 403
    default_code = 'plan_limit'

    def __init__(self, resource_label, plan, current_count, limit, upgrade_url='/planos'):
        limit_label = 'ilimitado' if limit is None else str(limit)
        message = (
            f'Seu plano {plan.name} permite até {limit_label} {resource_label}. '
            'Faça upgrade para liberar mais recursos, ganhar mais visibilidade e acelerar a verificação da sua empresa.'
        )
        detail = {
            'detail': message,
            'code': 'plan_limit',
            'plan': plan.name,
            'plan_code': plan.code,
            'resource': resource_label,
            'current_count': current_count,
            'limit': limit,
            'upgrade_url': upgrade_url,
        }
        super().__init__(detail)


def ensure_default_plans():
    free = SubscriptionPlan.get_default_free()
    basic = SubscriptionPlan.get_default_basic()
    premium = SubscriptionPlan.get_default_premium()
    return {'free': free, 'basic': basic, 'premium': premium}


def get_subscription_for_user(user):
    if not user or not user.is_authenticated:
        return None

    if not hasattr(user, 'producer_profile'):
        return None

    producer_profile = user.producer_profile
    try:
        if not hasattr(producer_profile, 'subscription'):
            return None
        return producer_profile.subscription
    except DatabaseError:
        # Billing tables may not exist yet while migrations are still running.
        return None


def get_plan_for_user(user):
    subscription = get_subscription_for_user(user)
    if subscription:
        return subscription.plan

    return ensure_default_plans()['free']


def get_subscription_summary(user):
    subscription = get_subscription_for_user(user)
    if not subscription:
        return None

    plan = subscription.plan
    return {
        'subscription_id': subscription.id,
        'status': subscription.status,
        'plan': {
            'id': plan.id,
            'code': plan.code,
            'name': plan.name,
            'monthly_price': str(plan.monthly_price),
            'formatted_price': 'Grátis' if plan.monthly_price == 0 else f'R$ {plan.monthly_price:.2f}',
            'limits': {
                'locations': plan.max_locations,
                'products': plan.max_products,
                'unlimited_locations': plan.max_locations is None,
                'unlimited_products': plan.max_products is None,
            },
            'boost_results': plan.boost_results,
            'relevance_priority': plan.relevance_priority,
            'priority_verification': plan.priority_verification,
        },
    }


def raise_plan_limit(resource_label, plan, current_count, limit):
    raise PlanLimitExceeded(resource_label, plan, current_count, limit)
