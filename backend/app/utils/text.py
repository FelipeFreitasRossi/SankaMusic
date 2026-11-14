import re
import unicodedata


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "item"


def only_digits(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_cpf(cpf: str) -> bool:
    cpf = only_digits(cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for i in (9, 10):
        total = sum(int(cpf[j]) * ((i + 1) - j) for j in range(i))
        digit = (total * 10) % 11
        if digit == 10:
            digit = 0
        if digit != int(cpf[i]):
            return False
    return True


def escape_regex(value: str) -> str:
    return re.escape(value.strip())
