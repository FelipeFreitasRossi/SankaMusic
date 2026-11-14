from fastapi import APIRouter, Depends, Request

from app.api.deps import get_current_user
from app.schemas.order import OrderCreate, ShippingQuoteIn
from app.services import order_service, payment_service
from app.services.pricing import build_lines, compute_totals
from app.services.shipping import get_shipping_provider
from app.utils.pagination import PageParams, page_params

router = APIRouter(tags=["Pedidos"])


@router.post("/shipping/quote", tags=["Frete"], summary="Opções de frete para um CEP")
def shipping_quote(body: ShippingQuoteIn):
    lines, _ = build_lines([i.model_dump() for i in body.items], strict=False)
    totals = compute_totals(lines)
    return {"options": get_shipping_provider().quote(body.cep, totals["items_total"], totals["items_count"])}


@router.post("/orders", status_code=201, summary="Cria pedido (valores recalculados no servidor)")
def create_order(body: OrderCreate, user: dict = Depends(get_current_user)):
    data = body.model_dump()
    data["items"] = [i for i in data["items"]]
    return order_service.create_order(user, data)


@router.get("/orders", summary="Histórico de pedidos do cliente")
def my_orders(params: PageParams = Depends(page_params), user: dict = Depends(get_current_user)):
    return order_service.list_user_orders(user, params)


@router.get("/orders/{order_id}", summary="Detalhe do pedido do cliente")
def my_order(order_id: str, user: dict = Depends(get_current_user)):
    return order_service.present_order(order_service.get_user_order(user, order_id))


@router.post("/orders/{order_id}/cancel", summary="Cancela pedido aguardando pagamento")
def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    return order_service.cancel_by_customer(user, order_id)


# ----------------------------------------------------------------- pagamentos
@router.post("/payments/{order_id}/checkout", tags=["Pagamentos"], summary="Inicia pagamento no provedor")
def start_payment(order_id: str, user: dict = Depends(get_current_user)):
    return payment_service.start_checkout(user, order_id)


@router.post("/payments/{order_id}/sync", tags=["Pagamentos"], summary="Consulta status no provedor")
def sync_payment(order_id: str, user: dict = Depends(get_current_user)):
    return payment_service.sync_order_payment(user, order_id)


@router.post("/payments/webhook/mercadopago", tags=["Pagamentos"], summary="Webhook do Mercado Pago")
async def mercadopago_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        body = {}
    headers = {k.lower(): v for k, v in request.headers.items()}
    payment_service.handle_mercadopago_webhook(dict(request.query_params), body if isinstance(body, dict) else {}, headers)
    return {"received": True}
