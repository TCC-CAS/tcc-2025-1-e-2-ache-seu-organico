from django.db import models
from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    """
    Product categories (vegetables, fruits, grains, etc.)
    """
    name = models.CharField(max_length=100, unique=True, verbose_name='Nome')
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, verbose_name='Descrição')
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji ou nome do ícone')

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    """
    Organic products available in the platform.
    """
    name = models.CharField(max_length=200, verbose_name='Nome')
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        verbose_name='Categoria'
    )
    description = models.TextField(blank=True, verbose_name='Descrição')
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name='Imagem')
    
    # This is a catalog item, not inventory
    # Producers will associate products with their locations
    is_active = models.BooleanField(default=True, verbose_name='Ativo')

    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['category', 'name']

    def __str__(self):
        return self.name
