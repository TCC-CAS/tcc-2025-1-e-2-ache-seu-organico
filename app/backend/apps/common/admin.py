from django.contrib import admin
from .models import Address


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('street', 'number', 'neighborhood', 'city', 'state', 'zip_code')
    search_fields = ('street', 'city', 'neighborhood', 'zip_code')
    list_filter = ('state', 'city')
