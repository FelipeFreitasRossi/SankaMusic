"""Regras de catálogo: produtos, categorias, vitrine, avaliações."""
import logging
from typing import Any, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, OperationFailure

from app.core.config import settings
from app.core.exceptions import AppError, ConflictError, ForbiddenError, NotFoundError
from app.models.collections import Collections as C, OrderStatus
from app.repositories.repos import categories as cat_repo
from app.repositories.repos import orders as order_repo
from app.repositories.repos import products as product_repo
from app.repositories.repos import reviews as review_repo
from app.services.pricing import discount_percent, effective_price, money
from app.utils.mongo import serialize, to_object_id
from app.utils.pagination import PageParams, paginated
from app.utils.text import escape_regex, slugify

logger = logging.getLogger("sanka.catalog")

SORTS: dict[str, list[tuple[str, int]]] = {
    "relevance": [("featured", DESCENDING), ("sold_count", DESCENDING), ("_id", DESCENDING)],
    "price_asc": [("final_price", ASCENDING), ("_id", ASCENDING)],
    "price_desc": [("final_price", DESCENDING), ("_id", DESCENDING)],
    "newest": [("created_at", DESCENDING), ("_id", DESCENDING)],
    "best_sellers": [("sold_count", DESCENDING), ("_id", DESCENDING)],
    "rating": [("rating_avg", DESCENDING), ("rating_count", DESCENDING)],
}


# ---------------------------------------------------------------- apresentação
def _category_map() -> dict[str, dict]:
    return {str(c["_id"]): c for c in cat_repo.find({})}


def present_product(p: dict, cats: Optional[dict[str, dict]] = None) -> dict:
    cats = cats if cats is not None else _category_map()
    cat = cats.get(str(p.get("category_id")))
    out = serialize(p)
    out["category_id"] = str(p.get("category_id"))
    out["category_name"] = cat["name"] if cat else None
    out["category_slug"] = cat["slug"] if cat else p.get("category_slug")
    out["final_price"] = effective_price(p["price"], p.get("promo_price"))
    out["discount_percent"] = discount_percent(p["price"], p.get("promo_price"))
    out["in_stock"] = int(p.get("stock", 0)) > 0
    out.setdefault("specs", [])
    out.setdefault("images", [])
    return out


# ------------------------------------------------------------------ categorias
def list_categories(include_inactive: bool = False, with_counts: bool = True) -> list[dict]:
    query = {} if include_inactive else {"active": True}
    cats = cat_repo.find(query, sort=[("order", ASCENDING), ("name", ASCENDING)])
    counts: dict[str, int] = {}
    if with_counts and cats:
        pipeline = [{"$match": {"active": True}}, {"$group": {"_id": "$category_id", "n": {"$sum": 1}}}]
        counts = {str(r["_id"]): r["n"] for r in product_repo.col.aggregate(pipeline)}
    out = []
    for c in cats:
        d = serialize(c)
        d["product_count"] = counts.get(str(c["_id"]), 0)
        out.append(d)
    return out


def get_category_by_slug(slug: str) -> dict:
    c = cat_repo.by_slug(slug)
    if not c or not c.get("active", True):
        raise NotFoundError("Categoria não encontrada.")
    return serialize(c)


def create_category(data: dict) -> dict:
    data["slug"] = data.get("slug") or slugify(data["name"])
    try:
        return serialize(cat_repo.insert(data))
    except DuplicateKeyError:
        raise ConflictError("Já existe uma categoria com este slug.")


def update_category(cid: str, changes: dict) -> dict:
    doc = cat_repo.update(cid, changes)
    if not doc:
        raise NotFoundError("Categoria não encontrada.")
    return serialize(doc)


def delete_category(cid: str) -> None:
    oid = to_object_id(cid)
    if product_repo.count({"category_id": oid}) > 0:
        raise ConflictError("Há produtos nesta categoria. Mova-os ou desative a categoria.")
    if not cat_repo.delete(oid):
        raise NotFoundError("Categoria não encontrada.")


# ------------------------------------------------------------------- listagem
def _search_clause(q: str) -> dict:
    terms = [t for t in q.split() if t][:6]
    return {"$and": [
        {"$or": [{"name": {"$regex": escape_regex(t), "$options": "i"}},
                 {"brand": {"$regex": escape_regex(t), "$options": "i"}},
                 {"sku": {"$regex": escape_regex(t), "$options": "i"}}]}
        for t in terms
    ]}


def build_product_query(
    *,
    q: Optional[str] = None,
    category: Optional[str] = None,
    brands: Optional[list[str]] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    min_rating: Optional[float] = None,
    on_sale: Optional[bool] = None,
    include_inactive: bool = False,
    use_text: bool = True,
) -> dict:
    query: dict[str, Any] = {} if include_inactive else {"active": True}
    if category:
        cat = cat_repo.by_slug(category)
        if not cat:
            raise NotFoundError("Categoria não encontrada.")
        query["category_id"] = cat["_id"]
    if brands:
        query["brand"] = {"$in": brands}
    price: dict[str, float] = {}
    if min_price is not None:
        price["$gte"] = min_price
    if max_price is not None:
        price["$lte"] = max_price
    if price:
        query["final_price"] = price
    if in_stock:
        query["stock"] = {"$gt": 0}
    if min_rating:
        query["rating_avg"] = {"$gte": min_rating}
    if on_sale:
        query["promo_price"] = {"$gt": 0}
    if q:
        q = q.strip()[:80]
        if use_text:
            query["$text"] = {"$search": q}
        else:
            query.update(_search_clause(q))
    return query


def list_products(params: PageParams, sort: str = "relevance", include_inactive: bool = False, **filters) -> dict:
    sort_spec = SORTS.get(sort, SORTS["relevance"])

    def run(use_text: bool):
        query = build_product_query(include_inactive=include_inactive, use_text=use_text, **filters)
        total = product_repo.count(query)
        items = product_repo.find(query, sort=sort_spec, skip=params.skip, limit=params.page_size)
        return query, total, items

    try:
        query, total, items = run(use_text=bool(filters.get("q")))
        if filters.get("q") and total == 0:  # busca parcial (prefixos, SKU)
            query, total, items = run(use_text=False)
    except (OperationFailure, NotImplementedError, KeyError, TypeError):
        query, total, items = run(use_text=False)

    cats = _category_map()
    facets = _facets({k: v for k, v in query.items() if k not in ("brand", "final_price")})
    return paginated([present_product(p, cats) for p in items], total, params, facets=facets)


def _facets(base_query: dict) -> dict:
    try:
        brands = sorted(b for b in product_repo.col.distinct("brand", base_query) if b)
        cheapest = product_repo.find(base_query, sort=[("final_price", ASCENDING)], limit=1, projection={"final_price": 1})
        priciest = product_repo.find(base_query, sort=[("final_price", DESCENDING)], limit=1, projection={"final_price": 1})
    except (OperationFailure, NotImplementedError):
        return {"brands": [], "price_min": 0, "price_max": 0}
    return {
        "brands": brands,
        "price_min": cheapest[0]["final_price"] if cheapest else 0,
        "price_max": priciest[0]["final_price"] if priciest else 0,
    }


def list_brands() -> list[str]:
    return sorted(b for b in product_repo.col.distinct("brand", {"active": True}) if b)


def showcase() -> dict:
    """Vitrine da página inicial em UMA requisição."""
    cats = _category_map()
    base = {"active": True}

    def pick(query: dict, sort: list, limit: int = 8) -> list[dict]:
        return [present_product(p, cats) for p in product_repo.find({**base, **query}, sort=sort, limit=limit)]

    return {
        "featured": pick({"featured": True}, SORTS["relevance"]),
        "offers": pick({"promo_price": {"$gt": 0}, "stock": {"$gt": 0}}, [("updated_at", DESCENDING)]),
        "best_sellers": pick({}, SORTS["best_sellers"]),
        "newest": pick({}, SORTS["newest"]),
        "brands": list_brands(),
        "categories": list_categories(),
    }


def get_product(slug_or_id: str, include_inactive: bool = False) -> dict:
    p = product_repo.by_slug(slug_or_id)
    if not p and ObjectId.is_valid(slug_or_id):
        p = product_repo.get(slug_or_id)
    if not p or (not include_inactive and not p.get("active", False)):
        raise NotFoundError("Produto não encontrado.")
    return p


def product_detail(slug: str) -> dict:
    p = get_product(slug)
    cats = _category_map()
    related = product_repo.find(
        {"active": True, "category_id": p["category_id"], "_id": {"$ne": p["_id"]}},
        sort=SORTS["best_sellers"], limit=8,
    )
    if len(related) < 4:
        more = product_repo.find(
            {"active": True, "_id": {"$nin": [p["_id"], *[r["_id"] for r in related]]}},
            sort=SORTS["best_sellers"], limit=8 - len(related),
        )
        related += more
    return {"product": present_product(p, cats), "related": [present_product(r, cats) for r in related]}


# --------------------------------------------------------- administração
def _prepare_product(data: dict) -> dict:
    if "category_id" in data and data["category_id"] is not None:
        cat = cat_repo.get(data["category_id"])
        if not cat:
            raise AppError("Categoria inválida.", code="invalid_category")
        data["category_id"] = cat["_id"]
        data["category_slug"] = cat["slug"]
    if "promo_price" in data and not data["promo_price"]:
        data["promo_price"] = None
    if "price" in data:
        data["price"] = money(data["price"])
    if data.get("promo_price"):
        data["promo_price"] = money(data["promo_price"])
    if "specs" in data and data["specs"] is not None:
        data["specs"] = [dict(s) for s in data["specs"]]
    return data


def create_product(data: dict) -> dict:
    data = _prepare_product(data)
    data["slug"] = data.get("slug") or slugify(data["name"])
    if not data.get("sku"):
        data.pop("sku", None)
    data["final_price"] = effective_price(data["price"], data.get("promo_price"))
    data.update({"rating_avg": 0.0, "rating_count": 0, "sold_count": 0, "is_demo": False})
    try:
        doc = product_repo.insert(data)
    except DuplicateKeyError:
        raise ConflictError("Já existe um produto com este slug ou SKU.")
    logger.info("Produto criado: %s", doc["_id"])
    return present_product(doc)


def update_product(pid: str, changes: dict) -> dict:
    current = product_repo.get(pid)
    if not current:
        raise NotFoundError("Produto não encontrado.")
    changes = _prepare_product(changes)
    if changes.get("sku") == "":
        changes["sku"] = None
    price = changes.get("price", current["price"])
    promo = changes["promo_price"] if "promo_price" in changes else current.get("promo_price")
    if promo is not None and promo >= price:
        raise AppError("O preço promocional deve ser menor que o preço normal.", code="invalid_promo")
    changes["final_price"] = effective_price(price, promo)
    unset = {}
    if changes.get("sku") is None and "sku" in changes:
        changes.pop("sku")
        unset = {"$unset": {"sku": ""}}
    try:
        doc = product_repo.update(pid, changes, unset or None)
    except DuplicateKeyError:
        raise ConflictError("Já existe um produto com este SKU.")
    logger.info("Produto atualizado: %s", pid)
    return present_product(doc)


def adjust_stock(pid: str, delta: Optional[int], stock: Optional[int]) -> dict:
    oid = to_object_id(pid)
    if stock is not None:
        doc = product_repo.update(oid, {"stock": stock})
    else:
        doc = product_repo.col.find_one_and_update(
            {"_id": oid, "stock": {"$gte": -delta if delta < 0 else 0}},
            {"$inc": {"stock": delta}}, return_document=True,
        )
        if not doc:
            raise AppError("Estoque não pode ficar negativo.", code="negative_stock")
    if not doc:
        raise NotFoundError("Produto não encontrado.")
    return present_product(doc)


def delete_product(pid: str) -> None:
    oid = to_object_id(pid)
    if order_repo.count({"items.product_id": str(oid)}) > 0:
        raise ConflictError("Produto possui pedidos vinculados. Desative-o em vez de excluir.")
    if not product_repo.delete(oid):
        raise NotFoundError("Produto não encontrado.")
    product_repo.col.database[C.FAVORITES].delete_many({"product_id": oid})
    review_repo.col.delete_many({"product_id": oid})
    logger.info("Produto excluído: %s", pid)


# ------------------------------------------------------------------ avaliações
def list_reviews(product_slug: str, params: PageParams) -> dict:
    p = get_product(product_slug)
    q = {"product_id": p["_id"]}
    items = review_repo.find(q, sort=[("created_at", DESCENDING)], skip=params.skip, limit=params.page_size)
    out = [serialize({k: v for k, v in r.items() if k != "user_id"}) for r in items]
    return paginated(out, review_repo.count(q), params)


def add_review(product_slug: str, user: dict, data: dict) -> dict:
    p = get_product(product_slug)
    purchased = order_repo.count({
        "user_id": user["_id"],
        "items.product_id": str(p["_id"]),
        "status": {"$in": [OrderStatus.PAYMENT_APPROVED.value, OrderStatus.PREPARING.value,
                           OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value]},
    })
    if not purchased:
        raise ForbiddenError("Apenas clientes que compraram este produto podem avaliá-lo.", code="not_purchased")
    try:
        review = review_repo.insert({
            "product_id": p["_id"], "user_id": user["_id"],
            "user_name": user["name"].split(" ")[0], **data,
        })
    except DuplicateKeyError:
        raise ConflictError("Você já avaliou este produto.")
    _recalc_rating(p["_id"])
    return serialize({k: v for k, v in review.items() if k != "user_id"})


def _recalc_rating(product_id: ObjectId) -> None:
    agg = list(review_repo.col.aggregate([
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}},
    ]))
    avg, n = (round(agg[0]["avg"], 2), agg[0]["n"]) if agg else (0.0, 0)
    product_repo.update(product_id, {"rating_avg": avg, "rating_count": n})


def public_config() -> dict:
    return {
        "max_installments": settings.MAX_INSTALLMENTS,
        "min_installment_value": settings.MIN_INSTALLMENT_VALUE,
        "free_shipping_threshold": settings.FREE_SHIPPING_THRESHOLD,
        "payments_enabled": settings.payments_enabled,
        "low_stock_threshold": settings.LOW_STOCK_THRESHOLD,
    }
