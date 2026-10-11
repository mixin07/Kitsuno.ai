import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.STUDENT
    avatar_url: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    avatar_url: str | None = Field(default=None, max_length=500)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    auth_user_id: uuid.UUID | None = None
    name: str
    email: EmailStr
    role: str
    approval_status: str = "APPROVED"
    requested_role: str | None = None
    approved_at: datetime | None = None
    approved_by: int | None = None
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime


class InstructorRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    requested_role: str | None = None
    approval_status: str
    created_at: datetime
    approved_at: datetime | None = None
    approved_by: int | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str