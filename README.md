# Ache Seu Orgânico

Projeto desenvolvido como Trabalho de Conclusão de Curso. A aplicação tem como objetivo aproximar consumidores de produtores orgânicos, permitindo a consulta de feiras e pontos de venda, gerenciamento de produtos, favoritos, mensagens, notificações, planos de assinatura e verificação empresarial de produtores.

Aplicação em produção: https://acheseuorganico.com.br

## 1. Visão Geral da Aplicação

O sistema é dividido em duas aplicações principais:

- Backend: API REST e WebSocket desenvolvidos com Django, Django REST Framework e Django Channels.
- Frontend: aplicação web SPA desenvolvida com React, TypeScript e Vite.

Principais módulos funcionais:

- Autenticação com JWT.
- Cadastro de consumidores e produtores.
- Perfil empresarial do produtor.
- Cadastro de produtos orgânicos.
- Cadastro de feiras, lojas, propriedades e pontos de venda.
- Busca e visualização em mapa com Leaflet.
- Favoritos.
- Mensagens em tempo real via WebSocket.
- Notificações.
- Analytics de visualizações e interações.
- Planos de assinatura e regras de limite por plano.
- Verificação empresarial com upload de documentos.
- Painel administrativo Django para gestão dos dados.

## 2. Stack Técnica

### Backend

- Python 3.10 ou superior.
- Django 5.0.1.
- Django REST Framework.
- Django Channels.
- Daphne ASGI server.
- Simple JWT para autenticação.
- MySQL em produção.
- Redis para camada de canais WebSocket em produção.
- drf-spectacular para documentação OpenAPI.
- Pillow para manipulação de imagens.

### Frontend

- Node.js 18 ou superior.
- React 18.
- TypeScript.
- Vite.
- React Router.
- Axios.
- Leaflet e React Leaflet.
- Lucide React.
- Vite PWA.

### Banco, cache e serviços auxiliares

- MySQL 8 ou compatível.
- Redis 6 ou superior.
- Servidor HTTP reverso recomendado: Nginx ou Apache.
- Processo ASGI recomendado para o backend: Daphne.

## 3. Estrutura do Repositório

```text
.
├── app/
│   ├── backend/
│   │   ├── apps/
│   │   │   ├── analytics/
│   │   │   ├── billing/
│   │   │   ├── chat/
│   │   │   ├── common/
│   │   │   ├── favorites/
│   │   │   ├── locations/
│   │   │   ├── notifications/
│   │   │   ├── producers/
│   │   │   ├── products/
│   │   │   └── users/
│   │   ├── config/
│   │   ├── media/
│   │   ├── manage.py
│   │   └── requirements.txt
│   └── frontend/
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── docs/
├── LICENSE
└── README.md
```

## 4. Requisitos para Execução Local

Instalar previamente:

- Python 3.10 ou superior.
- Node.js 18 ou superior.
- npm.
- MySQL 8 ou compatível.
- Redis, obrigatório para simular WebSocket em ambiente semelhante à produção. Em desenvolvimento, o sistema também pode usar camada em memória.
- Bibliotecas de desenvolvimento do MySQL para instalação do `mysqlclient`.

Em distribuições Ubuntu/Debian, as dependências do MySQL podem ser instaladas com:

```bash
sudo apt update
sudo apt install mysql-server mysql-client libmysqlclient-dev
```

## 5. Configuração do Banco de Dados MySQL

Acesse o MySQL como usuário administrativo:

```bash
mysql -u root -p
```

Crie o banco e o usuário da aplicação:

```sql
CREATE DATABASE ache_seu_organico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'acheorg_user'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON ache_seu_organico.* TO 'acheorg_user'@'localhost';
FLUSH PRIVILEGES;
```

## 6. Variáveis de Ambiente do Backend

No diretório `app/backend`, crie o arquivo `.env` a partir do exemplo:

```bash
cd app/backend
cp .env.example .env
```

Configuração mínima para desenvolvimento local com MySQL:

```env
SECRET_KEY=altere-esta-chave
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.mysql
DB_NAME=ache_seu_organico
DB_USER=acheorg_user
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

USE_REDIS_CHANNEL_LAYER=False
REDIS_URL=redis://127.0.0.1:6379/0

JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

Para produção, recomenda-se:

```env
SECRET_KEY=uma-chave-segura-e-exclusiva
DEBUG=False
ALLOWED_HOSTS=acheseuorganico.com.br,www.acheseuorganico.com.br

DB_ENGINE=django.db.backends.mysql
DB_NAME=ache_seu_organico
DB_USER=acheorg_user
DB_PASSWORD=senha-segura
DB_HOST=localhost
DB_PORT=3306

CORS_ALLOWED_ORIGINS=https://acheseuorganico.com.br

USE_REDIS_CHANNEL_LAYER=True
REDIS_URL=redis://127.0.0.1:6379/0

FRONTEND_URL=https://acheseuorganico.com.br
BACKEND_URL=https://acheseuorganico.com.br
```

Quando houver integração de pagamentos, configurar também as variáveis relacionadas a Stripe ou InfinitePay presentes em `config/settings.py`.

## 7. Execução Local do Backend

A partir da raiz do repositório:

```bash
cd app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

Backend local:

```text
http://localhost:8000
```

Painel administrativo:

```text
http://localhost:8000/admin/
```

Documentação da API:

```text
http://localhost:8000/api/docs/
http://localhost:8000/api/redoc/
```

## 8. Variáveis de Ambiente do Frontend

No diretório `app/frontend`, crie ou ajuste o arquivo `.env`.

Desenvolvimento local:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000
VITE_MEDIA_BASE_URL=http://localhost:8000/media
```

Produção:

```env
VITE_API_BASE_URL=https://acheseuorganico.com.br/api
VITE_WS_BASE_URL=wss://acheseuorganico.com.br
VITE_MEDIA_BASE_URL=https://acheseuorganico.com.br/media
```

## 9. Execução Local do Frontend

A partir da raiz do repositório:

```bash
cd app/frontend
npm install
npm run dev
```

Frontend local:

```text
http://localhost:5173
```

## 10. Build do Frontend

Para gerar os arquivos estáticos de produção:

```bash
cd app/frontend
npm install
npm run build
```

O resultado será gerado em:

```text
app/frontend/dist/
```

Para validar localmente o build:

```bash
npm run preview
```

## 11. Testes e Verificações

Backend:

```bash
cd app/backend
source venv/bin/activate
python3 manage.py check
python3 manage.py test
```

Frontend:

```bash
cd app/frontend
npm run build
```

Observação: o script de lint presente no projeto depende da configuração atual do ESLint. Caso a versão local do ESLint não aceite alguma flag do script, a validação mínima recomendada para entrega é o build TypeScript com Vite.

## 12. Implantação em Produção

Esta seção descreve o procedimento geral de deployment utilizado para publicar a aplicação em ambiente Linux com MySQL, Redis, Daphne e servidor reverso.

### 12.1 Preparação do servidor

Instalar os pacotes necessários:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip mysql-server mysql-client libmysqlclient-dev redis-server nginx
```

Clonar o repositório:

```bash
git clone <url-do-repositorio>
cd tcc-2025-1-e-2-ache-seu-organico
```

### 12.2 Configuração do backend em produção

```bash
cd app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Editar `.env` com:

- `DEBUG=False`.
- `ALLOWED_HOSTS=acheseuorganico.com.br,www.acheseuorganico.com.br`.
- Credenciais reais do MySQL.
- `USE_REDIS_CHANNEL_LAYER=True`.
- `REDIS_URL` apontando para o Redis de produção.
- URLs públicas `FRONTEND_URL` e `BACKEND_URL`.
- Chave `SECRET_KEY` segura.

Aplicar migrações e coletar arquivos estáticos:

```bash
python3 manage.py migrate
python3 manage.py collectstatic
python3 manage.py createsuperuser
```

O diretório de estáticos do Django é:

```text
app/backend/staticfiles/
```

O diretório de uploads de mídia é:

```text
app/backend/media/
```

Este diretório deve ser persistente em produção, pois armazena imagens, documentos de verificação empresarial e demais arquivos enviados por usuários.

### 12.3 Execução ASGI do backend

O backend utiliza ASGI por causa dos WebSockets do módulo de chat. O comando base para execução é:

```bash
cd app/backend
source venv/bin/activate
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

Em produção, recomenda-se executar esse comando por meio de `systemd`, `supervisor` ou outro gerenciador de processos, com reinicialização automática em caso de falha.

Exemplo de unidade `systemd`:

```ini
[Unit]
Description=Ache Seu Organico Backend
After=network.target mysql.service redis-server.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/caminho/do/projeto/app/backend
Environment="DJANGO_SETTINGS_MODULE=config.settings"
ExecStart=/caminho/do/projeto/app/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 config.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Após criar a unidade:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ache-seu-organico-backend
sudo systemctl start ache-seu-organico-backend
```

### 12.4 Build e publicação do frontend

```bash
cd app/frontend
npm install
npm run build
```

Publicar o conteúdo de `app/frontend/dist/` no servidor web. Em uma implantação com Nginx, esse diretório pode ser usado como `root` do domínio.

### 12.5 Exemplo de configuração Nginx

Exemplo simplificado para servir o frontend, encaminhar API e WebSocket para o Daphne e disponibilizar arquivos estáticos e mídia:

```nginx
server {
    listen 80;
    server_name acheseuorganico.com.br www.acheseuorganico.com.br;

    root /caminho/do/projeto/app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /caminho/do/projeto/app/backend/staticfiles/;
    }

    location /media/ {
        alias /caminho/do/projeto/app/backend/media/;
    }
}
```

Para HTTPS, recomenda-se utilizar Certbot ou mecanismo equivalente para emitir certificado TLS. Em produção, a URL pública utilizada pelo projeto é:

```text
https://acheseuorganico.com.br
```

## 13. Redis e WebSocket

O módulo de mensagens utiliza Django Channels. Em desenvolvimento, quando `DEBUG=True` e `USE_REDIS_CHANNEL_LAYER=False`, o backend pode usar camada em memória. Essa configuração é suficiente para testes locais simples.

Em produção, Redis é obrigatório para estabilidade dos WebSockets, especialmente quando houver múltiplos processos ou reinicialização do servidor ASGI.

Configuração recomendada:

```env
USE_REDIS_CHANNEL_LAYER=True
REDIS_URL=redis://127.0.0.1:6379/0
```

Se o Redis estiver em outro host ou possuir autenticação, ajustar a URL:

```env
REDIS_URL=redis://usuario:senha@redis-host:6379/0
```

## 14. Rotas Principais

### Autenticação

- `POST /api/token/`
- `POST /api/token/refresh/`
- `POST /api/users/register/`
- `GET /api/users/me/`
- `PATCH /api/users/me/`
- `DELETE /api/users/me/`

### Produtores

- `GET /api/producers/`
- `GET /api/producers/me/`
- `PATCH /api/producers/me/`
- `POST /api/producers/upload_verification_document/`
- `POST /api/producers/submit_verification/`

### Localizações e mapa

- `GET /api/locations/`
- `POST /api/locations/`
- `GET /api/locations/map_data/`
- `GET /api/locations/my_locations/`

### Produtos

- `GET /api/products/`
- `POST /api/products/`
- `GET /api/products/categories/`

### Favoritos, mensagens, notificações e analytics

- `GET /api/favorites/`
- `POST /api/favorites/toggle/`
- `GET /api/chat/conversations/`
- `GET /api/notifications/`
- `GET /api/analytics/`

## 15. Observações de Operação

- O banco de produção deve usar `utf8mb4` para suportar corretamente acentuação e caracteres especiais.
- O diretório `media/` deve ser preservado entre deploys.
- O comando `python3 manage.py migrate` deve ser executado a cada nova versão com migrations.
- Após mudanças no frontend, é necessário executar `npm run build` e publicar novamente o conteúdo de `dist/`.
- Após mudanças no backend, o processo Daphne deve ser reiniciado.
- Em produção, `DEBUG` deve permanecer como `False`.
- O domínio público deve estar presente em `ALLOWED_HOSTS` e em `CORS_ALLOWED_ORIGINS`.

## 16. Licença e Contexto Acadêmico

Este projeto integra a entrega acadêmica do Trabalho de Conclusão de Curso do Senac. O repositório contém o código-fonte da aplicação, documentação técnica, instruções de execução local e informações de implantação necessárias para avaliação e reprodução do ambiente.
