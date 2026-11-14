"""Utilitários para ObjectId e serialização de documentos."""
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.core.exceptions import NotFoundError


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(value: str | ObjectId, *, not_found_msg: str = "Registro não encontrado.") -> ObjectId:
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        raise NotFoundError(not_found_msg)


def is_object_id(value: Any) -> bool:
    return isinstance(value, str) and ObjectId.is_valid(value)


def serialize(doc: Any) -> Any:
    """Converte ObjectId -> str e renomeia _id -> id (recursivo)."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        out = {}
        for k, v in doc.items():
            key = "id" if k == "_id" else k
            out[key] = serialize(v)
        return out
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc
