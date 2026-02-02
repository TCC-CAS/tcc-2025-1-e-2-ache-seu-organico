# Guia de Upload de Imagens

## Implementação Completa ✅

O sistema de upload de imagens foi implementado com sucesso para as localizações (feiras/lojas).

### O que foi implementado:

#### Backend (Django)
1. **Configuração de Mídia** - Já estava configurado
   - `MEDIA_URL = 'media/'`
   - `MEDIA_ROOT = BASE_DIR / 'media'`
   - URLs servindo arquivos estáticos em desenvolvimento

2. **Modelo Location** - Já tinha o campo
   - Campo `main_image = ImageField(upload_to='locations/', blank=True, null=True)`
   - Campo `LocationImage` para galeria adicional (futuro)

3. **Serializer Atualizado**
   - Suporte a FormData com parsing de JSON string para o campo address
   - Método `to_internal_value` trata address enviado como string JSON

#### Frontend (React + TypeScript)
1. **API Service (`locations.ts`)**
   - Métodos `create` e `update` aceitam `FormData` ou `LocationCreateUpdatePayload`
   - Headers automáticos `multipart/form-data` quando FormData é detectado

2. **FairForm Component**
   - Interface `FairFormData` expandida com `main_image?: File | null` e `main_image_url?: string`
   - Preview de imagem ao selecionar arquivo
   - Validação: tipo de arquivo (image/*) e tamanho máximo (5MB)
   - Botão para remover imagem selecionada
   - Ícones Upload e X importados do lucide-react

3. **MinhasFeirasPage**
   - Lógica para enviar FormData quando há imagem
   - Campos serializados corretamente: address como JSON string no FormData
   - Passagem de `main_image_url` ao editar localização
   - Coluna de imagem adicionada à tabela
   - Exibição de thumbnail (60x60px) ou ícone placeholder

4. **Estilos CSS**
   - `.image-upload-container`: área de upload com drag-and-drop visual
   - `.image-upload-label`: botão estilizado com ícone e instruções
   - `.image-preview`: preview da imagem com botão de remoção
   - `.btn-remove-image`: botão circular no canto superior direito
   - `.location-image`: coluna da tabela com imagens arredondadas

### Como Usar:

#### Cadastrar Nova Feira com Imagem:
1. Clique em "Nova Feira" na página Minhas Feiras
2. Preencha os dados básicos e endereço (CEP busca automático)
3. Na seção "Informações Básicas", clique em "Clique para adicionar uma imagem"
4. Selecione uma imagem (PNG, JPG, WEBP - máx 5MB)
5. O preview aparecerá imediatamente
6. Finalize o cadastro normalmente

#### Editar Localização:
1. Clique no botão editar (ícone verde)
2. Se houver imagem, ela será exibida no preview
3. Para trocar: clique no X e faça novo upload
4. Para remover: clique no X e salve sem adicionar nova

#### Visualizar na Tabela:
- A coluna "Imagem" mostra thumbnail 60x60px
- Se não houver imagem, exibe ícone da loja em fundo cinza

### Estrutura de Arquivos Salvos:
```
app/backend/media/
  └── locations/
      ├── feira-organica-parque_abc123.jpg
      ├── loja-produtos-naturais_def456.png
      └── ...
```

### Preparação para S3 (Futuro):
O código está pronto para migração para S3. Basta:
1. Instalar `django-storages` e `boto3`
2. Configurar as credenciais AWS no `.env`
3. Atualizar `settings.py` com storage backend
4. As URLs das imagens mudarão automaticamente

### Validações Implementadas:
- ✅ Tipo de arquivo: apenas imagens
- ✅ Tamanho máximo: 5MB
- ✅ Preview antes do upload
- ✅ Remoção de imagem
- ✅ Compatibilidade com edição

### Próximos Passos (Opcional):
1. Adicionar galeria de imagens (LocationImage model já existe)
2. Crop/resize automático no backend
3. Suporte a drag-and-drop direto
4. Progress bar durante upload
5. Migrar para S3/CloudFront para produção

## Testando

### Teste Básico:
```bash
# Frontend
cd app/frontend
npm run dev

# Backend (terminal separado)
cd app/backend
python3 manage.py runserver
```

1. Acesse http://localhost:5173
2. Faça login como produtor
3. Vá em "Minhas Feiras"
4. Crie uma nova feira e adicione uma imagem
5. Verifique se o thumbnail aparece na tabela
6. Edite e troque a imagem
7. Confirme que a imagem foi salva em `app/backend/media/locations/`

### Verificar Backend:
```bash
# Ver arquivos salvos
ls -lh app/backend/media/locations/

# Ver registros no banco
cd app/backend
python3 manage.py shell
>>> from apps.locations.models import Location
>>> loc = Location.objects.first()
>>> print(loc.main_image.url)  # URL da imagem
>>> print(loc.main_image.path)  # Caminho no sistema de arquivos
```

## Notas Técnicas

- **FormData**: Usado apenas quando há arquivo. JSON puro quando não há upload.
- **Address Parsing**: Backend detecta e parseia address enviado como string JSON.
- **CORS**: Já configurado para localhost:5173.
- **Content-Type**: Axios define automaticamente `multipart/form-data` com boundary.
