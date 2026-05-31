from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from .models import ProducerProfile


@receiver(post_save, sender=User)
def create_producer_profile(sender, instance, created, **kwargs):
    """
    Automatically create a ProducerProfile when a User with user_type='PRODUCER' is created.
    """
    if created and instance.user_type == 'PRODUCER':
        ProducerProfile.objects.create(
            user=instance,
            business_name=f"{instance.first_name} {instance.last_name}".strip() or instance.email
        )


@receiver(post_save, sender=User)
def update_producer_profile(sender, instance, created, **kwargs):
    """
    Create ProducerProfile if a user is changed to PRODUCER type.
    """
    if not created and instance.user_type == 'PRODUCER':
        if not hasattr(instance, 'producer_profile'):
            ProducerProfile.objects.create(
                user=instance,
                business_name=f"{instance.first_name} {instance.last_name}".strip() or instance.email
            )
