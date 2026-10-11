from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.notification import NotificationsResponse
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsResponse)
def get_my_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> NotificationsResponse:
    """Return in-app notifications and unread count scoped to current user."""
    return notification_service.get_user_notifications(db, current_user.id)


@router.post("/{notification_id}/read")
def mark_single_notification_read(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> dict[str, bool]:
    """Mark a notification as read."""
    success = notification_service.mark_notification_as_read(db, current_user.id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return {"success": True}


@router.post("/read-all")
def mark_all_notifications_read(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN))],
) -> dict[str, int]:
    """Mark all notifications as read for current user."""
    count = notification_service.mark_all_notifications_as_read(db, current_user.id)
    return {"marked_read": count}
