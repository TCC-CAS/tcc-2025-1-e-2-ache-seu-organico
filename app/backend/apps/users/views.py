from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.analytics.models import ActivityLog
from apps.notifications.models import Notification
from .models import User
from .serializers import (
    ChangePasswordSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User model.
    Provides CRUD operations for users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        """
        Non-staff users can only access their own account.
        """
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return User.objects.all()
        if user.is_authenticated:
            return User.objects.filter(pk=user.pk)
        return User.objects.none()

    def get_permissions(self):
        """
        Allow registration without authentication.
        """
        if self.action in ['create', 'register']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegistrationSerializer
        elif self.action == 'me':
            return UserProfileSerializer
        return UserSerializer

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register a new user.
        POST /api/users/register/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response(
            {
                'message': 'Usuário registrado com sucesso',
                'user': UserProfileSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get', 'put', 'patch', 'delete'])
    def me(self, request):
        """
        Get or update current user profile.
        GET/PUT/PATCH/DELETE /api/users/me/
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        if request.method == 'DELETE':
            with transaction.atomic():
                producer_profile = getattr(user, 'producer_profile', None)
                if producer_profile:
                    location_ids = list(producer_profile.locations.values_list('id', flat=True))
                    product_ids = list(producer_profile.products.values_list('id', flat=True))

                    ActivityLog.objects.filter(location_id__in=location_ids).update(location=None)
                    ActivityLog.objects.filter(product_id__in=product_ids).update(product=None)
                    ActivityLog.objects.filter(producer_id=producer_profile.id).update(producer=None)

                ActivityLog.objects.filter(user=user).update(user=None)
                Notification.objects.filter(author=user).update(author=None)
                user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(UserProfileSerializer(user).data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change password for the authenticated user.
        POST /api/users/change_password/
        """
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response({'message': 'Senha alterada com sucesso.'})
