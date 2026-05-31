from rest_framework import serializers
from .models import ProducerProfile, ProducerVerificationDocument
from apps.users.serializers import UserProfileSerializer


class ProducerVerificationDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.FileField(source='file', read_only=True)

    class Meta:
        model = ProducerVerificationDocument
        fields = (
            'id', 'original_filename', 'content_type', 'size',
            'file_url', 'submitted_at',
        )
        read_only_fields = fields


class ProducerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user',
        read_only=True
    )
    verification_documents = ProducerVerificationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ProducerProfile
        fields = (
            'id', 'user', 'user_id', 'business_name', 'description',
            'cover_image', 'has_organic_certification', 'certification_details',
            'website', 'instagram', 'facebook', 'whatsapp',
            'legal_name', 'cnpj', 'state_registration', 'municipal_registration',
            'verification_status', 'verification_submitted_at', 'verification_reviewed_at',
            'verification_notes', 'verification_documents',
            'is_verified', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'user_id', 'is_verified', 'verification_status',
            'verification_submitted_at', 'verification_reviewed_at', 'verification_notes',
            'created_at', 'updated_at',
        )


class ProducerProfileCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating producer profiles.
    """
    class Meta:
        model = ProducerProfile
        fields = (
            'business_name', 'description', 'cover_image',
            'has_organic_certification', 'certification_details',
            'website', 'instagram', 'facebook', 'whatsapp',
            'legal_name', 'cnpj', 'state_registration', 'municipal_registration',
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
            'cover_image', 'has_organic_certification', 'is_verified', 'verification_status'
        )
