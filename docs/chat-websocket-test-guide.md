# Sistema de Chat com WebSocket - Guia de Teste

## 🚀 Como Testar o Sistema de Mensagens

### 1. Iniciar o Backend
```bash
cd app/backend
python3 manage.py runserver
```

### 2. Criar Usuários de Teste

**Opção A: Via Django Admin**
1. Acesse http://localhost:8000/admin
2. Entre com suas credenciais de superusuário
3. Vá em "Users" e crie 2 usuários:
   - Usuário 1 (Produtor): João Silva
   - Usuário 2 (Consumidor): Maria Santos

**Opção B: Via Python Shell**
```bash
python3 manage.py shell
```

```python
from apps.users.models import User
from apps.producers.models import Producer
from apps.locations.models import Location, Address

# Criar Produtor
produtor = User.objects.create_user(
    email='joao@produtor.com',
    password='senha123',
    full_name='João Silva',
    user_type='PRODUCER'
)

producer_profile = Producer.objects.create(
    user=produtor,
    name='Fazenda Orgânica Silva',
    phone='11999887766'
)

# Criar localização do produtor
address = Address.objects.create(
    street='Rua das Flores',
    number='123',
    neighborhood='Centro',
    city='São Paulo',
    state='SP',
    zip_code='01000000',
    latitude=-23.5505,
    longitude=-46.6333
)

location = Location.objects.create(
    producer=producer_profile,
    name='Feira da Fazenda Silva',
    description='Produtos orgânicos frescos',
    location_type='FAIR',
    address=address,
    phone='11999887766',
    is_verified=True
)

# Criar Consumidor
consumidor = User.objects.create_user(
    email='maria@consumidor.com',
    password='senha123',
    full_name='Maria Santos',
    user_type='CONSUMER'
)

print(f"✅ Produtor criado: {produtor.full_name} (ID: {produtor.id})")
print(f"✅ Consumidor criado: {consumidor.full_name} (ID: {consumidor.id})")
print(f"✅ Localização criada: {location.name} (ID: {location.id})")
```

### 3. Iniciar o Frontend
```bash
cd app/frontend
npm run dev
```

### 4. Testar o Fluxo Completo

#### Teste 1: Iniciar Conversa via Página da Localização
1. Faça login como consumidor (maria@consumidor.com)
2. Navegue para `/localizacao/1` (ou o ID da localização criada)
3. Clique no botão **"Enviar Mensagem"**
4. Você será redirecionado para `/mensagens` com a conversa aberta
5. Envie uma mensagem

#### Teste 2: Iniciar Conversa via Favoritos
1. Faça login como consumidor
2. Adicione a localização aos favoritos
3. Vá para `/mensagens`
4. Clique em **"Nova Conversa"**
5. Selecione o produtor da lista de favoritos
6. A conversa será iniciada

#### Teste 3: Responder Mensagens (WebSocket Real-Time)
1. Abra duas abas do navegador
2. Na aba 1: Login como consumidor (maria@consumidor.com)
3. Na aba 2: Login como produtor (joao@produtor.com)
4. Ambos vão para `/mensagens` e abrem a mesma conversa
5. Envie mensagens de uma aba e veja aparecer em tempo real na outra

### 5. Testar WebSocket Diretamente

**Via Browser Console:**
```javascript
// Obter o token JWT
const token = localStorage.getItem('access_token')

// Conectar ao WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/chat/1/?token=${token}`)

ws.onopen = () => console.log('✅ Conectado!')
ws.onmessage = (e) => console.log('📨 Mensagem:', JSON.parse(e.data))

// Enviar mensagem
ws.send(JSON.stringify({
  type: 'message',
  content: 'Olá! Esta é uma mensagem de teste.'
}))

// Indicar que está digitando
ws.send(JSON.stringify({
  type: 'typing',
  is_typing: true
}))
```

### 6. Endpoints da API REST

**Listar Conversas:**
```bash
curl -H "Authorization: Bearer <seu_token>" \
  http://localhost:8000/api/chat/conversations/
```

**Criar Conversa:**
```bash
curl -X POST \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{"participant_id": 2}' \
  http://localhost:8000/api/chat/conversations/
```

**Listar Mensagens:**
```bash
curl -H "Authorization: Bearer <seu_token>" \
  "http://localhost:8000/api/chat/messages/?conversation_id=1"
```

**Enviar Mensagem (REST):**
```bash
curl -X POST \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{"conversation": 1, "content": "Olá!"}' \
  http://localhost:8000/api/chat/messages/
```

### 7. Verificar Dados no Banco

```bash
python3 manage.py shell
```

```python
from apps.chat.models import Conversation, Message

# Ver todas as conversas
for conv in Conversation.objects.all():
    participants = ', '.join([p.full_name for p in conv.participants.all()])
    print(f"Conversa {conv.id}: {participants}")
    
    # Ver mensagens da conversa
    for msg in conv.messages.all():
        print(f"  - {msg.sender.full_name}: {msg.content}")
```

## 🎯 Checklist de Funcionalidades

- [ ] ✅ Criar conversa via botão "Enviar Mensagem" na página da localização
- [ ] ✅ Criar conversa via modal "Nova Conversa" com lista de favoritos
- [ ] ✅ Enviar mensagens via WebSocket em tempo real
- [ ] ✅ Receber mensagens em tempo real (ambos os lados)
- [ ] ✅ Indicador de digitação funcionando
- [ ] ✅ Auto-scroll para última mensagem
- [ ] ✅ Contador de mensagens não lidas
- [ ] ✅ Marcar mensagens como lidas
- [ ] ✅ Reconexão automática do WebSocket
- [ ] ✅ Fallback para API REST se WebSocket falhar

## 🐛 Troubleshooting

### WebSocket não conecta
- Verifique se o backend está rodando com `python3 manage.py runserver`
- Confirme que `VITE_WS_BASE_URL=ws://localhost:8000` no `.env`
- Verifique o console do navegador para erros

### Mensagens não aparecem em tempo real
- Abra o console do navegador e verifique se há erros no WebSocket
- Confirme que o Channel Layer está configurado (InMemory para dev)
- Teste enviando mensagem via API REST como fallback

### Erro 401 ao criar conversa
- Verifique se está autenticado
- Confirme que o token JWT está válido
- Faça logout e login novamente

### Produtor não aparece na lista de favoritos
- Confirme que você adicionou a localização aos favoritos
- Verifique se o produtor tem `user_id` válido
- Recarregue a página

## 📝 Próximos Passos

1. **Sistema de Notificações**: Badge com contador no header
2. **Push Notifications**: Notificar quando receber mensagem (navegador fechado)
3. **Histórico de Mensagens**: Paginação infinita
4. **Busca de Mensagens**: Pesquisar no conteúdo
5. **Anexos**: Enviar imagens e arquivos
6. **Redis para Produção**: Substituir InMemory Channel Layer
7. **Autenticação WebSocket**: Melhorar segurança com middleware customizado
8. **Status Online**: Mostrar se o usuário está online
9. **Mensagens Lidas**: Checkmark duplo quando lida
10. **Emojis e Reações**: Adicionar suporte a emojis
