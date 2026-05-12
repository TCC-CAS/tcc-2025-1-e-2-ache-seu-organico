from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.producers.models import ProducerProfile

from .models import ProducerSubscription
from .utils import ensure_default_plans


@receiver(post_save, sender=ProducerProfile)
def create_default_subscription(sender, instance, created, **kwargs):
    plans = ensure_default_plans()
    ProducerSubscription.objects.get_or_create(
        producer=instance,
        defaults={
            'plan': plans['free'],
            'status': ProducerSubscription.Status.ACTIVE,
        },
    )
