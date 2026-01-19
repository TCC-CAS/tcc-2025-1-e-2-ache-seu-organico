from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Location, LocationImage
from .serializers import (
    LocationSerializer,
    LocationCreateUpdateSerializer,
    LocationListSerializer,
    LocationImageSerializer
)


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Location model.
    Provides CRUD operations and map data.
    """
    queryset = Location.objects.select_related(
        'producer', 'producer__user', 'address'
    ).prefetch_related('products', 'images').filter(is_active=True)
    
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['location_type', 'is_verified', 'address__city', 'address__state']
    search_fields = ['name', 'description', 'address__city', 'address__neighborhood', 'producer__business_name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return LocationListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LocationCreateUpdateSerializer
        return LocationSerializer

    def get_permissions(self):
        """
        Only authenticated users can create/update/delete locations.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        """
        Create location for current user's producer profile.
        """
        try:
            producer_profile = self.request.user.producer_profile
        except:
            raise serializers.ValidationError(
                "Você precisa ter um perfil de produtor para criar localizações."
            )
        
        serializer.save(producer=producer_profile)

    def perform_update(self, serializer):
        """
        Only the location owner can update their location.
        """
        if serializer.instance.producer.user != self.request.user:
            raise serializers.ValidationError(
                "Você só pode atualizar suas próprias localizações."
            )
        serializer.save()

    @action(detail=False, methods=['get'])
    def my_locations(self, request):
        """
        Get all locations for current user's producer profile.
        GET /api/locations/my_locations/
        """
        try:
            producer_profile = request.user.producer_profile
        except:
            return Response(
                {'detail': 'Você não possui um perfil de produtor.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        locations = self.queryset.filter(producer=producer_profile)
        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def map_data(self, request):
        """
        Get simplified location data for map display.
        GET /api/locations/map_data/
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        queryset = queryset.filter(
            address__latitude__isnull=False,
            address__longitude__isnull=False
        )
        
        serializer = LocationListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_image(self, request, pk=None):
        """
        Add an image to a location.
        POST /api/locations/{id}/add_image/
        """
        location = self.get_object()
        
        if location.producer.user != request.user:
            return Response(
                {'detail': 'Você não tem permissão para adicionar imagens a esta localização.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = LocationImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(location=location)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
