from django.contrib import admin
from .models import Location, LocationImage


class LocationImageInline(admin.TabularInline):
    model = LocationImage
    extra = 1


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'producer', 'location_type', 'get_city',
        'is_verified', 'is_active', 'created_at'
    )
    list_filter = ('location_type', 'is_verified', 'is_active', 'address__city', 'address__state')
    search_fields = ('name', 'description', 'producer__business_name', 'address__city')
    list_editable = ('is_verified', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [LocationImageInline]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('producer', 'name', 'location_type', 'description', 'main_image')
        }),
        ('Endereço', {
            'fields': ('address',)
        }),
        ('Produtos', {
            'fields': ('products',)
        }),
        ('Funcionamento', {
            'fields': ('operation_days', 'operation_hours')
        }),
        ('Contato', {
            'fields': ('phone', 'whatsapp')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_active')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_city(self, obj):
        return f"{obj.address.city}/{obj.address.state}"
    get_city.short_description = 'Cidade'


@admin.register(LocationImage)
class LocationImageAdmin(admin.ModelAdmin):
    list_display = ('location', 'caption', 'order', 'created_at')
    list_filter = ('location',)
    search_fields = ('location__name', 'caption')
