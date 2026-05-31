from django.contrib import admin
from django.utils.html import format_html
from .models import ProducerProfile, ProducerVerificationDocument


class ProducerVerificationDocumentInline(admin.TabularInline):
    model = ProducerVerificationDocument
    extra = 0
    fields = ('original_filename', 'content_type', 'size', 'submitted_at', 'download_link')
    readonly_fields = ('original_filename', 'content_type', 'size', 'submitted_at', 'download_link')
    can_delete = True

    def download_link(self, obj):
        if not obj.pk or not obj.file:
            return '-'
        return format_html('<a href="{}" download>Baixar arquivo</a>', obj.file.url)

    download_link.short_description = 'Download'


@admin.register(ProducerProfile)
class ProducerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'business_name', 'user', 'has_organic_certification',
        'verification_status', 'is_verified', 'is_active', 'created_at'
    )
    list_filter = ('has_organic_certification', 'verification_status', 'is_verified', 'is_active')
    search_fields = (
        'business_name', 'legal_name', 'cnpj', 'state_registration',
        'user__email', 'user__first_name', 'user__last_name'
    )
    list_editable = ('is_verified', 'is_active')
    readonly_fields = ('verification_submitted_at', 'verification_reviewed_at', 'created_at', 'updated_at')
    inlines = (ProducerVerificationDocumentInline,)
    
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
        ('Cadastro Empresarial', {
            'fields': ('legal_name', 'cnpj', 'state_registration', 'municipal_registration')
        }),
        ('Verificação', {
            'fields': (
                'verification_status', 'verification_submitted_at',
                'verification_reviewed_at', 'verification_notes',
            )
        }),
        ('Status', {
            'fields': ('is_verified', 'is_active')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProducerVerificationDocument)
class ProducerVerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'producer', 'content_type', 'size', 'submitted_at', 'download_link')
    list_filter = ('content_type', 'submitted_at')
    search_fields = ('original_filename', 'producer__business_name', 'producer__user__email')
    readonly_fields = ('producer', 'original_filename', 'content_type', 'size', 'submitted_at', 'download_link')

    def download_link(self, obj):
        if not obj.file:
            return '-'
        return format_html('<a href="{}" download>Baixar arquivo</a>', obj.file.url)

    download_link.short_description = 'Download'
