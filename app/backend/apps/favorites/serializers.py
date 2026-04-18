from rest_framework import serializers
from .models import Favorite
from apps.locations.serializers import LocationListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    location_details = LocationListSerializer(source='location', read_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'user', 'location', 'location_details', 'note', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class FavoriteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ('location', 'note')
