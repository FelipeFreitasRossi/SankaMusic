from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator, model_validator

from app.schemas.common import APIModel


# ------------------------------------------------------------------ categorias
class CategoryIn(APIModel):
    name: str = Field(min_length=2, max_length=60)
    slug: Optional[str] = Field(default=None, max_length=80, pattern=r"^[a-z0-9-]*$")
    description: Optional[str] = Field(default=None, max_length=400)
    icon: Optional[str] = Field(default=None, max_length=40, description="Nome do ícone Lucide")
    image: Optional[str] = Field(default=None, max_length=500)
    order: int = 0
    active: bool = True


class CategoryUpdate(APIModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=60)
    description: Optional[str] = Field(default=None, max_length=400)
    icon: Optional[str] = Field(default=None, max_length=40)
    image: Optional[str] = Field(default=None, max_length=500)
    order: Optional[int] = None
    active: Optional[bool] = None


class CategoryOut(APIModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    order: int = 0
    active: bool = True
    product_count: Optional[int] = None


# ------------------------------------------------------------------- produtos
class Spec(APIModel):
    label: str = Field(min_length=1, max_length=60)
    value: str = Field(min_length=1, max_length=200)


def _check_images(v: list[str]) -> list[str]:
    for url in v:
        if not (url.startswith("/") or url.startswith("https://") or url.startswith("http://")):
            raise ValueError("URL de imagem inválida.")
    return v


class ProductBase(APIModel):
    name: str = Field(min_length=3, max_length=160)
    sku: Optional[str] = Field(default=None, max_length=60)
    brand: str = Field(min_length=1, max_length=60)
    category_id: str
    price: float = Field(gt=0, le=1_000_000)
    promo_price: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    stock: int = Field(ge=0, le=1_000_000)
    description: str = Field(default="", max_length=8000)
    specs: list[Spec] = Field(default_factory=list, max_length=60)
    images: list[str] = Field(default_factory=list, max_length=12)
    featured: bool = False
    active: bool = True

    _imgs = field_validator("images")(_check_images)

    @model_validator(mode="after")
    def _promo(self):
        if self.promo_price is not None and self.promo_price >= self.price:
            raise ValueError("O preço promocional deve ser menor que o preço normal.")
        return self


class ProductIn(ProductBase):
    slug: Optional[str] = Field(default=None, max_length=180, pattern=r"^[a-z0-9-]*$")


class ProductUpdate(APIModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=160)
    sku: Optional[str] = Field(default=None, max_length=60)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=60)
    category_id: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    promo_price: Optional[float] = Field(default=None, ge=0, le=1_000_000, description="0 ou null remove a promoção")
    stock: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    description: Optional[str] = Field(default=None, max_length=8000)
    specs: Optional[list[Spec]] = Field(default=None, max_length=60)
    images: Optional[list[str]] = Field(default=None, max_length=12)
    featured: Optional[bool] = None
    active: Optional[bool] = None

    @field_validator("images")
    @classmethod
    def _imgs(cls, v):
        return _check_images(v) if v is not None else v


class StockAdjust(APIModel):
    delta: Optional[int] = Field(default=None, ge=-1_000_000, le=1_000_000)
    stock: Optional[int] = Field(default=None, ge=0, le=1_000_000)

    @model_validator(mode="after")
    def _one(self):
        if (self.delta is None) == (self.stock is None):
            raise ValueError("Informe 'delta' ou 'stock'.")
        return self


class ProductOut(APIModel):
    id: str
    name: str
    slug: str
    sku: Optional[str] = None
    brand: str
    category_id: str
    category_slug: Optional[str] = None
    category_name: Optional[str] = None
    price: float
    promo_price: Optional[float] = None
    final_price: float
    discount_percent: int = 0
    stock: int
    in_stock: bool
    description: str = ""
    specs: list[Spec] = []
    images: list[str] = []
    rating_avg: float = 0
    rating_count: int = 0
    sold_count: int = 0
    featured: bool = False
    active: bool = True
    is_demo: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ----------------------------------------------------------------- avaliações
class ReviewIn(APIModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=100)
    comment: str = Field(min_length=3, max_length=2000)


class ReviewOut(APIModel):
    id: str
    product_id: str
    user_name: str
    rating: int
    title: Optional[str] = None
    comment: str
    created_at: Optional[datetime] = None


class NewsletterIn(APIModel):
    email: str = Field(min_length=5, max_length=160)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        from email_validator import EmailNotValidError, validate_email

        try:
            return validate_email(v, check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise ValueError("E-mail inválido.")
