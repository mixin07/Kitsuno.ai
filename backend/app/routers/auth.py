import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_admin,
    require_instructor,
    require_student,
)
from app.core.jwt import create_access_token
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Annotated[Session, Depends(get_db)]) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user


ALLOWED_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB


@router.patch("/profile", response_model=UserResponse)
@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if payload.name is not None and payload.name.strip():
        current_user.name = payload.name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() if payload.avatar_url.strip() else None
    if payload.password is not None and len(payload.password) >= 8:
        current_user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/avatar/upload", response_model=UserResponse)
async def upload_avatar(
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.",
        )

    data = await file.read()
    if len(data) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file size exceeds the 5MB limit.",
        )
    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    ext = ALLOWED_IMAGE_TYPES[content_type]
    unique_name = f"avatar_{current_user.id}_{int(datetime.now(timezone.utc).timestamp())}_{uuid.uuid4().hex[:8]}{ext}"

    uploads_dir = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    file_path = uploads_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(data)

    current_user.avatar_url = f"/uploads/avatars/{unique_name}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/test/student", response_model=UserResponse)
def test_student(current_user: Annotated[User, Depends(require_student)]) -> User:
    return current_user


@router.get("/test/instructor", response_model=UserResponse)
def test_instructor(current_user: Annotated[User, Depends(require_instructor)]) -> User:
    return current_user


@router.get("/test/admin", response_model=UserResponse)
def test_admin(current_user: Annotated[User, Depends(require_admin)]) -> User:
    return current_user