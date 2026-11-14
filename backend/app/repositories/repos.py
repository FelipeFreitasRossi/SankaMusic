"""Repositórios específicos por coleção."""
from typing import Optional

from bson import ObjectId
from pymongo import ReturnDocument

from app.models.collections import Collections as C
from app.repositories.base import BaseRepository
from app.utils.mongo import now_utc


class UserRepository(BaseRepository):
    collection_name = C.USERS

    def by_email(self, email: str) -> Optional[dict]:
        return self.col.find_one({"email": email.lower()})


class CategoryRepository(BaseRepository):
    collection_name = C.CATEGORIES

    def by_slug(self, slug: str) -> Optional[dict]:
        return self.col.find_one({"slug": slug})


class ProductRepository(BaseRepository):
    collection_name = C.PRODUCTS

    def by_slug(self, slug: str) -> Optional[dict]:
        return self.col.find_one({"slug": slug})

    def reserve_stock(self, product_id: ObjectId, qty: int) -> bool:
        """Decrementa estoque de forma atômica somente se houver quantidade suficiente."""
        res = self.col.update_one(
            {"_id": product_id, "active": True, "stock": {"$gte": qty}},
            {"$inc": {"stock": -qty}, "$set": {"updated_at": now_utc()}},
        )
        return res.modified_count == 1

    def release_stock(self, product_id: ObjectId, qty: int) -> None:
        self.col.update_one({"_id": product_id}, {"$inc": {"stock": qty}, "$set": {"updated_at": now_utc()}})

    def add_sold(self, product_id: ObjectId, qty: int) -> None:
        self.col.update_one({"_id": product_id}, {"$inc": {"sold_count": qty}})


class OrderRepository(BaseRepository):
    collection_name = C.ORDERS

    def next_number(self) -> int:
        doc = self.col.database[C.COUNTERS].find_one_and_update(
            {"_id": "orders"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
        )
        return 100000 + int(doc["seq"])


class CartRepository(BaseRepository):
    collection_name = C.CARTS

    def by_user(self, user_id: ObjectId) -> Optional[dict]:
        return self.col.find_one({"user_id": user_id})

    def save(self, user_id: ObjectId, items: list[dict]) -> dict:
        return self.col.find_one_and_update(
            {"user_id": user_id},
            {"$set": {"items": items, "updated_at": now_utc()}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )


class FavoriteRepository(BaseRepository):
    collection_name = C.FAVORITES


class AddressRepository(BaseRepository):
    collection_name = C.ADDRESSES


class PaymentRepository(BaseRepository):
    collection_name = C.PAYMENTS


class ReviewRepository(BaseRepository):
    collection_name = C.REVIEWS


class PasswordResetRepository(BaseRepository):
    collection_name = C.PASSWORD_RESETS


class NewsletterRepository(BaseRepository):
    collection_name = C.NEWSLETTER


users = UserRepository()
categories = CategoryRepository()
products = ProductRepository()
orders = OrderRepository()
carts = CartRepository()
favorites = FavoriteRepository()
addresses = AddressRepository()
payments = PaymentRepository()
reviews = ReviewRepository()
password_resets = PasswordResetRepository()
newsletter = NewsletterRepository()
