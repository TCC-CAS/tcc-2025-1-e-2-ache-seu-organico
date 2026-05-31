from django.db import migrations


def set_mysql_fk_to_set_null(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != 'mysql':
        return

    table_name = 'analytics_activitylog'
    column_name = 'user_id'
    referenced_table = 'users_user'
    constraint_name = 'analytics_activitylog_user_id_set_null_fk'

    with connection.cursor() as cursor:
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

    table_name = 'analytics_activitylog'
    column_name = 'user_id'
    referenced_table = 'users_user'
    constraint_name = 'analytics_activitylog_user_id_d7739206_fk_users_user_id'

    with connection.cursor() as cursor:
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
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(set_mysql_fk_to_set_null, reverse_mysql_fk_to_restrict),
    ]
