from typing import Optional

from pydantic import Field, field_validator, model_validator

from app.models.collections import OrderStatus
from app.schemas.address import AddressIn
from app.schemas.common import APIModel
from app.utils.text import only_digits


class CartItemIn(APIModel):
    product_id: str = Field(min_length=1, max_length=40)
    quantity: int = Field(ge=1, le=99)


class CartIn(APIModel):
    items: list[CartItemIn] = Field(default_factory=list, max_length=50)


class ShippingQuoteIn(APIModel):
    cep: str
    items: list[CartItemIn] = Field(min_length=1, max_length=50)

    @field_validator("cep")
    @classmethod
    def _cep(cls, v: str) -> str:
        d = only_digits(v)
        if len(d) != 8:
            raise ValueError("CEP inválido.")
        return d


class OrderCreate(APIModel):
    items: list[CartItemIn] = Field(min_length=1, max_length=50)
    address_id: Optional[str] = None
    address: Optional[AddressIn] = None
    shipping_code: str = Field(min_length=2, max_length=30)
    payment_method: str = Field(default="mercadopago", pattern=r"^(mercadopago)$")
    notes: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _addr(self):
        if not self.address_id and not self.address:
            raise ValueError("Informe o endereço de entrega.")
        return self


class OrderStatusUpdate(APIModel):
    status: OrderStatus
    note: Optional[str] = Field(default=None, max_length=300)
    tracking_code: Optional[str] = Field(default=None, max_length=60)
