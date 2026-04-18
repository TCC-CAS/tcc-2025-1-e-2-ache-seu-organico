from rest_framework import serializers
from .models import ProducerProfile
from apps.users.serializers import UserProfileSerializer


class ProducerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user',
        read_only=True
    )

    class Meta:
        model = ProducerProfile
        fields = (
            'id', 'user', 'user_id', 'business_name', 'description',
            'cover_image', 'has_organic_certification', 'certification_details',
            'website', 'instagram', 'facebook', 'whatsapp',
            'is_verified', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'user_id', 'is_verified', 'created_at', 'updated_at')


class ProducerProfileCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating producer profiles.
    """
    class Meta:
        model = ProducerProfile
        fields = (
            'business_name', 'description', 'cover_image',
            'has_organic_certification', 'certification_details',
            'website', 'instagram', 'facebook', 'whatsapp'
        )


class ProducerProfileListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for producer lists.
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ProducerProfile
        fields = (
            'id', 'user_name', 'user_email', 'business_name',
            'cover_image', 'has_organic_certification', 'is_verified'
        )
