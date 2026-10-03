from typing import Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    trip_id: Optional[int] = None
    type: str
    title: str
    body: str
    severity: str
    read: bool
    created_at: str
    due_at: Optional[str] = None
