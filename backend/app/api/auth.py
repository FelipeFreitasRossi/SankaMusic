from fastapi import APIRouter, Depends, Request

from app.api.deps import get_current_user
from app.core.rate_limit import client_ip, login_limiter, reset_limiter
from app.schemas.common import Message
from app.schemas.user import (
    ChangePasswordIn,
    ForgotPasswordIn,
    LoginIn,
    RegisterIn,
    ResetPasswordIn,
    TokenOut,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=TokenOut, status_code=201, summary="Cadastro de cliente")
def register(body: RegisterIn, request: Request):
    login_limiter.check(f"register:{client_ip(request)}")
    return auth_service.register(body.name, body.email, body.password, body.phone)


@router.post("/login", response_model=TokenOut, summary="Login (retorna JWT)")
def login(body: LoginIn, request: Request):
    login_limiter.check(f"login:{client_ip(request)}:{body.email}")
    return auth_service.login(body.email, body.password)


@router.post("/logout", response_model=Message, summary="Logout")
def logout(_: dict = Depends(get_current_user)):
    # JWT é stateless: o cliente descarta o token. Expiração curta limita o risco.
    return {"detail": "Sessão encerrada."}


@router.get("/me", response_model=UserOut, summary="Usuário autenticado")
def me(user: dict = Depends(get_current_user)):
    return auth_service.public_user(user)


@router.post("/forgot-password", response_model=Message, summary="Solicitar redefinição de senha")
def forgot_password(body: ForgotPasswordIn, request: Request):
    reset_limiter.check(f"forgot:{client_ip(request)}")
    auth_service.forgot_password(body.email.lower())
    return {"detail": "Se o e-mail estiver cadastrado, você receberá as instruções em instantes."}


@router.post("/reset-password", response_model=Message, summary="Redefinir senha com token")
def reset_password(body: ResetPasswordIn, request: Request):
    reset_limiter.check(f"reset:{client_ip(request)}")
    auth_service.reset_password(body.token, body.password)
    return {"detail": "Senha redefinida com sucesso. Faça login."}


@router.post("/change-password", response_model=Message, summary="Alterar senha (logado)")
def change_password(body: ChangePasswordIn, user: dict = Depends(get_current_user)):
    auth_service.change_password(user, body.current_password, body.new_password)
    return {"detail": "Senha alterada com sucesso."}
