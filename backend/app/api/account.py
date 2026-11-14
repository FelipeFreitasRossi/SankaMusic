"""Rotas do cliente autenticado: perfil, carrinho, favoritos, endereços."""
from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import get_current_user
from app.schemas.address import AddressIn, AddressOut
from app.schemas.order import CartIn
from app.schemas.user import UserOut, UserUpdate
from app.services import account_service
from pydantic import BaseModel, Field

router = APIRouter(tags=["Cliente"])


# ----------------------------------------------------------------- perfil
@router.get("/users/me", response_model=UserOut, tags=["Usuários"])
def profile(user: dict = Depends(get_current_user)):
    from app.services.auth_service import public_user

    return public_user(user)


@router.patch("/users/me", response_model=UserOut, tags=["Usuários"])
def update_profile(body: UserUpdate, user: dict = Depends(get_current_user)):
    return account_service.update_profile(user, body.model_dump(exclude_unset=True))


# ---------------------------------------------------------------- carrinho
@router.post("/cart/quote", tags=["Carrinho"], summary="Recalcula itens (público, sem login)")
def quote(body: CartIn):
    return account_service.quote_cart([i.model_dump() for i in body.items])


@router.get("/cart", tags=["Carrinho"])
def get_cart(user: dict = Depends(get_current_user)):
    return account_service.get_cart(user)


@router.put("/cart", tags=["Carrinho"], summary="Substitui (ou mescla) o carrinho salvo")
def save_cart(body: CartIn, merge: bool = Query(False), user: dict = Depends(get_current_user)):
    return account_service.save_cart(user, [i.model_dump() for i in body.items], merge=merge)


# --------------------------------------------------------------- favoritos
class FavoriteSync(BaseModel):
    product_ids: list[str] = Field(default_factory=list, max_length=100)


@router.get("/favorites", tags=["Favoritos"])
def favorites(user: dict = Depends(get_current_user)):
    return account_service.list_favorites(user)


@router.post("/favorites/sync", tags=["Favoritos"], summary="Mescla favoritos locais com a conta")
def sync_favorites(body: FavoriteSync, user: dict = Depends(get_current_user)):
    return account_service.sync_favorites(user, body.product_ids)


@router.post("/favorites/{product_id}", status_code=204, tags=["Favoritos"])
def add_favorite(product_id: str, user: dict = Depends(get_current_user)):
    account_service.add_favorite(user, product_id)
    return Response(status_code=204)


@router.delete("/favorites/{product_id}", status_code=204, tags=["Favoritos"])
def remove_favorite(product_id: str, user: dict = Depends(get_current_user)):
    account_service.remove_favorite(user, product_id)
    return Response(status_code=204)


# --------------------------------------------------------------- endereços
@router.get("/addresses", response_model=list[AddressOut], tags=["Endereços"])
def addresses(user: dict = Depends(get_current_user)):
    return account_service.list_addresses(user)


@router.post("/addresses", response_model=AddressOut, status_code=201, tags=["Endereços"])
def create_address(body: AddressIn, user: dict = Depends(get_current_user)):
    return account_service.create_address(user, body.model_dump())


@router.put("/addresses/{address_id}", response_model=AddressOut, tags=["Endereços"])
def update_address(address_id: str, body: AddressIn, user: dict = Depends(get_current_user)):
    return account_service.update_address(user, address_id, body.model_dump())


@router.delete("/addresses/{address_id}", status_code=204, tags=["Endereços"])
def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    account_service.delete_address(user, address_id)
    return Response(status_code=204)
