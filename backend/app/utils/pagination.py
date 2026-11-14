from math import ceil
from typing import Any

from fastapi import Query
from pydantic import BaseModel


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 20

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size


def page_params(
    page: int = Query(1, ge=1, le=10_000, description="Página (inicia em 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página (máx. 100)"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


def paginated(items: list[Any], total: int, params: PageParams, **extra: Any) -> dict[str, Any]:
    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "pages": max(1, ceil(total / params.page_size)) if params.page_size else 1,
        **extra,
    }
