from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel, Address
from apps.producers.models import ProducerProfile
from apps.products.models import Product


class Location(TimeStampedModel):
    """
    Physical locations where producers sell their products (fairs, stores, farms, etc.)
    """
    class LocationType(models.TextChoices):
        FAIR = 'FAIR', 'Feira'
        STORE = 'STORE', 'Loja'
        FARM = 'FARM', 'Propriedade Rural'
        DELIVERY = 'DELIVERY', 'Entrega/Delivery'
        OTHER = 'OTHER', 'Outro'

    producer = models.ForeignKey(
        ProducerProfile,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name='Produtor'
    )
    
    # Basic information
    name = models.CharField(max_length=200, verbose_name='Nome do local')
    location_type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.FAIR,
        verbose_name='Tipo de local'
    )
    description = models.TextField(blank=True, verbose_name='Descrição')
    
    # Address and geolocation
    address = models.ForeignKey(
        Address,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name='Endereço'
    )
    
    # Products available at this location
    products = models.ManyToManyField(
        Product,
        related_name='locations',
        blank=True,
        verbose_name='Produtos disponíveis'
    )
    
    # Photos
    main_image = models.ImageField(
        upload_to='locations/',
        blank=True,
        null=True,
        verbose_name='Imagem principal'
    )
    
    # Operation times
    operation_days = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Dias de funcionamento',
        help_text='Ex: Segunda a Sábado'
    )
    operation_hours = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Horário de funcionamento',
        help_text='Ex: 7h às 12h'
    )
    
    # Contact
    phone = models.CharField(max_length=20, blank=True, verbose_name='Telefone')
    whatsapp = models.CharField(max_length=20, blank=True, verbose_name='WhatsApp')
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    is_verified = models.BooleanField(default=False, verbose_name='Verificado')

    class Meta:
        verbose_name = 'Localização'
        verbose_name_plural = 'Localizações'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.producer.business_name}"


class LocationImage(TimeStampedModel):
    """
    Additional images for locations.
    """
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Localização'
    )
    image = models.ImageField(upload_to='locations/gallery/', verbose_name='Imagem')
    caption = models.CharField(max_length=200, blank=True, verbose_name='Legenda')
    order = models.PositiveIntegerField(default=0, verbose_name='Ordem')

    class Meta:
        verbose_name = 'Imagem de Localização'
        verbose_name_plural = 'Imagens de Localizações'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.location.name} - Imagem {self.order}"
