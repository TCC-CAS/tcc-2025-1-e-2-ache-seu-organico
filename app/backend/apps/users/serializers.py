from rest_framework import serializers
from django.db import DatabaseError
from .models import User


class BillingInfoMixin:
    billing_plan = serializers.SerializerMethodField()
    billing_subscription = serializers.SerializerMethodField()
    billing_limits = serializers.SerializerMethodField()

    def _get_subscription(self, obj):
        if not hasattr(obj, 'producer_profile'):
            return None
        producer_profile = obj.producer_profile
        try:
            if not hasattr(producer_profile, 'subscription'):
                return None
            return producer_profile.subscription
        except DatabaseError:
            # Billing tables may not exist during partial rollout/migration.
            return None

    def get_billing_plan(self, obj):
        subscription = self._get_subscription(obj)
        if not subscription:
            return None

        plan = subscription.plan
        return {
            'id': plan.id,
            'code': plan.code,
            'name': plan.name,
            'description': plan.description,
            'monthly_price': str(plan.monthly_price),
            'formatted_price': 'Grátis' if plan.monthly_price == 0 else f'R$ {plan.monthly_price:.2f}',
            'limits': {
                'locations': plan.max_locations,
                'products': plan.max_products,
                'unlimited_locations': plan.max_locations is None,
                'unlimited_products': plan.max_products is None,
            },
            'boost_results': plan.boost_results,
            'relevance_priority': plan.relevance_priority,
            'priority_verification': plan.priority_verification,
        }

    def get_billing_subscription(self, obj):
        subscription = self._get_subscription(obj)
        if not subscription:
            return None

        return {
            'id': subscription.id,
            'status': subscription.status,
            'starts_at': subscription.starts_at,
            'current_period_start': subscription.current_period_start,
            'current_period_end': subscription.current_period_end,
        }

    def get_billing_limits(self, obj):
        subscription = self._get_subscription(obj)
        if not subscription:
            return None

        plan = subscription.plan
        return {
            'locations': plan.max_locations,
            'products': plan.max_products,
            'unlimited_locations': plan.max_locations is None,
            'unlimited_products': plan.max_products is None,
        }


class UserSerializer(BillingInfoMixin, serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    full_name = serializers.ReadOnlyField()
    billing_plan = serializers.SerializerMethodField()
    billing_subscription = serializers.SerializerMethodField()
    billing_limits = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'password', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone', 'avatar', 'is_active', 'billing_plan',
            'billing_subscription', 'billing_limits', 'created_at', 'updated_at'
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


class UserProfileSerializer(BillingInfoMixin, serializers.ModelSerializer):
    """
    Serializer for user profile (read-only, more detailed).
    """
    full_name = serializers.ReadOnlyField()
    billing_plan = serializers.SerializerMethodField()
    billing_subscription = serializers.SerializerMethodField()
    billing_limits = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'user_type', 'phone', 'avatar', 'billing_plan', 'billing_subscription',
            'billing_limits', 'created_at'
        )
        read_only_fields = fields
