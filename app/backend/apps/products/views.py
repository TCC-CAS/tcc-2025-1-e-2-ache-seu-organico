from rest_framework import viewsets, filters, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer
)
from apps.billing.utils import get_plan_for_user, raise_plan_limit


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category model.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        """
        Only admins can create/update/delete categories.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticatedOrReadOnly()]


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product model.
    """
    queryset = Product.objects.filter(is_active=True).select_related('category', 'producer', 'producer__user')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.is_superuser:
            producer_profile = user.producer_profile if hasattr(user, 'producer_profile') else None
            if producer_profile and user.user_type == 'PRODUCER':
                return queryset.filter(producer=producer_profile)

        return queryset

    def get_permissions(self):
        """
        Authenticated users (producers) can create/update/delete their products.
        Admins can manage all products.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        user = self.request.user
        producer_profile = user.producer_profile if hasattr(user, 'producer_profile') else None

        if user.user_type != 'PRODUCER' or producer_profile is None:
            raise ValidationError('Apenas produtores podem cadastrar produtos.')

        plan = get_plan_for_user(user)
        current_count = Product.objects.filter(producer=producer_profile).count()
        limit = plan.max_products

        if limit is not None and current_count >= limit:
            raise_plan_limit('produtos', plan, current_count, limit)

        serializer.save(producer=producer_profile)

    def perform_update(self, serializer):
        user = self.request.user
        if serializer.instance.producer.user != user and not user.is_superuser:
            raise PermissionDenied('Você só pode atualizar seus próprios produtos.')
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.producer.user != user and not user.is_superuser:
            raise PermissionDenied('Você só pode excluir seus próprios produtos.')
        instance.delete()
