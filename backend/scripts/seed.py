"""Popula o banco com DADOS DE DEMONSTRAÇÃO (categorias e produtos fictícios).

Uso (na pasta backend, com o venv ativo):
    python -m scripts.seed                # cria/atualiza categorias e produtos demo
    python -m scripts.seed --clear-demo   # remove apenas os produtos demo (is_demo=True)

Não cria pedidos, clientes nem avaliações.
"""
import argparse
import sys
from datetime import timedelta

from app.core.database import ensure_indexes, get_db
from app.models.collections import Collections as C
from app.services.pricing import effective_price
from app.utils.mongo import now_utc
from scripts import demo_data


def seed() -> None:
    db = get_db()
    ensure_indexes(db)
    now = now_utc()

    cat_ids = {}
    for c in demo_data.CATEGORIES:
        db[C.CATEGORIES].update_one(
            {"slug": c["slug"]},
            {"$set": {**c, "active": True, "updated_at": now}, "$setOnInsert": {"created_at": now, "image": None}},
            upsert=True,
        )
        cat_ids[c["slug"]] = db[C.CATEGORIES].find_one({"slug": c["slug"]})["_id"]

    for p in demo_data.products():
        created = now - timedelta(days=p.pop("age_days"))
        p.pop("kind"), p.pop("color")
        doc = {
            **p,
            "category_id": cat_ids[p["category_slug"]],
            "final_price": effective_price(p["price"], p["promo_price"]),
            "active": True,
            "is_demo": True,
            "updated_at": now,
        }
        db[C.PRODUCTS].update_one(
            {"slug": p["slug"]},
            {"$set": doc, "$setOnInsert": {"created_at": created, "rating_avg": 0.0, "rating_count": 0}},
            upsert=True,
        )
    print(f"✔ {len(demo_data.CATEGORIES)} categorias e {len(demo_data.products())} produtos de DEMONSTRAÇÃO gravados.")


def clear_demo() -> None:
    n = get_db()[C.PRODUCTS].delete_many({"is_demo": True}).deleted_count
    print(f"✔ {n} produtos de demonstração removidos. Categorias mantidas.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clear-demo", action="store_true")
    args = ap.parse_args()
    try:
        clear_demo() if args.clear_demo else seed()
    except Exception as e:  # noqa: BLE001
        print(f"✖ Erro: {e}\nVerifique MONGODB_URI no arquivo .env e o acesso de rede no Atlas.", file=sys.stderr)
        sys.exit(1)
