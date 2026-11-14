"""Pedidos: criação com validação total no backend, consulta e status."""
import logging
from typing import Optional

from bson import ObjectId
from pymongo import DESCENDING

from app.core.exceptions import AppError, ForbiddenError, NotFoundError
from app.models.collections import (
    ALLOWED_TRANSITIONS,
    ORDER_STATUS_LABELS,
    OrderStatus,
    PaymentStatus,
)
from app.repositories.repos import addresses as address_repo
from app.repositories.repos import carts as cart_repo
from app.repositories.repos import orders as order_repo
from app.repositories.repos import payments as payment_repo
from app.repositories.repos import products as product_repo
from app.repositories.repos import users as user_repo
from app.services import email as email_service
from app.services.pricing import build_lines, compute_totals
from app.services.shipping import find_option
from app.utils.mongo import now_utc, serialize, to_object_id
from app.utils.pagination import PageParams, paginated
from app.utils.text import escape_regex

logger = logging.getLogger("sanka.orders")

ADDRESS_FIELDS = ("recipient", "cep", "street", "number", "complement", "district", "city", "state", "phone")


def present_order(o: dict) -> dict:
    d = serialize(o)
    d["status_label"] = ORDER_STATUS_LABELS.get(OrderStatus(o["status"]), o["status"])
    for h in d.get("status_history", []):
        try:
            h["label"] = ORDER_STATUS_LABELS[OrderStatus(h["status"])]
        except (ValueError, KeyError):
            h["label"] = h.get("status")
    return d


def _resolve_address(user: dict, address_id: Optional[str], address: Optional[dict]) -> dict:
    if address_id:
        a = address_repo.find_one({"_id": to_object_id(address_id), "user_id": user["_id"]})
        if not a:
            raise NotFoundError("Endereço não encontrado.")
        return {k: a.get(k) for k in ADDRESS_FIELDS}
    assert address is not None
    return {k: address.get(k) for k in ADDRESS_FIELDS}


def create_order(user: dict, data: dict) -> dict:
    items = [i for i in data["items"]]
    lines, _ = build_lines(items, strict=True)
    if not lines:
        raise AppError("Seu carrinho está vazio.", code="empty_cart")

    shipping_address = _resolve_address(user, data.get("address_id"), data.get("address"))
    pre = compute_totals(lines)
    shipping = find_option(shipping_address["cep"], pre["items_total"], pre["items_count"], data["shipping_code"])
    totals = compute_totals(lines, shipping["price"])

    # Reserva de estoque atômica, item a item; desfaz tudo se algum falhar.
    reserved: list[tuple[ObjectId, int]] = []
    try:
        for line in lines:
            oid = ObjectId(line["product_id"])
            if not product_repo.reserve_stock(oid, line["quantity"]):
                raise AppError(
                    f"Estoque insuficiente para '{line['name']}'. Atualize o carrinho.",
                    code="insufficient_stock", extra={"product_id": line["product_id"]},
                )
            reserved.append((oid, line["quantity"]))
    except Exception:
        for oid, qty in reserved:
            product_repo.release_stock(oid, qty)
        raise

    now = now_utc()
    order = {
        "number": order_repo.next_number(),
        "user_id": user["_id"],
        "customer": {"name": user["name"], "email": user["email"], "phone": user.get("phone"), "cpf": user.get("cpf")},
        "items": [{k: l[k] for k in ("product_id", "name", "slug", "brand", "sku", "image",
                                      "list_price", "unit_price", "quantity", "line_total")} for l in lines],
        "shipping_address": shipping_address,
        "shipping": {k: shipping[k] for k in ("code", "name", "price", "days")},
        "subtotal": totals["subtotal"],
        "discount": totals["discount"],
        "shipping_price": totals["shipping_price"],
        "total": totals["total"],
        "notes": data.get("notes"),
        "status": OrderStatus.AWAITING_PAYMENT.value,
        "status_history": [{"status": OrderStatus.AWAITING_PAYMENT.value, "at": now, "note": "Pedido criado"}],
        "payment": {"method": data.get("payment_method", "mercadopago"), "status": PaymentStatus.PENDING.value},
        "stock_released": False,
        "tracking_code": None,
    }
    try:
        order = order_repo.insert(order)
    except Exception:
        for oid, qty in reserved:
            product_repo.release_stock(oid, qty)
        raise

    cart_repo.save(user["_id"], [])
    logger.info("Pedido #%s criado (user=%s, total=%.2f)", order["number"], user["_id"], order["total"])
    email_service.send_order_created(user["email"], user["name"], order["number"], order["total"])
    return present_order(order)


def get_user_order(user: dict, order_id: str) -> dict:
    o = order_repo.find_one({"_id": to_object_id(order_id, not_found_msg="Pedido não encontrado."), "user_id": user["_id"]})
    if not o:
        raise NotFoundError("Pedido não encontrado.")
    return o


def list_user_orders(user: dict, params: PageParams) -> dict:
    q = {"user_id": user["_id"]}
    items = order_repo.find(q, sort=[("created_at", DESCENDING)], skip=params.skip, limit=params.page_size)
    return paginated([present_order(o) for o in items], order_repo.count(q), params)


def cancel_by_customer(user: dict, order_id: str) -> dict:
    o = get_user_order(user, order_id)
    if o["status"] != OrderStatus.AWAITING_PAYMENT.value:
        raise ForbiddenError("Só é possível cancelar pedidos aguardando pagamento.")
    return present_order(_apply_status(o, OrderStatus.CANCELED, "Cancelado pelo cliente"))


# ------------------------------------------------------------------ admin
def admin_list(params: PageParams, status: Optional[str] = None, q: Optional[str] = None,
               user_id: Optional[str] = None) -> dict:
    query: dict = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = to_object_id(user_id)
    if q:
        q = q.strip()
        if q.isdigit():
            query["number"] = int(q)
        else:
            rx = {"$regex": escape_regex(q), "$options": "i"}
            query["$or"] = [{"customer.name": rx}, {"customer.email": rx}]
    items = order_repo.find(query, sort=[("created_at", DESCENDING)], skip=params.skip, limit=params.page_size)
    return paginated([present_order(o) for o in items], order_repo.count(query), params)


def admin_get(order_id: str) -> dict:
    o = order_repo.get(to_object_id(order_id, not_found_msg="Pedido não encontrado."))
    if not o:
        raise NotFoundError("Pedido não encontrado.")
    d = present_order(o)
    d["payments"] = serialize(payment_repo.find({"order_id": o["_id"]}, sort=[("created_at", DESCENDING)]))
    u = user_repo.get(o["user_id"], {"password_hash": 0})
    d["customer_account"] = serialize(u) if u else None
    return d


def admin_update_status(order_id: str, new_status: OrderStatus, note: Optional[str], tracking: Optional[str]) -> dict:
    o = order_repo.get(to_object_id(order_id, not_found_msg="Pedido não encontrado."))
    if not o:
        raise NotFoundError("Pedido não encontrado.")
    current = OrderStatus(o["status"])
    if new_status == current:
        raise AppError("O pedido já está neste status.")
    if new_status not in ALLOWED_TRANSITIONS[current]:
        raise AppError(
            f"Transição inválida: {ORDER_STATUS_LABELS[current]} → {ORDER_STATUS_LABELS[new_status]}.",
            code="invalid_transition",
        )
    if new_status == OrderStatus.SHIPPED and not (tracking or o.get("tracking_code")):
        raise AppError("Informe o código de rastreio para marcar como enviado.", code="tracking_required")
    extra = {"tracking_code": tracking} if tracking else {}
    return present_order(_apply_status(o, new_status, note or "Atualizado pelo administrador", extra))


def _apply_status(o: dict, status: OrderStatus, note: str, extra: Optional[dict] = None) -> dict:
    changes = {"status": status.value, **(extra or {})}
    if status == OrderStatus.CANCELED and not o.get("stock_released"):
        for it in o["items"]:
            product_repo.release_stock(ObjectId(it["product_id"]), it["quantity"])
        changes["stock_released"] = True
    if status == OrderStatus.PAYMENT_APPROVED and not o.get("sold_counted"):
        for it in o["items"]:
            product_repo.add_sold(ObjectId(it["product_id"]), it["quantity"])
        changes["sold_counted"] = True
    updated = order_repo.update(
        o["_id"], changes,
        {"$push": {"status_history": {"status": status.value, "at": now_utc(), "note": note}}},
    )
    logger.info("Pedido #%s: %s -> %s", o["number"], o["status"], status.value)
    return updated
