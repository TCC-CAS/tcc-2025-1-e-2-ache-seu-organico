from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.favorites.models import Favorite
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
