from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('producers', '0003_producerprofile_cnpj_producerprofile_legal_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProducerVerificationDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('file', models.FileField(upload_to='producers/verification_documents/', verbose_name='Arquivo')),
                ('original_filename', models.CharField(max_length=255, verbose_name='Nome original')),
                ('content_type', models.CharField(blank=True, max_length=120, verbose_name='Tipo de conteúdo')),
                ('size', models.PositiveIntegerField(default=0, verbose_name='Tamanho em bytes')),
                ('submitted_at', models.DateTimeField(auto_now_add=True, verbose_name='Enviado em')),
                ('producer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verification_documents', to='producers.producerprofile', verbose_name='Produtor')),
            ],
            options={
                'verbose_name': 'Documento de Verificação',
                'verbose_name_plural': 'Documentos de Verificação',
                'ordering': ['-submitted_at'],
            },
        ),
    ]
