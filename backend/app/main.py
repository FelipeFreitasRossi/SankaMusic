"""Aplicação FastAPI — Sanka Music.

Execução local:   uvicorn app.main:app --reload
Produção (VPS):   uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
HostGator/cPanel: passenger_wsgi.py (adaptador ASGI -> WSGI)
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import account, admin, auth, catalog, orders
from app.core.config import settings
from app.core.database import ensure_indexes, get_db
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger("sanka.app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        ensure_indexes()
    except Exception:  # noqa: BLE001 — a API sobe mesmo se o Atlas estiver indisponível
        logger.exception("Não foi possível criar índices no MongoDB (verifique MONGODB_URI).")
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="API do e-commerce Sanka Music. Documentação interativa (Swagger).",
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=None,
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,  # usamos Bearer token, não cookies
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        max_age=600,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    @app.middleware("http")
    async def security_and_logging(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        if response.status_code >= 500 or ms > 1500:
            logger.warning("%s %s -> %s (%.0f ms)", request.method, request.url.path, response.status_code, ms)
        elif settings.DEBUG:
            logger.info("%s %s -> %s (%.0f ms)", request.method, request.url.path, response.status_code, ms)
        return response

    register_exception_handlers(app)

    api = APIRouter(prefix=settings.API_PREFIX)

    @api.get("/health", tags=["Sistema"], summary="Verificação de saúde")
    def health():
        db_ok = True
        try:
            get_db().command("ping")
        except Exception:  # noqa: BLE001
            db_ok = False
        return {"status": "ok" if db_ok else "degraded", "database": db_ok, "env": settings.APP_ENV}

    for r in (auth.router, catalog.router, account.router, orders.router, admin.router):
        api.include_router(r)
    app.include_router(api)

    # Arquivos enviados pelo painel (modo de armazenamento "local")
    if settings.STORAGE_BACKEND == "local":
        settings.upload_path.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=str(settings.upload_path)), name="media")

    return app


app = create_app()
