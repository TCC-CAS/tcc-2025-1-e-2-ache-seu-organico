import json

from django.http import QueryDict
from django.test import SimpleTestCase

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
