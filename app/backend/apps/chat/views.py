from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    MessageSerializer,
    MessageCreateSerializer
)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar conversas
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas as conversas do usuário autenticado"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'create':
            return ConversationCreateSerializer
        return ConversationDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Cria ou retorna uma conversa existente"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        
        # Retornar o serializer detalhado
        output_serializer = ConversationDetailSerializer(
            conversation, 
            context={'request': request}
        )
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marca todas as mensagens da conversa como lidas"""
        conversation = self.get_object()
        messages = conversation.messages.filter(
            is_read=False
        ).exclude(sender=request.user)
        
        count = messages.update(is_read=True)
        
        return Response({
            'status': 'success',
            'marked_count': count
        })


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar mensagens
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas mensagens das conversas do usuário"""
        conversation_id = self.request.query_params.get('conversation_id')
        
        queryset = Message.objects.filter(
            conversation__participants=self.request.user
        )
        
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        return queryset.order_by('created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer
    
    def create(self, request, *args, **kwargs):
        """Cria uma nova mensagem"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verificar se o usuário é participante da conversa
        conversation_id = serializer.validated_data['conversation'].id
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=request.user
        ).first()
        
        if not conversation:
            return Response(
                {'error': 'Você não tem permissão para enviar mensagens nesta conversa'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = serializer.save()
        
        # Atualizar o updated_at da conversa
        conversation.save(update_fields=['updated_at'])
        
        # Retornar com o serializer completo
        output_serializer = MessageSerializer(message)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
