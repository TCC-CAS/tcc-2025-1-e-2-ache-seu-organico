from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField()
    author_avatar = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'title', 'message',
            'author', 'author_name', 'author_avatar',
            'extra_data', 'action_url', 'is_read', 'read_at',
            'created_at', 'time_ago'
        )
        read_only_fields = ('id', 'created_at', 'read_at')
    
    def get_author_avatar(self, obj):
        """Retorna a URL do avatar do autor, se existir"""
        if obj.author and obj.author.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.avatar.url)
        return None
    
    def get_time_ago(self, obj):
        """Retorna tempo decorrido de forma amigável"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'Agora mesmo'
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f'Há {minutes} minuto{"s" if minutes > 1 else ""}'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'Há {hours} hora{"s" if hours > 1 else ""}'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'Há {days} dia{"s" if days > 1 else ""}'
        else:
            return obj.created_at.strftime('%d/%m/%Y')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            'id', 'receive_message_notifications', 'receive_favorite_notifications',
            'receive_system_notifications', 'receive_admin_notifications',
            'email_notifications'
        )
        read_only_fields = ('id',)
