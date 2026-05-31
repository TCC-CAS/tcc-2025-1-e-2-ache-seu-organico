from pathlib import Path
from uuid import uuid4

from django.core.files.base import File
from django.core.files.storage import default_storage
from django.core.signing import BadSignature, dumps, loads
from django.utils.text import get_valid_filename
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework import serializers
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from .models import ProducerProfile, ProducerVerificationDocument
from .serializers import (
    ProducerProfileSerializer,
    ProducerProfileCreateSerializer,
    ProducerProfileListSerializer
)
from apps.users.models import User


class ProducerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProducerProfile model.
    """
    queryset = ProducerProfile.objects.select_related('user').filter(is_active=True)
    serializer_class = ProducerProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProducerProfileListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProducerProfileCreateSerializer
        return ProducerProfileSerializer

    def get_permissions(self):
        """
        Only authenticated users can create/update profiles.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        """
        Create producer profile for current user.
        """
        if self.request.user.user_type != User.UserType.PRODUCER:
            raise serializers.ValidationError(
                "Apenas usuários do tipo 'Produtor' podem criar perfis de produtor."
            )
        
        if hasattr(self.request.user, 'producer_profile'):
            raise serializers.ValidationError(
                "Este usuário já possui um perfil de produtor."
            )
        
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """
        Only the profile owner can update their profile.
        """
        if serializer.instance.user != self.request.user:
            raise serializers.ValidationError(
                "Você só pode atualizar seu próprio perfil."
            )
        serializer.save()

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """
        Get or update current user's producer profile.
        GET/PUT/PATCH /api/producers/me/
        """
        try:
            profile = request.user.producer_profile
        except ProducerProfile.DoesNotExist:
            return Response(
                {'detail': 'Perfil de produtor não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            serializer = ProducerProfileSerializer(profile)
            return Response(serializer.data)
        
        serializer = ProducerProfileCreateSerializer(
            profile,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(ProducerProfileSerializer(profile).data)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_verification_document(self, request):
        """
        Upload files to temporary storage before verification is submitted.
        POST /api/producers/upload_verification_document/
        """
        try:
            profile = request.user.producer_profile
        except ProducerProfile.DoesNotExist:
            return Response(
                {'detail': 'Perfil de produtor não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        files = request.FILES.getlist('files') or request.FILES.getlist('file')
        if not files:
            return Response(
                {'detail': 'Envie pelo menos um arquivo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_files = []
        for uploaded_file in files:
            safe_name = get_valid_filename(Path(uploaded_file.name).name)
            storage_name = default_storage.save(
                f'tmp/producer_verification/{profile.id}/{uuid4().hex}_{safe_name}',
                uploaded_file,
            )
            payload = {
                'path': storage_name,
                'original_filename': uploaded_file.name,
                'content_type': uploaded_file.content_type or '',
                'size': uploaded_file.size,
                'producer_id': profile.id,
            }
            uploaded_files.append({
                'token': dumps(payload),
                'original_filename': uploaded_file.name,
                'content_type': uploaded_file.content_type or '',
                'size': uploaded_file.size,
            })

        return Response({'files': uploaded_files}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def submit_verification(self, request):
        """
        Submit business data for verification review.
        POST /api/producers/submit_verification/
        """
        try:
            profile = request.user.producer_profile
        except ProducerProfile.DoesNotExist:
            return Response(
                {'detail': 'Perfil de produtor não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        required_fields = {
            'Razão social': profile.legal_name,
            'CNPJ': profile.cnpj,
            'Inscrição estadual': profile.state_registration,
        }
        missing = [label for label, value in required_fields.items() if not value]
        if missing:
            return Response(
                {'detail': f'Preencha os campos obrigatórios antes de enviar: {", ".join(missing)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.is_verified:
            return Response(
                {'detail': 'Esta organização já está verificada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document_tokens = request.data.get('document_tokens', [])
        if isinstance(document_tokens, str):
            document_tokens = [document_tokens]

        profile.verification_status = ProducerProfile.VerificationStatus.PENDING
        profile.verification_submitted_at = timezone.now()
        profile.verification_notes = ''
        profile.save(update_fields=['verification_status', 'verification_submitted_at', 'verification_notes', 'updated_at'])

        for token in document_tokens:
            try:
                payload = loads(token)
            except BadSignature:
                continue

            if payload.get('producer_id') != profile.id:
                continue

            temp_path = payload.get('path')
            if not temp_path or not default_storage.exists(temp_path):
                continue

            safe_name = get_valid_filename(Path(payload.get('original_filename') or Path(temp_path).name).name)
            final_path = f'producers/verification_documents/{profile.id}/{uuid4().hex}_{safe_name}'
            with default_storage.open(temp_path, 'rb') as temp_file:
                stored_path = default_storage.save(final_path, File(temp_file))

            default_storage.delete(temp_path)
            ProducerVerificationDocument.objects.create(
                producer=profile,
                file=stored_path,
                original_filename=payload.get('original_filename') or safe_name,
                content_type=payload.get('content_type') or '',
                size=payload.get('size') or 0,
            )

        return Response(
            {
                'detail': 'Dados enviados para verificação com sucesso.',
                'verification_status': profile.verification_status,
                'verification_submitted_at': profile.verification_submitted_at,
            },
            status=status.HTTP_200_OK,
        )
