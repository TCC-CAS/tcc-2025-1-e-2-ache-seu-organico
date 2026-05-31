from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0002_seed_three_plans'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscriptionplan',
            name='code',
            field=models.CharField(
                choices=[('FREE', 'Gratuito'), ('BASIC', 'Basico'), ('PREMIUM', 'Premium')],
                max_length=20,
                unique=True,
            ),
        ),
    ]
