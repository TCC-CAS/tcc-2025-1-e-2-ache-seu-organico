from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para notificações do usuário.
    
    list: Retorna todas as notificações do usuário autenticado
    retrieve: Retorna uma notificação específica
    mark_as_read: Marca uma notificação como lida
    mark_all_as_read: Marca todas as notificações como lidas
    unread_count: Retorna o contador de notificações não lidas
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for notifications
    
    def get_queryset(self):
        """Retorna apenas as notificações do usuário autenticado"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('author')
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marca uma notificação específica como lida"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marca todas as notificações como lidas"""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({
            'status': 'success',
            'marked_as_read': updated
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Retorna o número de notificações não lidas"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Retorna as últimas 10 notificações (para o dropdown)"""
        notifications = self.get_queryset()[:10]
        serializer = self.get_serializer(notifications, many=True)
        unread_count = self.get_queryset().filter(is_read=False).count()
        
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para preferências de notificação do usuário.
    
    retrieve: Retorna as preferências do usuário
    update: Atualiza as preferências do usuário
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch']
    pagination_class = None  # Disable pagination
    
    def get_queryset(self):
        """Retorna apenas as preferências do usuário autenticado"""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Retorna ou cria as preferências do usuário"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj
    
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """Retorna as preferências do usuário autenticado"""
        preference = self.get_object()
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
