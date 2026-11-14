from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from app.schemas.common import APIModel
from app.schemas.user import validate_phone
from app.utils.text import only_digits

UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


class AddressIn(APIModel):
    label: str = Field(default="Casa", max_length=40)
    recipient: str = Field(min_length=3, max_length=120)
    cep: str
    street: str = Field(min_length=2, max_length=160)
    number: str = Field(min_length=1, max_length=20)
    complement: Optional[str] = Field(default=None, max_length=80)
    district: str = Field(min_length=2, max_length=80)
    city: str = Field(min_length=2, max_length=80)
    state: str
    phone: Optional[str] = None
    is_default: bool = False

    @field_validator("cep")
    @classmethod
    def _cep(cls, v: str) -> str:
        d = only_digits(v)
        if len(d) != 8:
            raise ValueError("CEP inválido.")
        return d

    @field_validator("state")
    @classmethod
    def _uf(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in UFS:
            raise ValueError("UF inválida.")
        return v

    _phone = field_validator("phone")(validate_phone)


class AddressOut(AddressIn):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
