from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('producers', '0004_producerverificationdocument'),
    ]

    operations = [
        migrations.AlterField(
            model_name='producerverificationdocument',
            name='file',
            field=models.FileField(
                max_length=500,
                upload_to='producers/verification_documents/',
                verbose_name='Arquivo',
            ),
        ),
    ]
