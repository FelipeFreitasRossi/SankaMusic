"""Cálculo de preços e totais — SEMPRE feito no backend.

O frontend envia apenas {product_id, quantity}. Preços, descontos, estoque e
totais são recalculados aqui a partir do banco de dados.
"""
from decimal import ROUND_HALF_UP, Decimal
from typing import Iterable

from app.core.exceptions import AppError
from app.repositories.repos import products as product_repo


def money(value: float | Decimal) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def effective_price(price: float, promo_price: float | None) -> float:
    if promo_price and 0 < promo_price < price:
        return money(promo_price)
    return money(price)


def discount_percent(price: float, promo_price: float | None) -> int:
    if promo_price and 0 < promo_price < price:
        return int(round((1 - promo_price / price) * 100))
    return 0


def merge_items(items: Iterable[dict]) -> dict[str, int]:
    """Soma quantidades de itens repetidos."""
    merged: dict[str, int] = {}
    for it in items:
        pid = str(it["product_id"])
        merged[pid] = merged.get(pid, 0) + int(it["quantity"])
    return merged


def compute_totals(lines: list[dict], shipping_price: float = 0.0) -> dict:
    """Função pura: recebe linhas com list_price, unit_price e quantity."""
    subtotal = sum(Decimal(str(l["list_price"])) * l["quantity"] for l in lines)
    items_total = sum(Decimal(str(l["unit_price"])) * l["quantity"] for l in lines)
    discount = subtotal - items_total
    total = items_total + Decimal(str(shipping_price))
    return {
        "subtotal": money(subtotal),
        "discount": money(discount),
        "items_total": money(items_total),
        "shipping_price": money(shipping_price),
        "total": money(total),
        "items_count": sum(l["quantity"] for l in lines),
    }


def build_lines(items: Iterable[dict], *, strict: bool) -> tuple[list[dict], list[dict]]:
    """Monta as linhas a partir do banco.

    strict=True  -> lança erro em qualquer problema (usado ao criar pedidos)
    strict=False -> ajusta/remove itens e retorna avisos (usado no carrinho)
    """
    merged = merge_items(items)
    found = product_repo.get_many(merged.keys())
    lines: list[dict] = []
    warnings: list[dict] = []

    for pid, qty in merged.items():
        p = found.get(pid)
        if not p or not p.get("active", False):
            if strict:
                raise AppError("Um dos produtos não está mais disponível.", code="product_unavailable",
                               extra={"product_id": pid})
            warnings.append({"product_id": pid, "type": "unavailable", "message": "Produto indisponível removido."})
            continue
        stock = int(p.get("stock", 0))
        if stock <= 0:
            if strict:
                raise AppError(f"'{p['name']}' está sem estoque.", code="out_of_stock", extra={"product_id": pid})
            warnings.append({"product_id": pid, "type": "out_of_stock", "message": f"'{p['name']}' esgotou."})
            continue
        if qty > stock:
            if strict:
                raise AppError(
                    f"Estoque insuficiente para '{p['name']}'. Disponível: {stock}.",
                    code="insufficient_stock",
                    extra={"product_id": pid, "available": stock},
                )
            warnings.append({"product_id": pid, "type": "quantity_adjusted",
                             "message": f"Quantidade de '{p['name']}' ajustada para {stock}."})
            qty = stock

        list_price = money(p["price"])
        unit_price = effective_price(p["price"], p.get("promo_price"))
        lines.append({
            "product_id": pid,
            "name": p["name"],
            "slug": p["slug"],
            "brand": p.get("brand"),
            "sku": p.get("sku"),
            "image": (p.get("images") or [None])[0],
            "list_price": list_price,
            "unit_price": unit_price,
            "quantity": qty,
            "stock": stock,
            "line_total": money(Decimal(str(unit_price)) * qty),
        })
    return lines, warnings
