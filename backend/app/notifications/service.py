from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Notification
from app.repositories.entities import NotificationRepository


class NotificationService:
    @classmethod
    def list_notifications(cls, db: Session, user_id: int, unread_only: bool = False) -> List[Notification]:
        repo = NotificationRepository(db)
        return repo.list_by_user(user_id, unread_only)

    @classmethod
    def mark_as_read(cls, db: Session, notification_id: int, user_id: int) -> bool:
        repo = NotificationRepository(db)
        return repo.mark_read(notification_id, user_id)
