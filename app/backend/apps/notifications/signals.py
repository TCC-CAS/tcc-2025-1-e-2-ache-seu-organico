"""
Signals para criar notificações automaticamente em eventos importantes.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.users.models import User
from apps.favorites.models import Favorite
from apps.chat.models import Message
from .models import Notification, NotificationPreference


def create_notification(recipient, notification_type, title, message, author=None, action_url='', extra_data=None):
    """Helper para criar notificações de forma centralizada"""
    # Verificar se o usuário tem preferências configuradas
    try:
        preferences = recipient.notification_preferences
    except NotificationPreference.DoesNotExist:
        # Criar preferências padrão se não existir
        preferences = NotificationPreference.objects.create(user=recipient)
    
    # Verificar se o usuário quer receber este tipo de notificação
    if not preferences.should_notify(notification_type):
        return None
    
    # Criar a notificação
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        author=author,
        action_url=action_url,
        extra_data=extra_data or {}
    )


@receiver(post_save, sender=User)
def send_welcome_notification(sender, instance, created, **kwargs):
    """Envia notificação de boas-vindas quando um novo usuário é criado"""
    if created:
        # Criar preferências padrão
        NotificationPreference.objects.get_or_create(user=instance)
        
        # Enviar notificação de boas-vindas
        create_notification(
            recipient=instance,
            notification_type=Notification.NotificationType.WELCOME,
            title='Bem-vindo ao Ache Seu Orgânico!',
            message=f'Olá {instance.first_name or ""}! Seja bem-vindo à plataforma. '
                    f'Aqui você encontra produtos orgânicos frescos diretamente dos produtores. '
                    f'Explore feiras, lojas e produtores perto de você!',
            action_url='/',
        )


@receiver(post_save, sender=Favorite)
def send_favorite_notification(sender, instance, created, **kwargs):
    """Notifica o produtor quando alguém favorita sua localização"""
    if created:
        # Obter o produtor da localização
        location = instance.location
        producer_user = location.producer.user
        
        # Não notificar se o próprio produtor favoritou
        if producer_user == instance.user:
            return
        
        create_notification(
            recipient=producer_user,
            notification_type=Notification.NotificationType.FAVORITE,
            title='Nova pessoa interessada!',
            message=f'{instance.user.get_full_name() or instance.user.email} favoritou "{location.name}"',
            author=instance.user,
            action_url=f'/localizacao/{location.id}',
            extra_data={'location_id': location.id}
        )


@receiver(post_save, sender=Message)
def send_message_notification(sender, instance, created, **kwargs):
    """Notifica o destinatário quando uma nova mensagem é enviada"""
    if created:
        # Determinar o destinatário
        conversation = instance.conversation
        participants = conversation.participants.exclude(id=instance.sender.id)
        
        for recipient in participants:
            create_notification(
                recipient=recipient,
                notification_type=Notification.NotificationType.MESSAGE,
                title='Nova mensagem',
                message=f'{instance.sender.get_full_name() or instance.sender.email} enviou uma mensagem',
                author=instance.sender,
                action_url=f'/mensagens?conversation={conversation.id}',
                extra_data={
                    'conversation_id': conversation.id,
                    'message_id': instance.id
                }
            )
