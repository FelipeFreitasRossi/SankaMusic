from datetime import timedelta

from pymongo import ASCENDING, DESCENDING

from app.core.config import settings
from app.models.collections import OrderStatus
from app.repositories.repos import orders as order_repo
from app.repositories.repos import products as product_repo
from app.repositories.repos import users as user_repo
from app.services.catalog_service import present_product
from app.services.order_service import present_order
from app.utils.mongo import now_utc

PAID = [OrderStatus.PAYMENT_APPROVED.value, OrderStatus.PREPARING.value,
        OrderStatus.SHIPPED.value, OrderStatus.DELIVERED.value]


def summary(days: int = 30) -> dict:
    since = now_utc() - timedelta(days=days)

    def revenue(match: dict) -> tuple[float, int]:
        r = list(order_repo.col.aggregate([
            {"$match": match},
            {"$group": {"_id": None, "total": {"$sum": "$total"}, "n": {"$sum": 1}}},
        ]))
        return (round(r[0]["total"], 2), r[0]["n"]) if r else (0.0, 0)

    revenue_all, paid_orders = revenue({"status": {"$in": PAID}})
    revenue_period, paid_period = revenue({"status": {"$in": PAID}, "created_at": {"$gte": since}})

    status_counts = {s.value: 0 for s in OrderStatus}
    for r in order_repo.col.aggregate([{"$group": {"_id": "$status", "n": {"$sum": 1}}}]):
        status_counts[r["_id"]] = r["n"]

    daily = list(order_repo.col.aggregate([
        {"$match": {"status": {"$in": PAID}, "created_at": {"$gte": since}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "total": {"$sum": "$total"}, "orders": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]))

    low = settings.LOW_STOCK_THRESHOLD
    low_stock = product_repo.find({"stock": {"$lte": low}}, sort=[("stock", ASCENDING)], limit=10)
    best = product_repo.find({"sold_count": {"$gt": 0}}, sort=[("sold_count", DESCENDING)], limit=5)
    recent = order_repo.find({}, sort=[("created_at", DESCENDING)], limit=8)

    return {
        "period_days": days,
        "total_sales": paid_orders,                 # pedidos pagos (vendas)
        "orders_count": order_repo.count({}),       # todos os pedidos
        "revenue_total": revenue_all,               # faturamento confirmado
        "revenue_period": revenue_period,
        "sales_period": paid_period,
        "average_ticket": round(revenue_all / paid_orders, 2) if paid_orders else 0.0,
        "products_count": product_repo.count({}),
        "active_products": product_repo.count({"active": True}),
        "customers_count": user_repo.count({"role": "customer"}),
        "low_stock_count": product_repo.count({"stock": {"$lte": low}}),
        "low_stock_threshold": low,
        "status_counts": status_counts,
        "daily": [{"date": d["_id"], "total": round(d["total"], 2), "orders": d["orders"]} for d in daily],
        "low_stock": [present_product(p) for p in low_stock],
        "best_sellers": [present_product(p) for p in best],
        "recent_orders": [present_order(o) for o in recent],
    }
