from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """
    Modelo para representar uma conversa entre dois usuários
    """
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        participants_names = ', '.join([p.full_name for p in self.participants.all()[:2]])
        return f"Conversa entre {participants_names}"
    
    def get_other_participant(self, user):
        """Retorna o outro participante da conversa"""
        return self.participants.exclude(id=user.id).first()
    
    def get_last_message(self):
        """Retorna a última mensagem da conversa"""
        return self.messages.order_by('-created_at').first()
    
    def get_unread_count(self, user):
        """Retorna o número de mensagens não lidas para o usuário"""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """
    Modelo para representar uma mensagem dentro de uma conversa
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.full_name}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Marca a mensagem como lida"""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
