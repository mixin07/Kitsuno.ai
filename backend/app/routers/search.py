from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import User
from app.schemas.search import SearchResponse
from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def search_library(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
    q: str = Query(..., min_length=1, max_length=200, description="Natural language search query"),
) -> SearchResponse:
    """Natural-language search across courses, modules, lessons, and quizzes."""
    return search_service.search_learning_content(db, q)
