from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class Notification(TimeStampedModel):
    """
    Sistema de notificações para usuários.
    Cada notificação pode ter diferentes tipos e autores.
    """
    class NotificationType(models.TextChoices):
        MESSAGE = 'MESSAGE', 'Nova Mensagem'
        FAVORITE = 'FAVORITE', 'Novo Favorito'
        SYSTEM = 'SYSTEM', 'Sistema'
        ADMIN = 'ADMIN', 'Administrador'
        WELCOME = 'WELCOME', 'Boas-vindas'
        LOCATION_VERIFIED = 'LOCATION_VERIFIED', 'Localização Verificada'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinatário'
    )
    
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        verbose_name='Tipo de Notificação'
    )
    
    title = models.CharField(max_length=200, verbose_name='Título')
    message = models.TextField(verbose_name='Mensagem')
    
    # Autor pode ser um usuário, admin, ou nulo (sistema)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_sent',
        verbose_name='Autor'
    )
    
    # Dados extras em JSON para contexto
    # Ex: {"location_id": 123, "chat_id": 456}
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Dados Extras'
    )
    
    # Link para onde a notificação deve direcionar
    action_url = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='URL de Ação'
    )
    
    is_read = models.BooleanField(default=False, verbose_name='Lida')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lida em')

    class Meta:
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f'{self.get_notification_type_display()} para {self.recipient.email}'

    @property
    def author_name(self):
        """Retorna o nome do autor ou 'Sistema'"""
        if self.author:
            return self.author.get_full_name() or self.author.email
        return 'Ache Seu Orgânico'

    def mark_as_read(self):
        """Marca a notificação como lida"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(TimeStampedModel):
    """
    Preferências de notificação do usuário.
    Define quais tipos de notificação o usuário deseja receber.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name='Usuário'
    )
    
    # Preferências por tipo
    receive_message_notifications = models.BooleanField(
        default=True,
        verbose_name='Receber notificações de mensagens'
    )
    receive_favorite_notifications = models.BooleanField(
        default=True,
        verbose_name='Receber notificações de favoritos'
    )
    receive_system_notifications = models.BooleanField(
        default=True,
        verbose_name='Receber notificações do sistema'
    )
    receive_admin_notifications = models.BooleanField(
        default=True,
        verbose_name='Receber notificações administrativas'
    )
    
    # Opções de como receber (futuro: email, push, etc.)
    email_notifications = models.BooleanField(
        default=False,
        verbose_name='Enviar notificações por email'
    )

    class Meta:
        verbose_name = 'Preferência de Notificação'
        verbose_name_plural = 'Preferências de Notificações'

    def __str__(self):
        return f'Preferências de {self.user.email}'

    def should_notify(self, notification_type):
        """Verifica se o usuário quer receber este tipo de notificação"""
        type_map = {
            Notification.NotificationType.MESSAGE: self.receive_message_notifications,
            Notification.NotificationType.FAVORITE: self.receive_favorite_notifications,
            Notification.NotificationType.SYSTEM: self.receive_system_notifications,
            Notification.NotificationType.ADMIN: self.receive_admin_notifications,
            Notification.NotificationType.WELCOME: self.receive_system_notifications,
            Notification.NotificationType.LOCATION_VERIFIED: self.receive_system_notifications,
        }
        return type_map.get(notification_type, True)
