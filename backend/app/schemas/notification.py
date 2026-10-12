from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationItem(BaseModel):
    id: int
    category: str
    title: str
    message: str
    link_url: str | None = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationsResponse(BaseModel):
    unread_count: int
    items: list[NotificationItem]

    model_config = ConfigDict(from_attributes=True)
