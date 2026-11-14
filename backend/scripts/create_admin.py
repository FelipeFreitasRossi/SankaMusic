"""Cria (ou promove) um usuário administrador.

Uso (na pasta backend, com o venv ativo):
    python -m scripts.create_admin --email admin@seudominio.com.br --name "Administrador"
A senha é solicitada de forma oculta no terminal (não fica no histórico).
"""
import argparse
import getpass
import sys

from app.core.database import ensure_indexes, get_db
from app.core.security import hash_password
from app.models.collections import Collections as C
from app.schemas.user import validate_password_strength
from app.utils.mongo import now_utc


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    ap.add_argument("--name", default="Administrador")
    args = ap.parse_args()
    email = args.email.strip().lower()

    db = get_db()
    ensure_indexes(db)
    existing = db[C.USERS].find_one({"email": email})
    if existing:
        db[C.USERS].update_one({"_id": existing["_id"]}, {"$set": {"role": "admin", "active": True, "updated_at": now_utc()}})
        print(f"✔ Usuário {email} promovido a administrador.")
        return

    pw = getpass.getpass("Senha do administrador (mín. 8, letras e números): ")
    try:
        validate_password_strength(pw)
    except ValueError as e:
        print(f"✖ {e}", file=sys.stderr)
        sys.exit(1)
    if pw != getpass.getpass("Confirme a senha: "):
        print("✖ As senhas não conferem.", file=sys.stderr)
        sys.exit(1)

    now = now_utc()
    db[C.USERS].insert_one({
        "name": args.name, "email": email, "password_hash": hash_password(pw), "phone": None, "cpf": None,
        "role": "admin", "active": True, "created_at": now, "updated_at": now,
    })
    print(f"✔ Administrador {email} criado. Acesse /admin no site.")


if __name__ == "__main__":
    main()
