"""Pagamentos — arquitetura preparada para gateways (Mercado Pago implementado).

Princípios:
- O pedido só vira "Pagamento aprovado" quando o PROVEDOR confirma.
- O webhook nunca confia no corpo recebido: o status é consultado na API do
  provedor usando o ID informado.
- O valor pago é comparado ao total do pedido antes de aprovar.
- Sem credenciais configuradas, o pagamento fica indisponível (HTTP 503) e o
  pedido permanece "Aguardando pagamento".

Para adicionar outro gateway (PagSeguro, Stripe, Asaas...), implemente a
interface `PaymentProvider` e registre em `get_provider()`.
"""
import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional, Protocol

from bson import ObjectId

from app.core.config import settings
from app.core.exceptions import AppError, ForbiddenError, NotFoundError, ServiceUnavailableError
from app.models.collections import OrderStatus, PaymentStatus
from app.repositories.repos import orders as order_repo
from app.repositories.repos import payments as payment_repo
from app.services import order_service
from app.utils.mongo import now_utc, serialize

logger = logging.getLogger("sanka.payments")

MP_API = "https://api.mercadopago.com"

MP_STATUS_MAP = {
    "approved": PaymentStatus.APPROVED,
    "authorized": PaymentStatus.IN_PROCESS,
    "in_process": PaymentStatus.IN_PROCESS,
    "in_mediation": PaymentStatus.IN_PROCESS,
    "pending": PaymentStatus.PENDING,
    "rejected": PaymentStatus.REJECTED,
    "cancelled": PaymentStatus.CANCELED,
    "refunded": PaymentStatus.REFUNDED,
    "charged_back": PaymentStatus.REFUNDED,
}


class PaymentProvider(Protocol):
    name: str

    def create_checkout(self, order: dict) -> dict: ...
    def fetch_payment(self, payment_id: str) -> dict: ...
    def search_by_reference(self, reference: str) -> list[dict]: ...


class MercadoPagoProvider:
    name = "mercadopago"

    def __init__(self, access_token: str):
        self.token = access_token

    def _request(self, method: str, path: str, body: Optional[dict] = None, idem_key: Optional[str] = None) -> Any:
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(MP_API + path, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.token}")
        req.add_header("Content-Type", "application/json")
        if idem_key:
            req.add_header("X-Idempotency-Key", idem_key)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            logger.error("Mercado Pago HTTP %s em %s: %s", e.code, path, e.read()[:500])
            raise ServiceUnavailableError("Não foi possível comunicar com o provedor de pagamento.")
        except (urllib.error.URLError, TimeoutError):
            logger.exception("Mercado Pago indisponível (%s)", path)
            raise ServiceUnavailableError("Provedor de pagamento indisponível. Tente novamente.")

    def create_checkout(self, order: dict) -> dict:
        oid = str(order["_id"])
        front = settings.FRONTEND_URL.rstrip("/")
        items = [{
            "id": it["product_id"], "title": it["name"][:250], "quantity": it["quantity"],
            "unit_price": float(it["unit_price"]), "currency_id": "BRL",
        } for it in order["items"]]
        if order.get("shipping_price"):
            items.append({"id": "frete", "title": f"Frete — {order['shipping']['name']}", "quantity": 1,
                          "unit_price": float(order["shipping_price"]), "currency_id": "BRL"})
        body = {
            "items": items,
            "payer": {"name": order["customer"]["name"], "email": order["customer"]["email"]},
            "external_reference": oid,
            "statement_descriptor": "SANKA MUSIC",
            "back_urls": {
                "success": f"{front}/pedido/{oid}/retorno",
                "pending": f"{front}/pedido/{oid}/retorno",
                "failure": f"{front}/pedido/{oid}/retorno",
            },
            "auto_return": "approved",
            "notification_url": f"{settings.API_PUBLIC_URL.rstrip('/')}{settings.API_PREFIX}/payments/webhook/mercadopago",
            "metadata": {"order_number": order["number"]},
        }
        pref = self._request("POST", "/checkout/preferences", body, idem_key=f"pref-{oid}-{order.get('payment_attempts', 0)}")
        return {"preference_id": pref.get("id"), "redirect_url": pref.get("init_point"),
                "sandbox_url": pref.get("sandbox_init_point")}

    def fetch_payment(self, payment_id: str) -> dict:
        return self._request("GET", f"/v1/payments/{urllib.parse.quote(str(payment_id))}")

    def search_by_reference(self, reference: str) -> list[dict]:
        q = urllib.parse.urlencode({"external_reference": reference, "sort": "date_created", "criteria": "desc"})
        return self._request("GET", f"/v1/payments/search?{q}").get("results", [])


def get_provider() -> PaymentProvider:
    if not settings.payments_enabled:
        raise ServiceUnavailableError(
            "Pagamento online ainda não configurado nesta loja. Seu pedido foi registrado e "
            "permanece aguardando pagamento.",
            code="payments_not_configured",
        )
    return MercadoPagoProvider(settings.MERCADOPAGO_ACCESS_TOKEN)


# ------------------------------------------------------------------ casos de uso
def start_checkout(user: dict, order_id: str) -> dict:
    order = order_service.get_user_order(user, order_id)
    if order["status"] != OrderStatus.AWAITING_PAYMENT.value:
        raise AppError("Este pedido não está aguardando pagamento.", code="not_awaiting_payment")
    provider = get_provider()
    result = provider.create_checkout(order)
    payment_repo.insert({
        "order_id": order["_id"], "user_id": user["_id"], "provider": provider.name,
        "preference_id": result.get("preference_id"), "provider_payment_id": None,
        "status": PaymentStatus.PENDING.value, "amount": order["total"],
    })
    order_repo.update(order["_id"], {}, {"$inc": {"payment_attempts": 1}})
    return {"redirect_url": result["redirect_url"], "provider": provider.name}


def _apply_provider_payment(mp: dict) -> Optional[dict]:
    """Aplica um pagamento consultado na API do provedor ao pedido correspondente."""
    ref = mp.get("external_reference")
    if not ref or not ObjectId.is_valid(ref):
        logger.warning("Pagamento %s sem referência de pedido válida", mp.get("id"))
        return None
    order = order_repo.get(ref)
    if not order:
        logger.warning("Pagamento %s referencia pedido inexistente %s", mp.get("id"), ref)
        return None

    status = MP_STATUS_MAP.get(mp.get("status", ""), PaymentStatus.PENDING)
    amount = float(mp.get("transaction_amount") or 0)
    pay_id = str(mp.get("id"))

    payment_repo.col.update_one(
        {"provider": "mercadopago", "provider_payment_id": pay_id},
        {"$set": {"order_id": order["_id"], "user_id": order["user_id"], "status": status.value,
                  "raw_status": mp.get("status"), "status_detail": mp.get("status_detail"),
                  "amount": amount, "method": mp.get("payment_type_id"), "updated_at": now_utc()},
         "$setOnInsert": {"created_at": now_utc(), "provider": "mercadopago", "provider_payment_id": pay_id}},
        upsert=True,
    )
    order_repo.update(order["_id"], {"payment": {**order.get("payment", {}), "status": status.value,
                                                 "payment_id": pay_id, "method_detail": mp.get("payment_type_id")}})

    if status == PaymentStatus.APPROVED and order["status"] == OrderStatus.AWAITING_PAYMENT.value:
        if abs(amount - float(order["total"])) > 0.01:
            logger.error("Valor divergente no pedido #%s: pago %.2f, esperado %.2f",
                         order["number"], amount, order["total"])
            return order_repo.get(order["_id"])
        order = order_service._apply_status(order, OrderStatus.PAYMENT_APPROVED, f"Pagamento {pay_id} aprovado pelo provedor")
    return order


def handle_mercadopago_webhook(query: dict, body: dict, headers: dict) -> None:
    topic = query.get("type") or query.get("topic") or body.get("type") or body.get("topic")
    data_id = query.get("data.id") or (body.get("data") or {}).get("id") or query.get("id")
    if topic != "payment" or not data_id:
        return
    if settings.MERCADOPAGO_WEBHOOK_SECRET:
        _verify_signature(str(data_id), headers)
    provider = get_provider()
    mp = provider.fetch_payment(str(data_id))  # nunca confia no corpo do webhook
    _apply_provider_payment(mp)


def _verify_signature(data_id: str, headers: dict) -> None:
    sig = headers.get("x-signature", "")
    req_id = headers.get("x-request-id", "")
    parts = dict(p.split("=", 1) for p in sig.split(",") if "=" in p)
    ts, v1 = parts.get("ts", "").strip(), parts.get("v1", "").strip()
    manifest = f"id:{data_id.lower()};request-id:{req_id};ts:{ts};"
    expected = hmac.new(settings.MERCADOPAGO_WEBHOOK_SECRET.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    if not v1 or not hmac.compare_digest(expected, v1):
        logger.warning("Assinatura de webhook inválida")
        raise ForbiddenError("Assinatura inválida.")


def sync_order_payment(user: dict, order_id: str) -> dict:
    """Consulta o provedor (usado na página de retorno após o pagamento)."""
    order = order_service.get_user_order(user, order_id)
    if settings.payments_enabled and order["status"] == OrderStatus.AWAITING_PAYMENT.value:
        try:
            results = get_provider().search_by_reference(str(order["_id"]))
            for mp in results[:5]:
                updated = _apply_provider_payment(mp)
                if updated:
                    order = updated
                if mp.get("status") == "approved":
                    break
        except ServiceUnavailableError:
            logger.warning("Não foi possível sincronizar pagamento do pedido %s", order_id)
    return order_service.present_order(order)


def list_payments_for_order(order_id: str) -> list[dict]:
    o = order_repo.get(order_id)
    if not o:
        raise NotFoundError("Pedido não encontrado.")
    return serialize(payment_repo.find({"order_id": o["_id"]}))
