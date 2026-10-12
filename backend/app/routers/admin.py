from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin
from app.models.user import ApprovalStatus, User, UserRole
from app.schemas.user import InstructorRequestResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/instructor-requests", response_model=list[InstructorRequestResponse])
def get_instructor_requests(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[User]:
    """List all instructor requests (pending, approved, rejected)."""
    stmt = (
        select(User)
        .where(
            or_(
                User.requested_role == "INSTRUCTOR",
                User.role == UserRole.INSTRUCTOR,
            )
        )
        .order_by(desc(User.created_at))
    )
    requests = db.scalars(stmt).all()
    return list(requests)


@router.post(
    "/instructor-requests/{user_id}/approve",
    response_model=InstructorRequestResponse,
)
def approve_instructor_request(
    user_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Approve an instructor request: grant INSTRUCTOR role and set approval_status=APPROVED."""
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.role = UserRole.INSTRUCTOR
    user.approval_status = ApprovalStatus.APPROVED.value
    user.approved_at = datetime.now(timezone.utc)
    user.approved_by = current_user.id

    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/instructor-requests/{user_id}/reject",
    response_model=InstructorRequestResponse,
)
def reject_instructor_request(
    user_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Reject an instructor request: keep role=STUDENT and set approval_status=REJECTED."""
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.role = UserRole.STUDENT
    user.approval_status = ApprovalStatus.REJECTED.value
    user.approved_at = datetime.now(timezone.utc)
    user.approved_by = current_user.id

    db.commit()
    db.refresh(user)
    return user
