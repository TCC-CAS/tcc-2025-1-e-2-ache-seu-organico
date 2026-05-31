from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver
from apps.favorites.models import Favorite
from apps.locations.models import Location
from apps.producers.models import ProducerProfile
from apps.products.models import Product
from .models import ActivityLog


@receiver(post_save, sender=Favorite)
def log_favorite_add(sender, instance, created, **kwargs):
    """Log when a user adds a favorite."""
    if created:
        ActivityLog.objects.create(
            activity_type=ActivityLog.ActivityType.FAVORITE_ADD,
            user=instance.user,
            location=instance.location,
            producer=instance.location.producer if instance.location else None,
            metadata={'note': instance.note if instance.note else ''}
        )


@receiver(post_delete, sender=Favorite)
def log_favorite_remove(sender, instance, **kwargs):
    """Log when a user removes a favorite."""
    ActivityLog.objects.create(
        activity_type=ActivityLog.ActivityType.FAVORITE_REMOVE,
        user=instance.user,
        location=instance.location,
        producer=instance.location.producer if instance.location else None
    )


@receiver(pre_delete, sender=Location)
def detach_activity_logs_from_location(sender, instance, **kwargs):
    """Keep analytics history when a location is deleted."""
    ActivityLog.objects.filter(location=instance).update(location=None)


@receiver(pre_delete, sender=Product)
def detach_activity_logs_from_product(sender, instance, **kwargs):
    """Keep analytics history when a product is deleted."""
    ActivityLog.objects.filter(product=instance).update(product=None)


@receiver(pre_delete, sender=ProducerProfile)
def detach_activity_logs_from_producer(sender, instance, **kwargs):
    """Keep analytics history when a producer profile is deleted."""
    ActivityLog.objects.filter(producer=instance).update(producer=None)
