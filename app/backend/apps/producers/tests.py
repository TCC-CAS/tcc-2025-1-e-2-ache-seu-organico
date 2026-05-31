from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import ProducerVerificationDocument


class ProducerVerificationDocumentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='produtor-docs@example.com',
            password='senha-segura-123',
            first_name='Produtor',
            last_name='Docs',
            user_type=User.UserType.PRODUCER,
        )
        self.profile = self.user.producer_profile
        self.profile.legal_name = 'Produtor Docs LTDA'
        self.profile.cnpj = '12.345.678/0001-90'
        self.profile.state_registration = '123456789'
        self.profile.save()
        self.client.force_authenticate(user=self.user)

    def test_uploads_documents_temporarily_and_saves_on_submit(self):
        upload_response = self.client.post(
            reverse('producer-upload-verification-document'),
            {
                'files': [
                    SimpleUploadedFile(
                        'contrato.pdf',
                        b'conteudo do documento',
                        content_type='application/pdf',
                    )
                ]
            },
            format='multipart',
        )

        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        token = upload_response.data['files'][0]['token']
        self.assertEqual(ProducerVerificationDocument.objects.count(), 0)

        submit_response = self.client.post(
            reverse('producer-submit-verification'),
            {'document_tokens': [token]},
            format='json',
        )

        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        document = ProducerVerificationDocument.objects.get()
        self.assertEqual(document.producer, self.profile)
        self.assertEqual(document.original_filename, 'contrato.pdf')
        self.assertTrue(document.file.name)
