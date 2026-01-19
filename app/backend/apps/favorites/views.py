from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Favorite
from .serializers import FavoriteSerializer, FavoriteCreateSerializer
from apps.locations.models import Location


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Favorite model.
    Users can favorite/unfavorite locations.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Only show current user's favorites.
        """
        return Favorite.objects.filter(user=self.request.user).select_related(
            'location', 'location__address', 'location__producer'
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return FavoriteCreateSerializer
        return FavoriteSerializer

    def perform_create(self, serializer):
        """
        Create favorite for current user.
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Toggle favorite status for a location.
        POST /api/favorites/toggle/
        Body: { "location_id": 123 }
        """
        location_id = request.data.get('location_id')
        
        if not location_id:
            return Response(
                {'error': 'location_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        location = get_object_or_404(Location, id=location_id)
        
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            location=location,
            defaults={'note': request.data.get('note', '')}
        )
        
        if not created:
            favorite.delete()
            return Response(
                {'message': 'Removido dos favoritos', 'favorited': False},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'message': 'Adicionado aos favoritos',
                'favorited': True,
                'favorite': FavoriteSerializer(favorite).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def check(self, request):
        """
        Check if a location is favorited by current user.
        GET /api/favorites/check/?location_id=123
        """
        location_id = request.query_params.get('location_id')
        
        if not location_id:
            return Response(
                {'error': 'location_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_favorited = Favorite.objects.filter(
            user=request.user,
            location_id=location_id
        ).exists()
        
        return Response({'favorited': is_favorited})
