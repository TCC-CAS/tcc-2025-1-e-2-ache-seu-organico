# Ache Seu Orgânico - Backend

API REST para a plataforma de gerenciamento e divulgação de produtores orgânicos.

## 🛠 Tecnologias

- **Python 3.10+**
- **Django 5.0**
- **Django REST Framework**
- **PostgreSQL** (ou SQLite para desenvolvimento)
- **JWT Authentication**

## 📂 Estrutura do Projeto

```
backend/
├── config/              # Configurações Django
├── apps/
│   ├── users/          # Autenticação e usuários
│   ├── producers/      # Perfis de produtores
│   ├── locations/      # Pontos de venda/feiras
│   ├── products/       # Catálogo de produtos
│   ├── favorites/      # Sistema de favoritos
│   └── common/         # Modelos compartilhados
├── manage.py
└── requirements.txt
```

## 🚀 Instalação

### 1. Criar ambiente virtual

```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Executar migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Criar superusuário

```bash
python manage.py createsuperuser
```

### 6. Executar servidor

```bash
python manage.py runserver
```

A API estará disponível em: `http://localhost:8000`

## 📋 Endpoints Principais

### Autenticação
- `POST /api/token/` - Obter token JWT
- `POST /api/token/refresh/` - Renovar token
- `POST /api/users/register/` - Registrar novo usuário

### Usuários
- `GET /api/users/me/` - Perfil do usuário atual
- `PUT /api/users/me/` - Atualizar perfil

### Produtores
- `GET /api/producers/` - Listar produtores
- `POST /api/producers/` - Criar perfil de produtor
- `GET /api/producers/me/` - Perfil do produtor atual
- `PUT /api/producers/me/` - Atualizar perfil do produtor

### Localizações
- `GET /api/locations/` - Listar localizações
- `GET /api/locations/map_data/` - Dados para o mapa
- `GET /api/locations/my_locations/` - Minhas localizações
- `POST /api/locations/` - Criar localização
- `PUT /api/locations/{id}/` - Atualizar localização

### Produtos
- `GET /api/products/` - Listar produtos
- `GET /api/products/categories/` - Listar categorias

### Favoritos
- `GET /api/favorites/` - Meus favoritos
- `POST /api/favorites/toggle/` - Adicionar/remover favorito
- `GET /api/favorites/check/?location_id=123` - Verificar se é favorito

## 🔑 Autenticação

A API usa JWT (JSON Web Tokens). Para autenticar:

1. Obtenha o token:
```bash
POST /api/token/
{
  "email": "usuario@example.com",
  "password": "senha"
}
```

2. Use o token nas requisições:
```
Authorization: Bearer <seu_token_aqui>
```

## 👤 Tipos de Usuário

- **CONSUMER**: Usuário consumidor (padrão)
- **PRODUCER**: Produtor orgânico

## 📝 Admin Panel

Acesse o painel administrativo em: `http://localhost:8000/admin`

## 🧪 Testes

```bash
python manage.py test
```

## 📦 Modelos Principais

### User
- Email como identificador único
- Tipos: CONSUMER ou PRODUCER
- Campos: nome, telefone, avatar

### ProducerProfile
- Estende usuário PRODUCER
- Nome do negócio, descrição, certificações
- Redes sociais

### Location
- Pontos de venda dos produtores
- Endereço com geolocalização (lat/lng)
- Produtos disponíveis
- Horários de funcionamento

### Product
- Catálogo de produtos orgânicos
- Categorias (frutas, verduras, grãos, etc.)

### Favorite
- Usuários podem favoritar localizações

## 🗄 Banco de Dados

### MySQL (Recomendado)

1. **Instalar MySQL:**
```bash
# Ubuntu/Debian
sudo apt-get install mysql-server mysql-client libmysqlclient-dev

# macOS (Homebrew)
brew install mysql

# Windows: Baixe do site oficial
```

2. **Criar banco de dados:**
```bash
mysql -u root -p
```
```sql
CREATE DATABASE ache_seu_organico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'acheorg_user'@'localhost' IDENTIFIED BY 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON ache_seu_organico.* TO 'acheorg_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Configurar .env:**
```env
DB_ENGINE=django.db.backends.mysql
DB_NAME=ache_seu_organico
DB_USER=acheorg_user
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=3306
```

### SQLite (Desenvolvimento apenas)
Já configurado por padrão. Para usar SQLite:
```env
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### PostgreSQL (Alternativa)
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ache_seu_organico
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
```

## 📄 Licença

Este projeto é parte do TCC do curso Senac.
