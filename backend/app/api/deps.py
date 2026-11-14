"""Dependências de autenticação/autorização para as rotas."""
from typing import Optional

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.models.collections import Role
from app.repositories.repos import users
from app.utils.mongo import is_object_id

bearer = HTTPBearer(auto_error=False, description="Token JWT obtido em /auth/login")


def _load_user(token: str) -> dict:
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Sessão expirada. Faça login novamente.", code="token_expired")
    except jwt.PyJWTError:
        raise UnauthorizedError("Token inválido.", code="invalid_token")
    sub = payload.get("sub")
    if not is_object_id(sub):
        raise UnauthorizedError("Token inválido.", code="invalid_token")
    user = users.get(sub)
    if not user or not user.get("active", True):
        raise UnauthorizedError("Usuário não encontrado ou inativo.", code="invalid_user")
    return user


def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> dict:
    if not creds or creds.scheme.lower() != "bearer":
        raise UnauthorizedError("Autenticação necessária.", code="not_authenticated")
    return _load_user(creds.credentials)


def get_optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        return _load_user(creds.credentials)
    except UnauthorizedError:
        return None


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    # O papel é sempre lido do banco, não do token — revogação imediata.
    if user.get("role") != Role.ADMIN.value:
        raise ForbiddenError("Acesso restrito ao administrador.", code="admin_only")
    return user
