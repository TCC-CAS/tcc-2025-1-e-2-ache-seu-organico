"""
Management command: check_plan_expirations

Marks subscriptions whose current_period_end has passed as PAST_DUE and
suspends excess locations for those producers.

Run manually:
    python manage.py check_plan_expirations

Schedule via cron (example — daily at 01:00):
    0 1 * * * cd /path/to/backend && python manage.py check_plan_expirations
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.billing.models import ProducerSubscription
from apps.billing.utils import ensure_default_plans, suspend_excess_locations


class Command(BaseCommand):
    help = 'Expire subscriptions past their billing period and suspend excess locations.'

    def handle(self, *args, **options):
        now = timezone.now()
        plans = ensure_default_plans()
        free_plan = plans['free']

        expired_qs = ProducerSubscription.objects.filter(
            status=ProducerSubscription.Status.ACTIVE,
            current_period_end__lt=now,
        ).select_related('producer', 'plan')

        count = 0
        for subscription in expired_qs:
            subscription.expire()
            suspend_excess_locations(subscription.producer, free_plan)
            count += 1
            self.stdout.write(
                f'  Expired: {subscription.producer.business_name} '
                f'(plan={subscription.plan.code}, ended={subscription.current_period_end})'
            )

        self.stdout.write(self.style.SUCCESS(f'Done. {count} subscription(s) expired.'))
