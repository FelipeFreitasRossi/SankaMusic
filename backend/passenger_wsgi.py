"""Ponto de entrada para Phusion Passenger (cPanel "Setup Python App" — HostGator).

O Passenger fala WSGI; o FastAPI é ASGI. O `a2wsgi` faz a ponte, permitindo
rodar a API em planos que oferecem aplicações Python via cPanel, sem processo
ASGI persistente próprio.

No cPanel:
  Application root:        sankamusic-api   (pasta onde está este arquivo)
  Application startup file: passenger_wsgi.py
  Application Entry point:  application
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault("APP_ENV", "production")

from a2wsgi import ASGIMiddleware  # noqa: E402

from app.main import app as asgi_app  # noqa: E402

# O a2wsgi não executa eventos "lifespan"; criamos os índices na inicialização.
try:
    from app.core.database import ensure_indexes

    ensure_indexes()
except Exception:  # noqa: BLE001
    import logging

    logging.getLogger("sanka.app").exception("Falha ao criar índices na inicialização (Passenger).")

application = ASGIMiddleware(asgi_app)
