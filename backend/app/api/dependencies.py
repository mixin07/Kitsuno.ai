from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.jwt import decode_access_token, verify_supabase_token
from app.database import get_db
from app.models.gamification import UserGamification
from app.models.user import ApprovalStatus, User, UserRole

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    # 1. First attempt full Supabase JWT verification
    payload = verify_supabase_token(token)
    user: User | None = None

    if payload:
        sub_str = str(payload.get("sub", ""))
        email = payload.get("email")
        user_metadata = payload.get("user_metadata") or {}

        try:
            auth_uuid = uuid.UUID(sub_str)
        except (ValueError, TypeError):
            auth_uuid = None

        if auth_uuid:
            # Step A: Resolve by auth_user_id bridge
            user = db.scalar(select(User).where(User.auth_user_id == auth_uuid))

            # Step B: If not linked yet, check by email (e.g. Google OAuth for jeyavelan68@gmail.com)
            if not user and email:
                user = db.scalar(select(User).where(User.email == email))
                if user:
                    user.auth_user_id = auth_uuid
                    # Strictly enforce Admin role if matching designated admin email
                    if email.lower() == settings.admin_email.lower():
                        user.role = UserRole.ADMIN
                        user.approval_status = ApprovalStatus.APPROVED.value
                    try:
                        db.commit()
                        db.refresh(user)
                    except Exception as e:
                        db.rollback()
                        logger.error(f"Error linking auth_user_id to user {user.id}: {e}")

            # Step C: If user doesn't exist in public.users, create application profile safely
            if not user and email:
                is_admin_email = email.lower() == settings.admin_email.lower()
                requested_role_str = str(user_metadata.get("role") or "").upper()

                if is_admin_email:
                    assigned_role = UserRole.ADMIN
                    approval_status = ApprovalStatus.APPROVED.value
                    requested_role = None
                elif requested_role_str == "INSTRUCTOR":
                    # Pending instructor request: do NOT grant instructor role immediately
                    assigned_role = UserRole.STUDENT
                    approval_status = ApprovalStatus.PENDING.value
                    requested_role = "INSTRUCTOR"
                else:
                    # Regular student signup
                    assigned_role = UserRole.STUDENT
                    approval_status = ApprovalStatus.APPROVED.value
                    requested_role = None

                user_name = (
                    user_metadata.get("name")
                    or user_metadata.get("full_name")
                    or email.split("@")[0]
                )
                user = User(
                    name=user_name,
                    email=email,
                    auth_user_id=auth_uuid,
                    password_hash=None,
                    role=assigned_role,
                    approval_status=approval_status,
                    requested_role=requested_role,
                    is_active=True,
                )
                try:
                    db.add(user)
                    db.commit()
                    db.refresh(user)

                    # Initialize gamification profile for new student
                    gamification = UserGamification(user_id=user.id)
                    db.add(gamification)
                    db.commit()
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error creating public.users record for {email}: {e}")
                    raise credentials_exception

    # 2. Backward compatibility fallback for legacy test tokens (integer subject)
    if not user:
        legacy_sub = decode_access_token(token)
        if legacy_sub is not None:
            try:
                legacy_id = int(legacy_sub)
                user = db.scalar(select(User).where(User.id == legacy_id))
            except (ValueError, TypeError):
                user = None

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return user


def require_role(*roles: UserRole):
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        # If the endpoint requires INSTRUCTOR:
        if UserRole.INSTRUCTOR in roles:
            if (
                current_user.requested_role == "INSTRUCTOR"
                and current_user.approval_status == ApprovalStatus.PENDING.value
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Instructor account is pending approval",
                )
            if current_user.approval_status == ApprovalStatus.REJECTED.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Instructor application was rejected",
                )

        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        if current_user.approval_status != ApprovalStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is not approved",
            )

        return current_user

    return role_checker


require_student = require_role(UserRole.STUDENT)
require_instructor = require_role(UserRole.INSTRUCTOR)
require_admin = require_role(UserRole.ADMIN)