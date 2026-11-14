"""Limitador de tentativas simples, em memória (sem Redis).

Suficiente para proteger login/recuperação de senha contra força bruta em um
único processo. Em uma VPS com vários workers, cada worker tem seu próprio
contador — para limites globais use o proxy reverso (ex.: nginx limit_req).
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.exceptions import TooManyRequestsError


class RateLimiter:
    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = period_seconds
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > self.period:
                q.popleft()
            if len(q) >= self.max_calls:
                raise TooManyRequestsError("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
            q.append(now)
            if len(self._hits) > 10_000:  # evita crescimento ilimitado
                self._hits.clear()


def client_ip(request: Request) -> str:
    # Não confiamos em X-Forwarded-For enviado pelo cliente (pode ser forjado).
    # Atrás de proxy (nginx), o uvicorn com --proxy-headers já preenche client.host
    # com o IP real; no Passenger/Apache, REMOTE_ADDR já é o IP do visitante.
    return request.client.host if request.client else "unknown"


login_limiter = RateLimiter(max_calls=10, period_seconds=300)
reset_limiter = RateLimiter(max_calls=5, period_seconds=900)
