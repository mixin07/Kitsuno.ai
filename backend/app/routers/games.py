from __future__ import annotations

from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.game import (
    GameCompleteRequest,
    GameCompleteResponse,
    GameDetailResponse,
    GameHistoryItem,
    GameListItem,
    GameStartRequest,
    GameStatsResponse,
)
from app.services import game_service

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameListItem])
def list_games(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> list[GameListItem]:
    """Retrieve all Play & Learn games with the student's high scores and play statistics."""
    return game_service.get_games_list(db, current_user.id)


@router.get("/stats", response_model=GameStatsResponse)
def get_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> GameStatsResponse:
    """Retrieve aggregate statistics across all games played by the current user."""
    return game_service.get_game_stats(db, current_user.id)


@router.get("/history", response_model=list[GameHistoryItem])
def get_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> list[GameHistoryItem]:
    """Retrieve user's recent completed study game attempts."""
    return game_service.get_game_history(db, current_user.id, limit=limit)


@router.post("/{game_id}/start", response_model=GameDetailResponse)
def start_game(
    game_id: str,
    payload: GameStartRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> GameDetailResponse:
    """
    Initialize a verified game session, validating course enrollment if course_id is specified.
    Returns session token and course-aware question/content pool.
    """
    return game_service.start_game_session(db, current_user.id, game_id, payload)


@router.get("/{game_id}", response_model=GameDetailResponse)
def get_game(
    game_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> GameDetailResponse:
    """Retrieve game configuration, contents, and an idempotent session token."""
    return game_service.get_game_detail(db, current_user.id, game_id)


@router.post("/{game_id}/complete", response_model=GameCompleteResponse)
def complete_game(
    game_id: str,
    payload: GameCompleteRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> GameCompleteResponse:
    """
    Submit completed game results, perform server-side validation, and award idempotent XP.
    Course and lesson progress are strictly preserved and untouched.
    """
    return game_service.complete_game(db, current_user.id, game_id, payload)
