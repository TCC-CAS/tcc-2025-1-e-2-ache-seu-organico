from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.models import TimeStampedModel


class ProducerProfile(TimeStampedModel):
    """
    Extended profile for producer users.
    """
    class VerificationStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Rascunho'
        PENDING = 'PENDING', 'Em análise'
        APPROVED = 'APPROVED', 'Aprovado'
        REJECTED = 'REJECTED', 'Rejeitado'

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

    legal_name = models.CharField(max_length=255, blank=True, verbose_name='Razão social')
    cnpj = models.CharField(max_length=18, blank=True, verbose_name='CNPJ')
    state_registration = models.CharField(max_length=30, blank=True, verbose_name='Inscrição estadual')
    municipal_registration = models.CharField(max_length=30, blank=True, verbose_name='Inscrição municipal')
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.DRAFT,
        verbose_name='Status da verificação',
    )
    verification_submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='Enviado para verificação em')
    verification_reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='Analisado em')
    verification_notes = models.TextField(blank=True, verbose_name='Notas da verificação')
    
    is_verified = models.BooleanField(default=False, verbose_name='Verificado')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')

    class Meta:
        verbose_name = 'Perfil de Produtor'
        verbose_name_plural = 'Perfis de Produtores'

    def save(self, *args, **kwargs):
        if self.is_verified:
            self.verification_status = self.VerificationStatus.APPROVED
            if self.verification_reviewed_at is None:
                self.verification_reviewed_at = timezone.now()
        elif self.verification_status == self.VerificationStatus.APPROVED:
            self.is_verified = True
            if self.verification_reviewed_at is None:
                self.verification_reviewed_at = timezone.now()
        elif self.verification_status in {
            self.VerificationStatus.DRAFT,
            self.VerificationStatus.PENDING,
            self.VerificationStatus.REJECTED,
        }:
            self.is_verified = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.business_name} - {self.user.email}"
