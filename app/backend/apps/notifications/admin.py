from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notification_type', 'title', 'is_read', 'created_at', 'author_name')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__email', 'title', 'message')
    readonly_fields = ('created_at', 'updated_at', 'read_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Destinatário', {
            'fields': ('recipient', 'notification_type')
        }),
        ('Conteúdo', {
            'fields': ('title', 'message', 'author', 'action_url', 'extra_data')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        'user', 
        'receive_message_notifications', 
        'receive_favorite_notifications',
        'receive_system_notifications',
        'receive_admin_notifications',
        'email_notifications'
    )
    list_filter = (
        'receive_message_notifications',
        'receive_favorite_notifications',
        'receive_system_notifications',
        'receive_admin_notifications',
        'email_notifications'
    )
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
