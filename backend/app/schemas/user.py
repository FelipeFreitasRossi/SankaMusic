import re
from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import APIModel
from app.utils.text import is_valid_cpf, only_digits


def validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres.")
    if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise ValueError("A senha deve conter letras e números.")
    return v


def validate_phone(v: Optional[str]) -> Optional[str]:
    if v in (None, ""):
        return None
    digits = only_digits(v)
    if len(digits) not in (10, 11):
        raise ValueError("Telefone inválido. Use DDD + número.")
    return digits


def validate_cpf(v: Optional[str]) -> Optional[str]:
    if v in (None, ""):
        return None
    if not is_valid_cpf(v):
        raise ValueError("CPF inválido.")
    return only_digits(v)


class RegisterIn(APIModel):
    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = None

    _pw = field_validator("password")(validate_password_strength)
    _phone = field_validator("phone")(validate_phone)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class LoginIn(APIModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.lower()


class ForgotPasswordIn(APIModel):
    email: EmailStr


class ResetPasswordIn(APIModel):
    token: str = Field(min_length=20, max_length=200)
    password: str = Field(min_length=8, max_length=128)

    _pw = field_validator("password")(validate_password_strength)


class ChangePasswordIn(APIModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    _pw = field_validator("new_password")(validate_password_strength)


class UserOut(APIModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    cpf: Optional[str] = None
    role: str
    active: bool = True
    created_at: Optional[datetime] = None


class UserUpdate(APIModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=120)
    phone: Optional[str] = None
    cpf: Optional[str] = None

    _phone = field_validator("phone")(validate_phone)
    _cpf = field_validator("cpf")(validate_cpf)


class TokenOut(APIModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
