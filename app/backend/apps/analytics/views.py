from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ActivityLog, ProducerStatistics
from .serializers import (
    ActivityLogSerializer,
    ProducerStatisticsSerializer,
    LocationStatisticsSerializer,
    AnalyticsSummarySerializer
)
from apps.producers.models import ProducerProfile


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class ActivityLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for activity logs.
    Allows creating logs and viewing them (for authenticated users).
    """
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = []  # Allow anonymous logging
    
    def create(self, request, *args, **kwargs):
        """Create a new activity log entry."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Add user if authenticated
        user = request.user if request.user.is_authenticated else None
        
        # Add IP and user agent
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        activity_log = serializer.save(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Update statistics asynchronously if needed
        if activity_log.producer:
            self._update_producer_stats(activity_log)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _update_producer_stats(self, activity_log):
        """Update producer statistics based on activity."""
        stats, created = ProducerStatistics.objects.get_or_create(
            producer=activity_log.producer
        )
        
        # Update counters based on activity type
        if activity_log.activity_type == ActivityLog.ActivityType.LOCATION_VIEW:
            stats.total_views += 1
            stats.monthly_views += 1
        elif activity_log.activity_type == ActivityLog.ActivityType.FAVORITE_ADD:
            stats.total_favorites += 1
            stats.monthly_favorites += 1
        elif activity_log.activity_type == ActivityLog.ActivityType.FAVORITE_REMOVE:
            stats.total_favorites = max(0, stats.total_favorites - 1)
        elif activity_log.activity_type == ActivityLog.ActivityType.PHONE_CLICK:
            stats.total_phone_clicks += 1
        elif activity_log.activity_type == ActivityLog.ActivityType.WHATSAPP_CLICK:
            stats.total_whatsapp_clicks += 1
        elif activity_log.activity_type == ActivityLog.ActivityType.DIRECTIONS_CLICK:
            stats.total_directions_clicks += 1
        
        stats.save()
    
    def get_queryset(self):
        """Filter logs based on user permissions."""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        # Superusers can see all
        if self.request.user.is_superuser:
            return queryset
        
        # Producers can see their own logs
        if hasattr(self.request.user, 'producer_profile'):
            return queryset.filter(producer=self.request.user.producer_profile)
        
        # Regular users can't see logs
        return queryset.none()


class ProducerStatisticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for producer statistics.
    Producers can only view their own statistics.
    """
    queryset = ProducerStatistics.objects.all()
    serializer_class = ProducerStatisticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter statistics based on user."""
        queryset = super().get_queryset()
        
        # Superusers can see all
        if self.request.user.is_superuser:
            return queryset
        
        # Producers can only see their own
        if hasattr(self.request.user, 'producer_profile'):
            return queryset.filter(producer=self.request.user.producer_profile)
        
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get statistics for the current user's producer profile."""
        if not hasattr(request.user, 'producer_profile'):
            return Response(
                {'error': 'Você não é um produtor.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats, created = ProducerStatistics.objects.get_or_create(
            producer=request.user.producer_profile
        )
        
        serializer = self.get_serializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get a comprehensive summary of analytics."""
        if not hasattr(request.user, 'producer_profile'):
            return Response(
                {'error': 'Você não é um produtor.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        producer = request.user.producer_profile
        stats, created = ProducerStatistics.objects.get_or_create(producer=producer)
        
        # Get location-specific statistics
        locations = producer.locations.filter(is_active=True)
        location_stats = []
        
        for location in locations:
            views = ActivityLog.objects.filter(
                location=location,
                activity_type=ActivityLog.ActivityType.LOCATION_VIEW
            ).count()
            
            monthly_views = ActivityLog.objects.filter(
                location=location,
                activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            favorites = location.favorited_by.count()
            
            location_stats.append({
                'location_id': location.id,
                'location_name': location.name,
                'total_views': views,
                'total_favorites': favorites,
                'monthly_views': monthly_views,
                'monthly_favorites': 0  # Could track this separately if needed
            })
        
        # Get recent activities (last 30 days)
        recent_activities = ActivityLog.objects.filter(
            producer=producer,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:50]
        
        # Get top locations by views
        top_locations = list(
            ActivityLog.objects.filter(
                producer=producer,
                activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
                location__isnull=False
            )
            .values('location__id', 'location__name')
            .annotate(views=Count('id'))
            .order_by('-views')[:5]
        )
        
        # Calculate engagement rate (favorites / views)
        engagement_rate = 0
        if stats.total_views > 0:
            engagement_rate = (stats.total_favorites / stats.total_views) * 100
        
        summary = {
            'producer_stats': ProducerStatisticsSerializer(stats).data,
            'location_stats': location_stats,
            'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
            'top_locations': top_locations,
            'engagement_rate': round(engagement_rate, 2)
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get daily statistics for the last 30 days."""
        if not hasattr(request.user, 'producer_profile'):
            return Response(
                {'error': 'Você não é um produtor.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        producer = request.user.producer_profile
        start_date = timezone.now() - timedelta(days=30)
        
        # Get daily view counts
        daily_views = (
            ActivityLog.objects.filter(
                producer=producer,
                activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
                created_at__gte=start_date
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Get daily favorite additions
        daily_favorites = (
            ActivityLog.objects.filter(
                producer=producer,
                activity_type=ActivityLog.ActivityType.FAVORITE_ADD,
                created_at__gte=start_date
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        return Response({
            'daily_views': list(daily_views),
            'daily_favorites': list(daily_favorites)
        })
    
    @action(detail=False, methods=['post'])
    def recalculate(self, request):
        """Recalculate statistics for the current producer."""
        if not hasattr(request.user, 'producer_profile'):
            return Response(
                {'error': 'Você não é um produtor.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        producer = request.user.producer_profile
        stats, created = ProducerStatistics.objects.get_or_create(producer=producer)
        
        # Calculate totals
        stats.total_views = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.LOCATION_VIEW
        ).count()
        
        stats.total_favorites = sum(
            loc.favorited_by.count() for loc in producer.locations.all()
        )
        
        stats.total_phone_clicks = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.PHONE_CLICK
        ).count()
        
        stats.total_whatsapp_clicks = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.WHATSAPP_CLICK
        ).count()
        
        stats.total_directions_clicks = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.DIRECTIONS_CLICK
        ).count()
        
        # Calculate monthly stats
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        
        stats.monthly_views = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
            created_at__gte=month_start
        ).count()
        
        stats.monthly_favorites = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.FAVORITE_ADD,
            created_at__gte=month_start
        ).count()
        
        stats.previous_month_views = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
            created_at__gte=prev_month_start,
            created_at__lt=month_start
        ).count()
        
        stats.previous_month_favorites = ActivityLog.objects.filter(
            producer=producer,
            activity_type=ActivityLog.ActivityType.FAVORITE_ADD,
            created_at__gte=prev_month_start,
            created_at__lt=month_start
        ).count()
        
        stats.save()
        
        serializer = self.get_serializer(stats)
        return Response(serializer.data)
