from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    """
    Valida o token JWT e retorna o usuário
    """
    try:
        # Validar o token
        access_token = AccessToken(token_str)
        
        # Obter o user_id do token
        user_id = access_token['user_id']
        
        # Buscar o usuário no banco
        user = User.objects.get(id=user_id)
        return user
    except (TokenError, InvalidToken, User.DoesNotExist) as e:
        print(f"Erro na autenticação WebSocket: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware customizado para autenticar WebSocket via JWT token
    """
    async def __call__(self, scope, receive, send):
        # Obter query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        
        # Obter token da query string
        token = query_params.get('token', [None])[0]
        
        if token:
            # Autenticar o usuário
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Wrapper para aplicar o middleware JWT
    """
    return JWTAuthMiddleware(inner)
