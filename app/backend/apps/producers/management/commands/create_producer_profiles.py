from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.producers.models import ProducerProfile


class Command(BaseCommand):
    help = 'Cria ProducerProfile para todos os usuários do tipo PRODUCER que não possuem'

    def handle(self, *args, **options):
        producers_without_profile = User.objects.filter(
            user_type='PRODUCER'
        ).exclude(
            id__in=ProducerProfile.objects.values_list('user_id', flat=True)
        )

        created_count = 0
        for user in producers_without_profile:
            ProducerProfile.objects.create(
                user=user,
                business_name=f"{user.first_name} {user.last_name}".strip() or user.email
            )
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'✓ Perfil criado para: {user.email}')
            )

        if created_count == 0:
            self.stdout.write(
                self.style.WARNING('Nenhum produtor sem perfil encontrado.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n{created_count} perfil(is) de produtor criado(s) com sucesso!')
            )
