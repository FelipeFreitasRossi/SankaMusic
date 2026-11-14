"""Testes de integração da API usando MongoDB em memória (mongomock).

Executar (na pasta backend):
    pip install -r requirements-dev.txt
    pytest -q
"""
import mongomock
import pytest
from fastapi.testclient import TestClient

from app.core import database
from app.core.config import settings

P = settings.API_PREFIX


@pytest.fixture()
def client():
    db = mongomock.MongoClient(tz_aware=True)["sanka_test"]
    database.set_db(db)
    from app.main import create_app
    from scripts import seed as seed_mod

    try:
        database.ensure_indexes(db)
    except Exception:  # mongomock não suporta índices de texto
        pass
    seed_mod.ensure_indexes = lambda *_: None
    seed_mod.seed()
    with TestClient(create_app()) as c:
        yield c


def _register(client, email="cliente@example.com"):
    r = client.post(f"{P}/auth/register", json={"name": "Cliente Teste", "email": email, "password": "senha1234"})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_health_and_catalog(client):
    assert client.get(f"{P}/health").status_code == 200
    r = client.get(f"{P}/products", params={"category": "guitarras", "sort": "price_asc"})
    data = r.json()
    assert r.status_code == 200 and data["total"] == 4
    prices = [p["final_price"] for p in data["items"]]
    assert prices == sorted(prices)
    assert client.get(f"{P}/products/showcase").json()["featured"]


def test_auth_flow(client):
    h = _register(client)
    assert client.get(f"{P}/auth/me", headers=h).json()["email"] == "cliente@example.com"
    assert client.post(f"{P}/auth/login", json={"email": "cliente@example.com", "password": "errada123"}).status_code == 401
    assert client.get(f"{P}/auth/me").status_code == 401


def test_admin_protected(client):
    h = _register(client)
    assert client.get(f"{P}/admin/dashboard", headers=h).status_code == 403


def test_order_recalculates_prices_and_reserves_stock(client):
    h = _register(client)
    prod = client.get(f"{P}/products/guitarra-vertice-v-classic-sss-sunburst").json()["product"]
    stock_before = prod["stock"]
    body = {
        "items": [{"product_id": prod["id"], "quantity": 2}],
        "address": {"recipient": "Cliente Teste", "cep": "01001-000", "street": "Praça da Sé", "number": "1",
                    "district": "Sé", "city": "São Paulo", "state": "SP"},
        "shipping_code": "standard",
    }
    r = client.post(f"{P}/orders", json=body, headers=h)
    assert r.status_code == 201, r.text
    order = r.json()
    assert order["status"] == "awaiting_payment"
    assert order["subtotal"] == prod["price"] * 2
    assert order["discount"] == round((prod["price"] - prod["final_price"]) * 2, 2)
    after = client.get(f"{P}/products/{prod['slug']}").json()["product"]["stock"]
    assert after == stock_before - 2

    # pagamento sem credenciais -> 503, pedido continua aguardando
    assert client.post(f"{P}/payments/{order['id']}/checkout", headers=h).status_code == 503

    # cancelamento devolve estoque
    assert client.post(f"{P}/orders/{order['id']}/cancel", headers=h).json()["status"] == "canceled"
    assert client.get(f"{P}/products/{prod['slug']}").json()["product"]["stock"] == stock_before


def test_out_of_stock_rejected(client):
    h = _register(client)
    prod = client.get(f"{P}/products/baixo-orbe-groove-5-black").json()["product"]
    assert prod["stock"] == 0
    body = {"items": [{"product_id": prod["id"], "quantity": 1}], "shipping_code": "standard",
            "address": {"recipient": "Cliente", "cep": "01001000", "street": "Rua A", "number": "1",
                        "district": "Centro", "city": "São Paulo", "state": "SP"}}
    r = client.post(f"{P}/orders", json=body, headers=h)
    assert r.status_code == 400 and r.json()["code"] == "out_of_stock"
