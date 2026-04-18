from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'password', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone', 'avatar', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name', 'user_type', 'phone')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (read-only, more detailed).
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone', 'avatar', 'created_at'
        )
        read_only_fields = fields
