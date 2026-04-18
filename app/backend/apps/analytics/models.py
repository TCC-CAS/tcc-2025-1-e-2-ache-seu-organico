from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.locations.models import Location
from apps.products.models import Product
from apps.producers.models import ProducerProfile


class ActivityLog(TimeStampedModel):
    """
    Logs user activities for analytics and statistics.
    Tracks views, clicks, favorites, etc.
    """
    class ActivityType(models.TextChoices):
        LOCATION_VIEW = 'LOCATION_VIEW', 'Visualização de Localização'
        LOCATION_CLICK = 'LOCATION_CLICK', 'Clique em Localização'
        PRODUCT_VIEW = 'PRODUCT_VIEW', 'Visualização de Produto'
        PRODUCER_VIEW = 'PRODUCER_VIEW', 'Visualização de Produtor'
        FAVORITE_ADD = 'FAVORITE_ADD', 'Adicionou aos Favoritos'
        FAVORITE_REMOVE = 'FAVORITE_REMOVE', 'Removeu dos Favoritos'
        PHONE_CLICK = 'PHONE_CLICK', 'Clique no Telefone'
        WHATSAPP_CLICK = 'WHATSAPP_CLICK', 'Clique no WhatsApp'
        DIRECTIONS_CLICK = 'DIRECTIONS_CLICK', 'Clique em Rotas'
        SEARCH = 'SEARCH', 'Busca'

    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
        verbose_name='Tipo de Atividade'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activities',
        verbose_name='Usuário',
        help_text='Usuário que realizou a ação (pode ser null para usuários anônimos)'
    )
    
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='Localização'
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='Produto'
    )
    
    producer = models.ForeignKey(
        ProducerProfile,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name='Produtor'
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Endereço IP')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Metadados')
    
    class Meta:
        verbose_name = 'Log de Atividade'
        verbose_name_plural = 'Logs de Atividades'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['activity_type', '-created_at']),
            models.Index(fields=['location', '-created_at']),
            models.Index(fields=['producer', '-created_at']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else 'Anônimo'
        return f"{self.activity_type} - {user_str} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class ProducerStatistics(TimeStampedModel):
    """
    Aggregated statistics for producers.
    Updated periodically or on-demand.
    """
    producer = models.OneToOneField(
        ProducerProfile,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name='Produtor'
    )
    
    # Overall stats
    total_views = models.PositiveIntegerField(default=0, verbose_name='Total de Visualizações')
    total_favorites = models.PositiveIntegerField(default=0, verbose_name='Total de Favoritos')
    total_phone_clicks = models.PositiveIntegerField(default=0, verbose_name='Cliques no Telefone')
    total_whatsapp_clicks = models.PositiveIntegerField(default=0, verbose_name='Cliques no WhatsApp')
    total_directions_clicks = models.PositiveIntegerField(default=0, verbose_name='Cliques em Rotas')
    
    # Monthly stats (current month)
    monthly_views = models.PositiveIntegerField(default=0, verbose_name='Visualizações do Mês')
    monthly_favorites = models.PositiveIntegerField(default=0, verbose_name='Favoritos do Mês')
    
    # Previous month stats (for comparison)
    previous_month_views = models.PositiveIntegerField(default=0, verbose_name='Visualizações do Mês Anterior')
    previous_month_favorites = models.PositiveIntegerField(default=0, verbose_name='Favoritos do Mês Anterior')
    
    last_calculated = models.DateTimeField(auto_now=True, verbose_name='Última Atualização')
    
    class Meta:
        verbose_name = 'Estatística do Produtor'
        verbose_name_plural = 'Estatísticas dos Produtores'

    def __str__(self):
        return f"Estatísticas - {self.producer.business_name}"
    
    @property
    def views_growth(self):
        """Calculate percentage growth in views."""
        if self.previous_month_views == 0:
            return 100.0 if self.monthly_views > 0 else 0.0
        return ((self.monthly_views - self.previous_month_views) / self.previous_month_views) * 100
    
    @property
    def favorites_growth(self):
        """Calculate percentage growth in favorites."""
        if self.previous_month_favorites == 0:
            return 100.0 if self.monthly_favorites > 0 else 0.0
        return ((self.monthly_favorites - self.previous_month_favorites) / self.previous_month_favorites) * 100
