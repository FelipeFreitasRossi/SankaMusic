from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.schemas.catalog import CategoryOut, NewsletterIn, ReviewIn, ReviewOut
from app.schemas.common import Message
from app.services import account_service, catalog_service
from app.utils.pagination import PageParams, page_params

router = APIRouter(tags=["Catálogo"])

SortKey = Literal["relevance", "price_asc", "price_desc", "newest", "best_sellers", "rating"]


@router.get("/config", summary="Configurações públicas da loja")
def public_config():
    return catalog_service.public_config()


@router.get("/categories", response_model=list[CategoryOut], summary="Lista categorias ativas")
def categories():
    return catalog_service.list_categories()


@router.get("/categories/{slug}", response_model=CategoryOut, summary="Detalhe da categoria")
def category(slug: str):
    return catalog_service.get_category_by_slug(slug)


@router.get("/products", summary="Lista produtos com filtros, ordenação e paginação")
def products(
    params: PageParams = Depends(page_params),
    q: Optional[str] = Query(None, max_length=80, description="Busca por nome, marca ou SKU"),
    category: Optional[str] = Query(None, max_length=80),
    brand: Optional[list[str]] = Query(None, description="Pode repetir: ?brand=A&brand=B"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: Optional[bool] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    on_sale: Optional[bool] = None,
    sort: SortKey = "relevance",
):
    return catalog_service.list_products(
        params, sort=sort, q=q, category=category, brands=brand, min_price=min_price,
        max_price=max_price, in_stock=in_stock, min_rating=min_rating, on_sale=on_sale,
    )


@router.get("/products/showcase", summary="Vitrine da home (uma requisição)")
def showcase():
    return catalog_service.showcase()


@router.get("/products/brands", response_model=list[str], summary="Marcas disponíveis")
def brands():
    return catalog_service.list_brands()


@router.get("/products/{slug}", summary="Detalhe do produto + relacionados")
def product(slug: str):
    return catalog_service.product_detail(slug)


@router.get("/products/{slug}/reviews", summary="Avaliações do produto")
def reviews(slug: str, params: PageParams = Depends(page_params)):
    return catalog_service.list_reviews(slug, params)


@router.post("/products/{slug}/reviews", response_model=ReviewOut, status_code=201, summary="Avaliar produto comprado")
def add_review(slug: str, body: ReviewIn, user: dict = Depends(get_current_user)):
    return catalog_service.add_review(slug, user, body.model_dump())


@router.post("/newsletter", response_model=Message, status_code=201, summary="Inscrição na newsletter")
def newsletter(body: NewsletterIn):
    account_service.subscribe_newsletter(body.email)
    return {"detail": "Inscrição confirmada! Você receberá nossas novidades."}
