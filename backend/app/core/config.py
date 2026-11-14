"""Configurações centralizadas, lidas de variáveis de ambiente / arquivo .env.

Desenvolvimento e produção são separados pela variável APP_ENV. Em produção
algumas verificações extras são aplicadas (ex.: JWT_SECRET forte, DEBUG off).
"""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  # .../backend


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    APP_ENV: str = "development"
    APP_NAME: str = "Sanka Music API"
    DEBUG: bool = False

    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "sanka_music"

    JWT_SECRET: str = "dev-only-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: str = "http://localhost:5173"
    FRONTEND_URL: str = "http://localhost:5173"
    API_PUBLIC_URL: str = "http://localhost:8000"
    API_PREFIX: str = "/api"

    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "./uploads"
    MEDIA_BASE_URL: str = "http://localhost:8000/media"
    MAX_UPLOAD_MB: int = 5

    MAX_INSTALLMENTS: int = 10
    MIN_INSTALLMENT_VALUE: float = 50.0
    FREE_SHIPPING_THRESHOLD: float = 0.0
    STORE_ORIGIN_CEP: str = "01001000"
    LOW_STOCK_THRESHOLD: int = 5

    MERCADOPAGO_ACCESS_TOKEN: str = ""
    MERCADOPAGO_WEBHOOK_SECRET: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Sanka Music <nao-responda@localhost>"
    SMTP_TLS: bool = True

    LOG_LEVEL: str = "INFO"

    @field_validator("API_PREFIX")
    @classmethod
    def _normalize_prefix(cls, v: str) -> str:
        v = (v or "").strip().rstrip("/")
        if v and not v.startswith("/"):
            v = "/" + v
        return v

    @model_validator(mode="after")
    def _production_checks(self) -> "Settings":
        if self.is_production:
            if len(self.JWT_SECRET) < 32 or "change" in self.JWT_SECRET or "troque" in self.JWT_SECRET:
                raise ValueError("JWT_SECRET fraco ou padrão em produção. Gere um segredo forte.")
            if self.DEBUG:
                raise ValueError("DEBUG deve ser false em produção.")
        return self

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()

    @property
    def payments_enabled(self) -> bool:
        return bool(self.MERCADOPAGO_ACCESS_TOKEN)

    @property
    def email_enabled(self) -> bool:
        return bool(self.SMTP_HOST)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
