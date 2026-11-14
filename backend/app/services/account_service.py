"""Carrinho, favoritos, endereços e perfil do cliente."""
from typing import Optional

from bson import ObjectId
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import AppError, NotFoundError
from app.repositories.repos import addresses as address_repo
from app.repositories.repos import carts as cart_repo
from app.repositories.repos import favorites as fav_repo
from app.repositories.repos import newsletter as newsletter_repo
from app.repositories.repos import products as product_repo
from app.repositories.repos import users as user_repo
from app.services.auth_service import public_user
from app.services.catalog_service import _category_map, present_product
from app.services.pricing import build_lines, compute_totals, merge_items
from app.utils.mongo import serialize, to_object_id
from app.utils.text import is_valid_cpf

MAX_ADDRESSES = 10


# --------------------------------------------------------------------- carrinho
def quote_cart(items: list[dict]) -> dict:
    """Recalcula preços/estoque — público, usado pelo carrinho local."""
    lines, warnings = build_lines(items, strict=False)
    return {"items": lines, "warnings": warnings, "totals": compute_totals(lines)}


def get_cart(user: dict) -> dict:
    cart = cart_repo.by_user(user["_id"])
    return quote_cart((cart or {}).get("items", []))


def save_cart(user: dict, items: list[dict], merge: bool = False) -> dict:
    if merge:
        existing = (cart_repo.by_user(user["_id"]) or {}).get("items", [])
        merged = merge_items(existing)
        for pid, q in merge_items(items).items():
            merged[pid] = max(merged.get(pid, 0), q)
        items = [{"product_id": k, "quantity": v} for k, v in merged.items()]
    result = quote_cart(items)
    cart_repo.save(user["_id"], [{"product_id": l["product_id"], "quantity": l["quantity"]} for l in result["items"]])
    return result


# -------------------------------------------------------------------- favoritos
def list_favorites(user: dict) -> list[dict]:
    favs = fav_repo.find({"user_id": user["_id"]}, sort=[("created_at", DESCENDING)])
    found = product_repo.get_many([f["product_id"] for f in favs])
    cats = _category_map()
    return [present_product(found[str(f["product_id"])], cats)
            for f in favs if str(f["product_id"]) in found and found[str(f["product_id"])].get("active")]


def add_favorite(user: dict, product_id: str) -> None:
    p = product_repo.get(to_object_id(product_id, not_found_msg="Produto não encontrado."))
    if not p:
        raise NotFoundError("Produto não encontrado.")
    try:
        fav_repo.insert({"user_id": user["_id"], "product_id": p["_id"]})
    except DuplicateKeyError:
        pass


def remove_favorite(user: dict, product_id: str) -> None:
    fav_repo.col.delete_one({"user_id": user["_id"], "product_id": to_object_id(product_id)})


def sync_favorites(user: dict, product_ids: list[str]) -> list[dict]:
    for pid in product_ids[:100]:
        if ObjectId.is_valid(pid):
            try:
                add_favorite(user, pid)
            except NotFoundError:
                continue
    return list_favorites(user)


# -------------------------------------------------------------------- endereços
def list_addresses(user: dict) -> list[dict]:
    return serialize(address_repo.find({"user_id": user["_id"]}, sort=[("is_default", DESCENDING), ("created_at", DESCENDING)]))


def _owned(user: dict, address_id: str) -> dict:
    a = address_repo.find_one({"_id": to_object_id(address_id, not_found_msg="Endereço não encontrado."), "user_id": user["_id"]})
    if not a:
        raise NotFoundError("Endereço não encontrado.")
    return a


def create_address(user: dict, data: dict) -> dict:
    count = address_repo.count({"user_id": user["_id"]})
    if count >= MAX_ADDRESSES:
        raise AppError(f"Limite de {MAX_ADDRESSES} endereços atingido.")
    if count == 0:
        data["is_default"] = True
    if data.get("is_default"):
        address_repo.col.update_many({"user_id": user["_id"]}, {"$set": {"is_default": False}})
    return serialize(address_repo.insert({**data, "user_id": user["_id"]}))


def update_address(user: dict, address_id: str, data: dict) -> dict:
    a = _owned(user, address_id)
    if data.get("is_default"):
        address_repo.col.update_many({"user_id": user["_id"]}, {"$set": {"is_default": False}})
    return serialize(address_repo.update(a["_id"], data))


def delete_address(user: dict, address_id: str) -> None:
    a = _owned(user, address_id)
    address_repo.delete(a["_id"])
    if a.get("is_default"):
        nxt = address_repo.find({"user_id": user["_id"]}, sort=[("created_at", DESCENDING)], limit=1)
        if nxt:
            address_repo.update(nxt[0]["_id"], {"is_default": True})


# ----------------------------------------------------------------------- perfil
def update_profile(user: dict, changes: dict) -> dict:
    changes = {k: v for k, v in changes.items() if v is not None}
    if changes.get("cpf") and not is_valid_cpf(changes["cpf"]):
        raise AppError("CPF inválido.")
    return public_user(user_repo.update(user["_id"], changes) if changes else user)


# ------------------------------------------------------------------- newsletter
def subscribe_newsletter(email: str) -> None:
    try:
        newsletter_repo.insert({"email": email})
    except DuplicateKeyError:
        pass  # já inscrito — resposta idêntica para não expor a base


# ------------------------------------------------------------- admin: clientes
def admin_list_customers(params, q: Optional[str] = None) -> dict:
    from app.repositories.repos import orders as order_repo
    from app.utils.pagination import paginated
    from app.utils.text import escape_regex

    query: dict = {"role": "customer"}
    if q:
        rx = {"$regex": escape_regex(q), "$options": "i"}
        query["$or"] = [{"name": rx}, {"email": rx}]
    users = user_repo.find(query, sort=[("created_at", DESCENDING)], skip=params.skip,
                           limit=params.page_size, projection={"password_hash": 0})
    ids = [u["_id"] for u in users]
    stats = {}
    if ids:
        for r in order_repo.col.aggregate([
            {"$match": {"user_id": {"$in": ids}, "status": {"$ne": "canceled"}}},
            {"$group": {"_id": "$user_id", "orders": {"$sum": 1}, "spent": {"$sum": "$total"}}},
        ]):
            stats[str(r["_id"])] = r
    out = []
    for u in users:
        d = public_user(u)
        s = stats.get(str(u["_id"]), {})
        d["orders_count"] = s.get("orders", 0)
        d["total_spent"] = round(s.get("spent", 0.0), 2)
        out.append(d)
    return paginated(out, user_repo.count(query), params)


def admin_get_customer(user_id: str) -> dict:
    u = user_repo.get(to_object_id(user_id, not_found_msg="Cliente não encontrado."))
    if not u:
        raise NotFoundError("Cliente não encontrado.")
    d = public_user(u)
    d["addresses"] = list_addresses(u)
    return d


def admin_set_customer_active(user_id: str, active: bool) -> dict:
    u = user_repo.get(to_object_id(user_id, not_found_msg="Cliente não encontrado."))
    if not u or u.get("role") != "customer":
        raise NotFoundError("Cliente não encontrado.")
    return public_user(user_repo.update(u["_id"], {"active": active}))
