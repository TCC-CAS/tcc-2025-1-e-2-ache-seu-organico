from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'icon', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'category', 'category_name', 'description',
            'image', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for product lists.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'category_name', 'image')
