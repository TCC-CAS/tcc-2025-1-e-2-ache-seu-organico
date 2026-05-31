from rest_framework import serializers
from .models import Conversation, Message
from apps.users.models import User


class UserMinimalSerializer(serializers.ModelSerializer):
    """Serializer simplificado para informações do usuário"""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'user_type', 'avatar']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer para mensagens"""
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_id', 
                  'content', 'is_read', 'created_at']
        read_only_fields = ['created_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de mensagens"""
    class Meta:
        model = Message
        fields = ['conversation', 'content']
    
    def create(self, validated_data):
        # O sender é definido automaticamente pelo request.user na view
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de conversas"""
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'last_message', 'unread_count', 
                  'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.get_other_participant(request.user)
            if other:
                return UserMinimalSerializer(other).data
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'content': last_msg.content,
                'created_at': last_msg.created_at,
                'sender_id': last_msg.sender.id
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer detalhado para uma conversa específica"""
    messages = MessageSerializer(many=True, read_only=True)
    participants = UserMinimalSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'messages', 'created_at', 'updated_at']


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer para criar ou obter uma conversa com outro usuário"""
    participant_id = serializers.IntegerField()
    
    def validate_participant_id(self, value):
        request = self.context.get('request')
        if request and request.user.id == value:
            raise serializers.ValidationError("Você não pode criar uma conversa consigo mesmo")
        
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Usuário não encontrado")
        
        return value
    
    def create(self, validated_data):
        request = self.context['request']
        current_user = request.user
        other_user_id = validated_data['participant_id']
        other_user = User.objects.get(id=other_user_id)
        
        # Verificar se já existe uma conversa entre esses usuários
        existing_conversation = Conversation.objects.filter(
            participants=current_user
        ).filter(
            participants=other_user
        ).first()
        
        if existing_conversation:
            return existing_conversation
        
        # Criar nova conversa
        conversation = Conversation.objects.create()
        conversation.participants.add(current_user, other_user)
        
        return conversation
