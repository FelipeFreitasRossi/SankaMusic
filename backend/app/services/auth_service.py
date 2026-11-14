import logging
from datetime import timedelta

from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.core.exceptions import AppError, ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.collections import Role
from app.repositories.repos import password_resets, users
from app.services import email as email_service
from app.utils.mongo import now_utc, serialize

logger = logging.getLogger("sanka.auth")

# Hash fictício para equalizar o tempo de resposta quando o e-mail não existe
_DUMMY_HASH = hash_password("dummy-password-0")

PUBLIC_USER_FIELDS = ("_id", "name", "email", "phone", "cpf", "role", "active", "created_at")


def public_user(doc: dict) -> dict:
    return serialize({k: doc.get(k) for k in PUBLIC_USER_FIELDS if k in doc})


def _token_response(user: dict) -> dict:
    token, expires_in = create_access_token(str(user["_id"]), user.get("role", Role.CUSTOMER.value))
    return {"access_token": token, "token_type": "bearer", "expires_in": expires_in, "user": public_user(user)}


def register(name: str, email: str, password: str, phone: str | None = None) -> dict:
    if users.by_email(email):
        raise ConflictError("Este e-mail já está cadastrado.", code="email_taken")
    try:
        user = users.insert({
            "name": name.strip(),
            "email": email.lower(),
            "password_hash": hash_password(password),
            "phone": phone,
            "cpf": None,
            "role": Role.CUSTOMER.value,
            "active": True,
        })
    except DuplicateKeyError:
        raise ConflictError("Este e-mail já está cadastrado.", code="email_taken")
    logger.info("Novo cliente cadastrado: %s", user["_id"])
    return _token_response(user)


def login(email: str, password: str) -> dict:
    user = users.by_email(email)
    if not user:
        verify_password(password, _DUMMY_HASH)
        raise UnauthorizedError("E-mail ou senha incorretos.", code="invalid_credentials")
    if not verify_password(password, user["password_hash"]):
        logger.warning("Falha de login para usuário %s", user["_id"])
        raise UnauthorizedError("E-mail ou senha incorretos.", code="invalid_credentials")
    if not user.get("active", True):
        raise UnauthorizedError("Conta desativada. Entre em contato com a loja.", code="inactive_user")
    users.update(user["_id"], {"last_login_at": now_utc()})
    return _token_response(user)


def forgot_password(email: str) -> None:
    """Sempre responde igual (não revela se o e-mail existe)."""
    user = users.by_email(email)
    if not user or not user.get("active", True):
        return
    token, token_hash = generate_reset_token()
    password_resets.col.update_many({"user_id": user["_id"], "used": False}, {"$set": {"used": True}})
    password_resets.insert({
        "user_id": user["_id"],
        "token_hash": token_hash,
        "expires_at": now_utc() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
        "used": False,
    })
    link = f"{settings.FRONTEND_URL.rstrip('/')}/redefinir-senha?token={token}"
    email_service.send_password_reset(user["email"], user["name"], link)


def reset_password(token: str, new_password: str) -> None:
    rec = password_resets.find_one({"token_hash": hash_token(token), "used": False})
    if not rec or rec["expires_at"] < now_utc():
        raise AppError("Link inválido ou expirado. Solicite uma nova redefinição.", code="invalid_reset_token")
    users.update(rec["user_id"], {"password_hash": hash_password(new_password)})
    password_resets.update(rec["_id"], {"used": True})
    logger.info("Senha redefinida para usuário %s", rec["user_id"])


def change_password(user: dict, current: str, new: str) -> None:
    if not verify_password(current, user["password_hash"]):
        raise AppError("Senha atual incorreta.", code="wrong_password")
    users.update(user["_id"], {"password_hash": hash_password(new)})
