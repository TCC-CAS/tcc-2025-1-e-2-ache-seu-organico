import django.db.models.deletion
from django.db import migrations, models


def set_mysql_fk_to_set_null(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != 'mysql':
        return

    constraints = [
        (
            'analytics_activitylog',
            'location_id',
            'locations_location',
            'analytics_activitylog_location_id_set_null_fk',
        ),
        (
            'analytics_activitylog',
            'product_id',
            'products_product',
            'analytics_activitylog_product_id_set_null_fk',
        ),
        (
            'analytics_activitylog',
            'producer_id',
            'producers_producerprofile',
            'analytics_activitylog_producer_id_set_null_fk',
        ),
    ]

    with connection.cursor() as cursor:
        for table_name, column_name, referenced_table, constraint_name in constraints:
            cursor.execute(
                """
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = %s
                  AND REFERENCED_TABLE_NAME = %s
                """,
                [table_name, column_name, referenced_table],
            )
            existing_constraints = [row[0] for row in cursor.fetchall()]

            for existing_constraint in existing_constraints:
                cursor.execute(
                    f'ALTER TABLE `{table_name}` DROP FOREIGN KEY `{existing_constraint}`'
                )

            cursor.execute(
                f"""
                ALTER TABLE `{table_name}`
                ADD CONSTRAINT `{constraint_name}`
                FOREIGN KEY (`{column_name}`)
                REFERENCES `{referenced_table}` (`id`)
                ON DELETE SET NULL
                """
            )


def reverse_mysql_fk_to_restrict(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != 'mysql':
        return

    constraints = [
        (
            'analytics_activitylog',
            'location_id',
            'locations_location',
            'analytics_activitylo_location_id_8807bf10_fk_locations',
        ),
        (
            'analytics_activitylog',
            'product_id',
            'products_product',
            'analytics_activitylog_product_id_restrict_fk',
        ),
        (
            'analytics_activitylog',
            'producer_id',
            'producers_producerprofile',
            'analytics_activitylog_producer_id_restrict_fk',
        ),
    ]

    with connection.cursor() as cursor:
        for table_name, column_name, referenced_table, constraint_name in constraints:
            cursor.execute(
                """
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = %s
                  AND REFERENCED_TABLE_NAME = %s
                """,
                [table_name, column_name, referenced_table],
            )
            existing_constraints = [row[0] for row in cursor.fetchall()]

            for existing_constraint in existing_constraints:
                cursor.execute(
                    f'ALTER TABLE `{table_name}` DROP FOREIGN KEY `{existing_constraint}`'
                )

            cursor.execute(
                f"""
                ALTER TABLE `{table_name}`
                ADD CONSTRAINT `{constraint_name}`
                FOREIGN KEY (`{column_name}`)
                REFERENCES `{referenced_table}` (`id`)
                """
            )


class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0002_fix_activitylog_user_fk_set_null'),
        ('locations', '0002_initial'),
        ('products', '0002_product_producer'),
        ('producers', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activitylog',
            name='location',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='activity_logs',
                to='locations.location',
                verbose_name='Localização',
            ),
        ),
        migrations.AlterField(
            model_name='activitylog',
            name='product',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='activity_logs',
                to='products.product',
                verbose_name='Produto',
            ),
        ),
        migrations.AlterField(
            model_name='activitylog',
            name='producer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='activity_logs',
                to='producers.producerprofile',
                verbose_name='Produtor',
            ),
        ),
        migrations.RunPython(set_mysql_fk_to_set_null, reverse_mysql_fk_to_restrict),
    ]
