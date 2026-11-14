"""Conexão com o MongoDB (Atlas) e criação de índices.

Usa um único MongoClient por processo (thread-safe, com pool interno). Pool
pequeno para baixo consumo de memória em hospedagem compartilhada.
"""
import logging
from typing import Optional

from pymongo import ASCENDING, DESCENDING, TEXT, IndexModel, MongoClient
from pymongo.database import Database

from app.core.config import settings
from app.models.collections import Collections as C

logger = logging.getLogger("sanka.db")

_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGODB_URI,
            maxPoolSize=10,
            minPoolSize=0,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
            tz_aware=True,
            appname="sanka-music-api",
        )
    return _client


def get_db() -> Database:
    global _db
    if _db is None:
        _db = get_client()[settings.MONGODB_DB]
    return _db


def set_db(db: Database) -> None:
    """Permite injetar outro banco (ex.: mongomock nos testes)."""
    global _db
    _db = db


def close_client() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client, _db = None, None


INDEXES: dict[str, list[IndexModel]] = {
    C.USERS: [
        IndexModel([("email", ASCENDING)], unique=True, name="uniq_email"),
        IndexModel([("role", ASCENDING), ("created_at", DESCENDING)], name="role_created"),
    ],
    C.PRODUCTS: [
        IndexModel([("slug", ASCENDING)], unique=True, name="uniq_slug"),
        IndexModel([("sku", ASCENDING)], unique=True, sparse=True, name="uniq_sku"),
        IndexModel(
            [("name", TEXT), ("brand", TEXT), ("description", TEXT)],
            weights={"name": 10, "brand": 5, "description": 1},
            default_language="portuguese",
            name="text_search",
        ),
        IndexModel([("active", ASCENDING), ("category_slug", ASCENDING), ("final_price", ASCENDING)], name="cat_price"),
        IndexModel([("active", ASCENDING), ("brand", ASCENDING)], name="brand"),
        IndexModel([("active", ASCENDING), ("sold_count", DESCENDING)], name="best_sellers"),
        IndexModel([("active", ASCENDING), ("created_at", DESCENDING)], name="newest"),
        IndexModel([("active", ASCENDING), ("rating_avg", DESCENDING)], name="rating"),
        IndexModel([("stock", ASCENDING)], name="stock"),
    ],
    C.CATEGORIES: [
        IndexModel([("slug", ASCENDING)], unique=True, name="uniq_slug"),
        IndexModel([("order", ASCENDING)], name="order"),
    ],
    C.ORDERS: [
        IndexModel([("number", ASCENDING)], unique=True, name="uniq_number"),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_orders"),
        IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created"),
        IndexModel([("created_at", DESCENDING)], name="created"),
    ],
    C.CARTS: [IndexModel([("user_id", ASCENDING)], unique=True, name="uniq_user")],
    C.FAVORITES: [
        IndexModel([("user_id", ASCENDING), ("product_id", ASCENDING)], unique=True, name="uniq_user_product"),
    ],
    C.ADDRESSES: [IndexModel([("user_id", ASCENDING), ("is_default", DESCENDING)], name="user_addresses")],
    C.PAYMENTS: [
        IndexModel([("order_id", ASCENDING)], name="order"),
        IndexModel([("provider", ASCENDING), ("provider_payment_id", ASCENDING)], name="provider_payment"),
    ],
    C.REVIEWS: [
        IndexModel([("product_id", ASCENDING), ("created_at", DESCENDING)], name="product_reviews"),
        IndexModel([("product_id", ASCENDING), ("user_id", ASCENDING)], unique=True, name="uniq_user_review"),
    ],
    C.PASSWORD_RESETS: [
        IndexModel([("token_hash", ASCENDING)], unique=True, name="uniq_token"),
        # TTL: o MongoDB remove automaticamente tokens expirados
        IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="ttl_expires"),
    ],
    C.NEWSLETTER: [IndexModel([("email", ASCENDING)], unique=True, name="uniq_email")],
    C.COUNTERS: [],
}


def ensure_indexes(db: Optional[Database] = None) -> None:
    db = db if db is not None else get_db()
    for coll, models in INDEXES.items():
        if models:
            db[coll].create_indexes(models)
    logger.info("Índices verificados/criados.")
