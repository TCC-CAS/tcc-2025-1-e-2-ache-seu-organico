from rest_framework import serializers
from .models import Location, LocationImage
from apps.common.models import Address
from apps.products.serializers import ProductListSerializer
import json


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            'id', 'street', 'number', 'complement', 'neighborhood',
            'city', 'state', 'zip_code', 'latitude', 'longitude'
        )


class LocationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationImage
        fields = ('id', 'image', 'caption', 'order')


class LocationSerializer(serializers.ModelSerializer):
    address = AddressSerializer()
    images = LocationImageSerializer(many=True, read_only=True)
    products = ProductListSerializer(many=True, read_only=True)
    producer_name = serializers.CharField(source='producer.business_name', read_only=True)

    class Meta:
        model = Location
        fields = (
            'id', 'producer', 'producer_name', 'name', 'location_type',
            'description', 'address', 'products', 'main_image', 'images',
            'operation_days', 'operation_hours', 'phone', 'whatsapp',
            'is_active', 'is_verified', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'producer', 'is_verified', 'created_at', 'updated_at')

    def create(self, validated_data):
        address_data = validated_data.pop('address')
        address = Address.objects.create(**address_data)
        location = Location.objects.create(address=address, **validated_data)
        return location

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        
        if address_data:
            for attr, value in address_data.items():
                setattr(instance.address, attr, value)
            instance.address.save()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class LocationCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating locations.
    """
    address = AddressSerializer()
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Location
        fields = (
            'name', 'location_type', 'description', 'address',
            'product_ids', 'main_image', 'operation_days', 'operation_hours',
            'phone', 'whatsapp'
        )

    def to_internal_value(self, data):
        """
        Handle address field sent as JSON string (for FormData uploads)
        """
        # Se address vier como string JSON (FormData), parsear
        if isinstance(data.get('address'), str):
            try:
                data = data.copy()
                data['address'] = json.loads(data['address'])
            except json.JSONDecodeError:
                raise serializers.ValidationError({'address': 'Formato de endereço inválido'})
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        address_data = validated_data.pop('address')
        product_ids = validated_data.pop('product_ids', [])
        
        address = Address.objects.create(**address_data)
        location = Location.objects.create(address=address, **validated_data)
        
        if product_ids:
            location.products.set(product_ids)
        
        return location

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        product_ids = validated_data.pop('product_ids', None)
        
        if address_data:
            for attr, value in address_data.items():
                setattr(instance.address, attr, value)
            instance.address.save()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if product_ids is not None:
            instance.products.set(product_ids)
        
        return instance


class LocationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for location lists and map markers.
    """
    producer_name = serializers.CharField(source='producer.business_name', read_only=True)
    latitude = serializers.DecimalField(
        source='address.latitude',
        max_digits=9,
        decimal_places=6,
        read_only=True
    )
    longitude = serializers.DecimalField(
        source='address.longitude',
        max_digits=9,
        decimal_places=6,
        read_only=True
    )
    city = serializers.CharField(source='address.city', read_only=True)
    state = serializers.CharField(source='address.state', read_only=True)
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Location
        fields = (
            'id', 'name', 'location_type', 'producer_name', 'main_image',
            'latitude', 'longitude', 'city', 'state', 'product_count', 'is_verified'
        )
