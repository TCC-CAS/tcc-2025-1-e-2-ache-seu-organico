# Generated manually to link products to producer profiles.

import django.db.models.deletion
from django.db import migrations, models


def backfill_product_producer(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Location = apps.get_model('locations', 'Location')
    ProducerProfile = apps.get_model('producers', 'ProducerProfile')
    User = apps.get_model('users', 'User')

    fallback_producer = ProducerProfile.objects.order_by('id').first()
    if fallback_producer is None:
        fallback_user = User.objects.filter(user_type='PRODUCER').order_by('id').first()
        if fallback_user is not None:
            business_name = f"{fallback_user.first_name} {fallback_user.last_name}".strip() or fallback_user.email
            fallback_producer = ProducerProfile.objects.create(
                user=fallback_user,
                business_name=business_name,
            )

    for product in Product.objects.filter(producer__isnull=True):
        producer_id = (
            Location.objects.filter(products=product)
            .order_by('id')
            .values_list('producer_id', flat=True)
            .first()
        )

        if producer_id is None and fallback_producer is not None:
            producer_id = fallback_producer.id

        if producer_id is not None:
            Product.objects.filter(id=product.id).update(producer_id=producer_id)

    unresolved_count = Product.objects.filter(producer__isnull=True).count()
    if unresolved_count > 0:
        raise RuntimeError(
            f'Não foi possível vincular produtor para {unresolved_count} produto(s). '
            'Crie ao menos um perfil de produtor ou associe os produtos manualmente antes de migrar.'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('producers', '0002_initial'),
        ('locations', '0002_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='producer',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='products', to='producers.producerprofile', verbose_name='Produtor'),
        ),
        migrations.RunPython(backfill_product_producer, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='product',
            name='producer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='products', to='producers.producerprofile', verbose_name='Produtor'),
        ),
    ]
