"""Armazenamento de imagens.

Imagens NÃO são salvas no MongoDB — apenas suas URLs.

- `local`: grava em UPLOAD_DIR e serve em /media (funciona em VPS e em
  hospedagem compartilhada; na HostGator aponte UPLOAD_DIR para uma pasta
  dentro de public_html e MEDIA_BASE_URL para a URL dessa pasta).
- Para armazenamento externo (Cloudinary, Amazon S3, Cloudflare R2, Bunny),
  implemente `StorageBackend.save()` e registre em `get_storage()`.
"""
import logging
import secrets
from pathlib import Path
from typing import Protocol

from app.core.config import settings
from app.core.exceptions import AppError

logger = logging.getLogger("sanka.storage")

ALLOWED_CT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def detect_image_type(head: bytes) -> str | None:
    """Verifica a assinatura binária (magic bytes) — não confiamos no Content-Type."""
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def validate_image(data: bytes, content_type: str | None) -> str:
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if not data:
        raise AppError("Arquivo vazio.", code="empty_file")
    if len(data) > max_bytes:
        raise AppError(f"Arquivo maior que {settings.MAX_UPLOAD_MB} MB.", code="file_too_large", status_code=413)
    if content_type not in ALLOWED_CT:
        raise AppError("Formato não permitido. Envie JPG, PNG ou WEBP.", code="invalid_file_type", status_code=415)
    ext = detect_image_type(data[:16])
    if not ext:
        raise AppError("O arquivo não é uma imagem válida.", code="invalid_image", status_code=415)
    return ext


class StorageBackend(Protocol):
    def save(self, data: bytes, ext: str) -> str: ...


class LocalStorage:
    def __init__(self, root: Path, base_url: str):
        self.root = root
        self.base_url = base_url.rstrip("/")

    def save(self, data: bytes, ext: str) -> str:
        sub = self.root / "products"
        sub.mkdir(parents=True, exist_ok=True)
        name = f"{secrets.token_hex(12)}.{ext}"
        (sub / name).write_bytes(data)
        logger.info("Imagem salva: products/%s (%d bytes)", name, len(data))
        return f"{self.base_url}/products/{name}"


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "local":
        return LocalStorage(settings.upload_path, settings.MEDIA_BASE_URL)
    raise AppError(f"Backend de armazenamento '{settings.STORAGE_BACKEND}' não implementado.", status_code=500)


def save_image(data: bytes, content_type: str | None) -> str:
    ext = validate_image(data, content_type)
    return get_storage().save(data, ext)
