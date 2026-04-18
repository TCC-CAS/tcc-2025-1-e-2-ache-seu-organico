from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import ProducerProfile
from .serializers import (
    ProducerProfileSerializer,
    ProducerProfileCreateSerializer,
    ProducerProfileListSerializer
)
from apps.users.models import User


class ProducerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProducerProfile model.
    """
    queryset = ProducerProfile.objects.select_related('user').filter(is_active=True)
    serializer_class = ProducerProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProducerProfileListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProducerProfileCreateSerializer
        return ProducerProfileSerializer

    def get_permissions(self):
        """
        Only authenticated users can create/update profiles.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        """
        Create producer profile for current user.
        """
        if self.request.user.user_type != User.UserType.PRODUCER:
            raise serializers.ValidationError(
                "Apenas usuários do tipo 'Produtor' podem criar perfis de produtor."
            )
        
        if hasattr(self.request.user, 'producer_profile'):
            raise serializers.ValidationError(
                "Este usuário já possui um perfil de produtor."
            )
        
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """
        Only the profile owner can update their profile.
        """
        if serializer.instance.user != self.request.user:
            raise serializers.ValidationError(
                "Você só pode atualizar seu próprio perfil."
            )
        serializer.save()

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """
        Get or update current user's producer profile.
        GET/PUT/PATCH /api/producers/me/
        """
        try:
            profile = request.user.producer_profile
        except ProducerProfile.DoesNotExist:
            return Response(
                {'detail': 'Perfil de produtor não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = ProducerProfileSerializer(profile)
            return Response(serializer.data)
        
        serializer = ProducerProfileCreateSerializer(
            profile,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(ProducerProfileSerializer(profile).data)
