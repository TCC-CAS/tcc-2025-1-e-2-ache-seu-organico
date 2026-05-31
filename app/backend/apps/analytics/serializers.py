from rest_framework import serializers
from .models import ActivityLog, ProducerStatistics
from apps.locations.models import Location


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for creating activity logs."""
    
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'activity_type',
            'location',
            'product',
            'producer',
            'metadata',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user', 'ip_address', 'user_agent']


class ProducerStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for producer statistics."""
    views_growth = serializers.ReadOnlyField()
    favorites_growth = serializers.ReadOnlyField()
    business_name = serializers.CharField(source='producer.business_name', read_only=True)
    total_locations = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    
    class Meta:
        model = ProducerStatistics
        fields = [
            'id',
            'business_name',
            'total_views',
            'total_favorites',
            'total_phone_clicks',
            'total_whatsapp_clicks',
            'total_directions_clicks',
            'monthly_views',
            'monthly_favorites',
            'views_growth',
            'favorites_growth',
            'total_locations',
            'total_products',
            'last_calculated'
        ]
    
    def get_total_locations(self, obj):
        """Get total active locations for this producer."""
        return obj.producer.locations.filter(is_active=True).count()
    
    def get_total_products(self, obj):
        """Get total unique products across all locations."""
        from apps.products.models import Product
        location_ids = obj.producer.locations.filter(is_active=True).values_list('id', flat=True)
        return Product.objects.filter(locations__id__in=location_ids).distinct().count()


class LocationStatisticsSerializer(serializers.Serializer):
    """Serializer for individual location statistics."""
    location_id = serializers.IntegerField()
    location_name = serializers.CharField()
    total_views = serializers.IntegerField()
    total_favorites = serializers.IntegerField()
    monthly_views = serializers.IntegerField()
    monthly_favorites = serializers.IntegerField()


class AnalyticsSummarySerializer(serializers.Serializer):
    """Summary of all analytics for a producer."""
    producer_stats = ProducerStatisticsSerializer()
    location_stats = LocationStatisticsSerializer(many=True)
    recent_activities = ActivityLogSerializer(many=True)
    top_locations = serializers.ListField()
    engagement_rate = serializers.FloatField()
