from django.contrib import admin
from .models import ProducerProfile


@admin.register(ProducerProfile)
class ProducerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'business_name', 'user', 'has_organic_certification',
        'is_verified', 'is_active', 'created_at'
    )
    list_filter = ('has_organic_certification', 'is_verified', 'is_active')
    search_fields = ('business_name', 'user__email', 'user__first_name', 'user__last_name')
    list_editable = ('is_verified', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('user', 'business_name', 'description', 'cover_image')
        }),
        ('Certificações', {
            'fields': ('has_organic_certification', 'certification_details')
        }),
        ('Redes Sociais', {
            'fields': ('website', 'instagram', 'facebook', 'whatsapp')
        }),
        ('Status', {
            'fields': ('is_verified', 'is_active')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
