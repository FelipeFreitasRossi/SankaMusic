"""Rotas administrativas — todas exigem papel 'admin' (verificado no banco)."""
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile

from app.api.deps import require_admin
from app.core.config import settings
from app.core.exceptions import AppError
from app.models.collections import OrderStatus
from app.schemas.catalog import CategoryIn, CategoryUpdate, ProductIn, ProductUpdate, StockAdjust
from app.schemas.order import OrderStatusUpdate
from app.services import account_service, catalog_service, dashboard_service, order_service, storage_service
from app.utils.pagination import PageParams, page_params
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Administração"], dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------- dashboard
@router.get("/dashboard", tags=["Dashboard"])
def dashboard(days: int = Query(30, ge=1, le=365)):
    return dashboard_service.summary(days)


# ----------------------------------------------------------------- produtos
@router.get("/products")
def admin_products(
    params: PageParams = Depends(page_params),
    q: Optional[str] = Query(None, max_length=80),
    category: Optional[str] = None,
    status: Literal["all", "active", "inactive", "low_stock"] = "all",
    sort: str = "newest",
):
    from app.repositories.repos import products as repo
    from app.utils.pagination import paginated

    query = catalog_service.build_product_query(q=q, category=category, include_inactive=True, use_text=False)
    if status == "active":
        query["active"] = True
    elif status == "inactive":
        query["active"] = False
    elif status == "low_stock":
        query["stock"] = {"$lte": settings.LOW_STOCK_THRESHOLD}
    sort_spec = catalog_service.SORTS.get(sort, catalog_service.SORTS["newest"])
    items = repo.find(query, sort=sort_spec, skip=params.skip, limit=params.page_size)
    cats = catalog_service._category_map()
    return paginated([catalog_service.present_product(p, cats) for p in items], repo.count(query), params)


@router.get("/products/{product_id}")
def admin_product(product_id: str):
    return catalog_service.present_product(catalog_service.get_product(product_id, include_inactive=True))


@router.post("/products", status_code=201)
def create_product(body: ProductIn):
    return catalog_service.create_product(body.model_dump())


@router.patch("/products/{product_id}")
def update_product(product_id: str, body: ProductUpdate):
    return catalog_service.update_product(product_id, body.model_dump(exclude_unset=True))


@router.post("/products/{product_id}/stock")
def adjust_stock(product_id: str, body: StockAdjust):
    return catalog_service.adjust_stock(product_id, body.delta, body.stock)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: str):
    catalog_service.delete_product(product_id)
    return Response(status_code=204)


# ------------------------------------------------------------------ uploads
@router.post("/uploads/image", status_code=201, summary="Upload de imagem (JPG/PNG/WEBP)")
async def upload_image(file: UploadFile = File(...)):
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise AppError(f"Arquivo maior que {settings.MAX_UPLOAD_MB} MB.", code="file_too_large", status_code=413)
    url = storage_service.save_image(data, file.content_type)
    return {"url": url}


# --------------------------------------------------------------- categorias
@router.get("/categories")
def admin_categories():
    return catalog_service.list_categories(include_inactive=True)


@router.post("/categories", status_code=201)
def create_category(body: CategoryIn):
    return catalog_service.create_category(body.model_dump())


@router.patch("/categories/{category_id}")
def update_category(category_id: str, body: CategoryUpdate):
    return catalog_service.update_category(category_id, body.model_dump(exclude_unset=True))


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: str):
    catalog_service.delete_category(category_id)
    return Response(status_code=204)


# ------------------------------------------------------------------ pedidos
@router.get("/orders")
def admin_orders(
    params: PageParams = Depends(page_params),
    status: Optional[OrderStatus] = None,
    q: Optional[str] = Query(None, max_length=80),
    user_id: Optional[str] = None,
):
    return order_service.admin_list(params, status.value if status else None, q, user_id)


@router.get("/orders/{order_id}")
def admin_order(order_id: str):
    return order_service.admin_get(order_id)


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: str, body: OrderStatusUpdate):
    return order_service.admin_update_status(order_id, body.status, body.note, body.tracking_code)


# ----------------------------------------------------------------- clientes
@router.get("/customers")
def customers(params: PageParams = Depends(page_params), q: Optional[str] = Query(None, max_length=80)):
    return account_service.admin_list_customers(params, q)


@router.get("/customers/{user_id}")
def customer(user_id: str):
    return account_service.admin_get_customer(user_id)


class ActiveIn(BaseModel):
    active: bool


@router.patch("/customers/{user_id}/active")
def set_customer_active(user_id: str, body: ActiveIn):
    return account_service.admin_set_customer_active(user_id, body.active)
