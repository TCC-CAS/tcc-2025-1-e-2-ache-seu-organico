from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.analytics.models import ActivityLog
from apps.common.models import Address
from apps.locations.models import Location
from apps.notifications.models import Notification
from apps.products.models import Category, Product
from .models import User


class UserAccountDeletionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='usuario@example.com',
            password='senha-segura-123',
            first_name='Usuário',
            last_name='Teste',
        )

    def test_authenticated_user_can_delete_own_account(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(reverse('user-me'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())

    def test_deleting_account_anonymizes_related_records_that_should_be_kept(self):
        other_user = User.objects.create_user(
            email='destinatario@example.com',
            password='senha-segura-123',
            first_name='Destinatário',
            last_name='Teste',
        )
        activity = ActivityLog.objects.create(
            user=self.user,
            activity_type=ActivityLog.ActivityType.SEARCH,
        )
        notification = Notification.objects.create(
            recipient=other_user,
            author=self.user,
            notification_type=Notification.NotificationType.SYSTEM,
            title='Aviso',
            message='Mensagem de teste',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(reverse('user-me'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        activity.refresh_from_db()
        notification.refresh_from_db()
        self.assertIsNone(activity.user)
        self.assertIsNone(notification.author)

    def test_deleting_producer_account_anonymizes_activity_logs_for_owned_assets(self):
        producer_user = User.objects.create_user(
            email='produtor@example.com',
            password='senha-segura-123',
            first_name='Produtor',
            last_name='Teste',
            user_type=User.UserType.PRODUCER,
        )
        producer_profile = producer_user.producer_profile
        category = Category.objects.create(name='Verduras', slug='verduras')
        product = Product.objects.create(
            name='Alface',
            producer=producer_profile,
            category=category,
        )
        address = Address.objects.create(
            street='Rua Teste',
            number='123',
            neighborhood='Centro',
            city='São Paulo',
            state='SP',
            zip_code='01000-000',
        )
        location = Location.objects.create(
            producer=producer_profile,
            name='Feira Teste',
            address=address,
        )
        producer_log = ActivityLog.objects.create(
            producer=producer_profile,
            activity_type=ActivityLog.ActivityType.PRODUCER_VIEW,
        )
        location_log = ActivityLog.objects.create(
            location=location,
            activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
        )
        product_log = ActivityLog.objects.create(
            product=product,
            activity_type=ActivityLog.ActivityType.PRODUCT_VIEW,
        )
        self.client.force_authenticate(user=producer_user)

        response = self.client.delete(reverse('user-me'))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=producer_user.pk).exists())
        producer_log.refresh_from_db()
        location_log.refresh_from_db()
        product_log.refresh_from_db()
        self.assertIsNone(producer_log.producer)
        self.assertIsNone(location_log.location)
        self.assertIsNone(product_log.product)

    def test_deleting_location_detaches_activity_logs_before_database_delete(self):
        producer_user = User.objects.create_user(
            email='produtor-location@example.com',
            password='senha-segura-123',
            first_name='Produtor',
            last_name='Location',
            user_type=User.UserType.PRODUCER,
        )
        address = Address.objects.create(
            street='Rua Teste',
            number='456',
            neighborhood='Centro',
            city='São Paulo',
            state='SP',
            zip_code='01000-001',
        )
        location = Location.objects.create(
            producer=producer_user.producer_profile,
            name='Feira com Log',
            address=address,
        )
        activity = ActivityLog.objects.create(
            location=location,
            activity_type=ActivityLog.ActivityType.LOCATION_VIEW,
        )

        location.delete()

        activity.refresh_from_db()
        self.assertIsNone(activity.location)

    def test_anonymous_user_cannot_delete_account(self):
        response = self.client.delete(reverse('user-me'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_non_staff_user_cannot_delete_another_user(self):
        other_user = User.objects.create_user(
            email='outro@example.com',
            password='senha-segura-123',
            first_name='Outro',
            last_name='Usuário',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(reverse('user-detail', kwargs={'pk': other_user.pk}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(User.objects.filter(pk=other_user.pk).exists())
