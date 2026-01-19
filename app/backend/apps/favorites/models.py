from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel
from apps.locations.models import Location


class Favorite(TimeStampedModel):
    """
    Users can favorite locations to easily find them later.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='Usuário'
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='Localização'
    )
    
    # Optional note
    note = models.TextField(blank=True, verbose_name='Nota pessoal')

    class Meta:
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'
        unique_together = ['user', 'location']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.location.name}"
