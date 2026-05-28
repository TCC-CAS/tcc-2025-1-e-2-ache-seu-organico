import json

from django.urls import reverse
from django.http import QueryDict
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from apps.common.models import Address
from apps.locations.models import Location
from apps.producers.models import ProducerProfile
from apps.products.models import Category, Product
from apps.users.models import User
from .serializers import LocationCreateUpdateSerializer


class LocationCreateUpdateSerializerTests(SimpleTestCase):
    def test_accepts_json_fields_from_multipart_payload(self):
        data = QueryDict('', mutable=True)
        data.update({
            'name': 'Teste Teste Feira',
            'location_type': 'FAIR',
            'description': 'Teste Feira',
            'address': json.dumps({
                'street': 'Avenida Brigadeiro Faria Lima',
                'number': '123',
                'complement': '',
                'neighborhood': 'Jardim Paulistano',
                'city': 'Sao Paulo',
                'state': 'SP',
                'zip_code': '01451-000',
                'latitude': -23.5773909,
                'longitude': -46.686881,
            }),
            'operation_days': 'Todo dia',
            'operation_hours': '7h e 14h',
            'phone': '',
            'whatsapp': '',
            'product_ids': '[70,1]',
        })

        serializer = LocationCreateUpdateSerializer(data=data)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['product_ids'], [70, 1])
        self.assertEqual(
            serializer.validated_data['address']['street'],
            'Avenida Brigadeiro Faria Lima',
        )


class LocationProductCountTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='produtor@example.com',
            password='senha-forte',
            first_name='Produtor',
            last_name='Teste',
            user_type=User.UserType.PRODUCER,
        )
        self.producer = ProducerProfile.objects.create(
            user=self.user,
            business_name='Orgânicos Teste',
        )
        self.address = Address.objects.create(
            street='Rua Teste',
            number='123',
            neighborhood='Centro',
            city='Sao Paulo',
            state='SP',
            zip_code='01000-000',
            latitude=-23.550520,
            longitude=-46.633308,
        )
        self.location = Location.objects.create(
            producer=self.producer,
            name='Feira Teste',
            location_type=Location.LocationType.FAIR,
            address=self.address,
        )
        self.category = Category.objects.create(
            name='Verduras',
            slug='verduras',
        )
        products = [
            Product.objects.create(
                producer=self.producer,
                category=self.category,
                name=f'Produto {index}',
            )
            for index in range(3)
        ]
        self.location.products.set(products)

    def test_map_data_returns_product_count(self):
        response = self.client.get(reverse('location-map-data'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['product_count'], 3)

    def test_my_locations_returns_product_count(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse('location-my-locations'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['product_count'], 3)
