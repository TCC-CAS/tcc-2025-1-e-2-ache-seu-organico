from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class ProducerProfile(TimeStampedModel):
    """
    Extended profile for producer users.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='producer_profile',
        verbose_name='Usuário'
    )
    
    business_name = models.CharField(max_length=200, verbose_name='Nome da propriedade/negócio')
    description = models.TextField(blank=True, verbose_name='Descrição')
    cover_image = models.ImageField(
        upload_to='producers/covers/',
        blank=True,
        null=True,
        verbose_name='Imagem de capa'
    )
    
    has_organic_certification = models.BooleanField(
        default=False,
        verbose_name='Possui certificação orgânica'
    )
    certification_details = models.TextField(
        blank=True,
        verbose_name='Detalhes da certificação'
    )
    
    website = models.URLField(blank=True, verbose_name='Website')
    instagram = models.CharField(max_length=100, blank=True, verbose_name='Instagram')
    facebook = models.CharField(max_length=100, blank=True, verbose_name='Facebook')
    whatsapp = models.CharField(max_length=20, blank=True, verbose_name='WhatsApp')
    
    is_verified = models.BooleanField(default=False, verbose_name='Verificado')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')

    class Meta:
        verbose_name = 'Perfil de Produtor'
        verbose_name_plural = 'Perfis de Produtores'

    def __str__(self):
        return f"{self.business_name} - {self.user.email}"
