"""Cálculo de frete.

ATENÇÃO: esta é uma TABELA DE DEMONSTRAÇÃO baseada na região do CEP
(primeiro dígito). Ela existe para o checkout funcionar de ponta a ponta,
mas os valores NÃO são condições comerciais da loja.

Para produção, implemente um `ShippingProvider` real (Correios, Melhor Envio,
Frenet etc.) e registre-o em `get_shipping_provider()`. A interface já está
pronta: `quote(cep, subtotal, items_count) -> list[dict]`.
"""
from typing import Protocol

from app.core.config import settings
from app.core.exceptions import AppError
from app.services.pricing import money

# Região pelo 1º dígito do CEP -> (fator de preço, dias adicionais)
_REGION = {
    "0": (1.0, 0), "1": (1.0, 0),            # SP
    "2": (1.15, 1),                          # RJ / ES
    "3": (1.2, 1),                           # MG
    "4": (1.45, 3),                          # BA / SE
    "5": (1.55, 4),                          # PE / AL / PB / RN
    "6": (1.75, 6),                          # CE / PI / MA / PA / AP / AM / RR / AC
    "7": (1.4, 3),                           # DF / GO / TO / MT / MS / RO
    "8": (1.25, 2),                          # PR / SC
    "9": (1.3, 2),                           # RS
}


class ShippingProvider(Protocol):
    def quote(self, cep: str, subtotal: float, items_count: int) -> list[dict]: ...


class DemoTableShipping:
    name = "demo-table"

    def quote(self, cep: str, subtotal: float, items_count: int) -> list[dict]:
        if len(cep) != 8 or not cep.isdigit():
            raise AppError("CEP inválido.", code="invalid_cep")
        factor, extra_days = _REGION.get(cep[0], (1.5, 4))
        extra_items = max(0, items_count - 1)
        standard = money((29.9 + extra_items * 6) * factor)
        express = money((54.9 + extra_items * 9) * factor)
        free = settings.FREE_SHIPPING_THRESHOLD > 0 and subtotal >= settings.FREE_SHIPPING_THRESHOLD
        options = [
            {"code": "standard", "name": "Entrega padrão", "price": 0.0 if free else standard,
             "days": 6 + extra_days, "description": "Estimativa (tabela de demonstração)"},
            {"code": "express", "name": "Entrega expressa", "price": express,
             "days": 2 + max(0, extra_days - 1), "description": "Estimativa (tabela de demonstração)"},
            {"code": "pickup", "name": "Retirar na loja", "price": 0.0, "days": 1,
             "description": "Disponível após a confirmação do pagamento"},
        ]
        return options


def get_shipping_provider() -> ShippingProvider:
    return DemoTableShipping()


def find_option(cep: str, subtotal: float, items_count: int, code: str) -> dict:
    for opt in get_shipping_provider().quote(cep, subtotal, items_count):
        if opt["code"] == code:
            return opt
    raise AppError("Opção de frete inválida.", code="invalid_shipping")
