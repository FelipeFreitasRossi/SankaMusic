"""Repositório base: isola o acesso ao MongoDB das regras de negócio."""
from typing import Any, Iterable, Optional

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection

from app.core.database import get_db
from app.utils.mongo import now_utc, to_object_id


class BaseRepository:
    collection_name: str = ""

    @property
    def col(self) -> Collection:
        return get_db()[self.collection_name]

    def get(self, id_: str | ObjectId, projection: Optional[dict] = None) -> Optional[dict]:
        return self.col.find_one({"_id": to_object_id(id_)}, projection)

    def find_one(self, query: dict, projection: Optional[dict] = None) -> Optional[dict]:
        return self.col.find_one(query, projection)

    def find(
        self,
        query: dict,
        *,
        sort: Optional[list[tuple[str, int]]] = None,
        skip: int = 0,
        limit: int = 0,
        projection: Optional[dict] = None,
    ) -> list[dict]:
        cur = self.col.find(query, projection)
        if sort:
            cur = cur.sort(sort)
        if skip:
            cur = cur.skip(skip)
        if limit:
            cur = cur.limit(limit)
        return list(cur)

    def count(self, query: dict) -> int:
        return self.col.count_documents(query)

    def insert(self, data: dict) -> dict:
        now = now_utc()
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        res = self.col.insert_one(data)
        data["_id"] = res.inserted_id
        return data

    def update(self, id_: str | ObjectId, changes: dict, extra_ops: Optional[dict] = None) -> Optional[dict]:
        ops: dict[str, Any] = {"$set": {**changes, "updated_at": now_utc()}}
        if extra_ops:
            ops.update(extra_ops)
        return self.col.find_one_and_update(
            {"_id": to_object_id(id_)}, ops, return_document=ReturnDocument.AFTER
        )

    def delete(self, id_: str | ObjectId) -> bool:
        return self.col.delete_one({"_id": to_object_id(id_)}).deleted_count == 1

    def get_many(self, ids: Iterable[str | ObjectId], projection: Optional[dict] = None) -> dict[str, dict]:
        oids = [i if isinstance(i, ObjectId) else ObjectId(i) for i in ids if ObjectId.is_valid(str(i))]
        if not oids:
            return {}
        return {str(d["_id"]): d for d in self.col.find({"_id": {"$in": oids}}, projection)}
