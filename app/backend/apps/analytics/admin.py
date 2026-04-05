from django.contrib import admin
from .models import ActivityLog, ProducerStatistics


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['activity_type', 'user', 'location', 'producer', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__email', 'location__name', 'producer__business_name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ProducerStatistics)
class ProducerStatisticsAdmin(admin.ModelAdmin):
    list_display = [
        'producer', 
        'total_views', 
        'total_favorites',
        'monthly_views',
        'monthly_favorites',
        'last_calculated'
    ]
    search_fields = ['producer__business_name', 'producer__user__email']
    readonly_fields = ['last_calculated', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Produtor', {
            'fields': ('producer',)
        }),
        ('Estatísticas Totais', {
            'fields': (
                'total_views',
                'total_favorites',
                'total_phone_clicks',
                'total_whatsapp_clicks',
                'total_directions_clicks',
            )
        }),
        ('Estatísticas Mensais', {
            'fields': (
                'monthly_views',
                'monthly_favorites',
                'previous_month_views',
                'previous_month_favorites',
            )
        }),
        ('Metadados', {
            'fields': ('last_calculated', 'created_at', 'updated_at')
        }),
    )
