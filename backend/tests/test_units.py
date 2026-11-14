from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.services.pricing import compute_totals, discount_percent, effective_price
from app.services.storage_service import detect_image_type
from app.utils.text import is_valid_cpf, slugify


def test_password_hash():
    h = hash_password("segredo123")
    assert verify_password("segredo123", h)
    assert not verify_password("outra", h)


def test_jwt_roundtrip():
    token, _ = create_access_token("507f1f77bcf86cd799439011", "customer")
    assert decode_access_token(token)["sub"] == "507f1f77bcf86cd799439011"


def test_pricing():
    assert effective_price(100, 80) == 80
    assert effective_price(100, None) == 100
    assert effective_price(100, 120) == 100
    assert discount_percent(100, 75) == 25
    t = compute_totals([{"list_price": 100, "unit_price": 80, "quantity": 2}], 19.9)
    assert t == {"subtotal": 200.0, "discount": 40.0, "items_total": 160.0, "shipping_price": 19.9,
                 "total": 179.9, "items_count": 2}


def test_helpers():
    assert slugify("Violão Clássico Nylon") == "violao-classico-nylon"
    assert is_valid_cpf("529.982.247-25") and not is_valid_cpf("111.111.111-11")
    assert detect_image_type(b"\x89PNG\r\n\x1a\n0000") == "png"
    assert detect_image_type(b"GIF89a") is None
