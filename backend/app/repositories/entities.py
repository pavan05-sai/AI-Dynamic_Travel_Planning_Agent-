from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Expense, Notification, TripShare, TravelEvent, ChatMessage, ApiCache


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, trip_id: int, category: str, amount: int, day_id: Optional[str] = None, note: Optional[str] = None) -> Expense:
        expense = Expense(
            trip_id=trip_id,
            category=category,
            amount=amount,
            day_id=day_id,
            note=note
        )
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def list_by_trip(self, trip_id: int) -> List[Expense]:
        return self.db.query(Expense).filter(Expense.trip_id == trip_id).order_by(Expense.spent_at.desc()).all()


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, type: str, title: str, body: str, severity: str = "info", trip_id: Optional[int] = None) -> Notification:
        # Check dedupe: same trip_id, type, and title within past 1 hour
        now = datetime.now(timezone.utc)
        recent = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.trip_id == trip_id,
            Notification.type == type,
            Notification.title == title
        ).first()
        if recent:
            return recent

        noti = Notification(
            user_id=user_id,
            trip_id=trip_id,
            type=type,
            title=title,
            body=body,
            severity=severity,
            read=False
        )
        self.db.add(noti)
        self.db.commit()
        self.db.refresh(noti)
        return noti

    def list_by_user(self, user_id: int, unread_only: bool = False) -> List[Notification]:
        q = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            q = q.filter(Notification.read == False)
        return q.order_by(Notification.created_at.desc()).all()

    def mark_read(self, notification_id: int, user_id: int) -> bool:
        noti = self.db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
        if noti:
            noti.read = True
            self.db.commit()
            return True
        return False


class ShareRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, trip_id: int, token: str, expires_at: Optional[datetime] = None, version_pinned: Optional[int] = None) -> TripShare:
        share = TripShare(
            trip_id=trip_id,
            token=token,
            expires_at=expires_at,
            version_pinned=version_pinned,
            revoked=False
        )
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        return share

    def get_by_token(self, token: str) -> Optional[TripShare]:
        return self.db.query(TripShare).filter(TripShare.token == token, TripShare.revoked == False).first()

    def revoke_by_trip(self, trip_id: int):
        shares = self.db.query(TripShare).filter(TripShare.trip_id == trip_id).all()
        for s in shares:
            s.revoked = True
        self.db.commit()


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, trip_id: int, type: str, day_id: Optional[str], severity: str, payload: dict, source: str = "simulated") -> TravelEvent:
        event = TravelEvent(
            trip_id=trip_id,
            type=type,
            day_id=day_id,
            severity=severity,
            payload=payload,
            source=source
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def list_by_trip(self, trip_id: int) -> List[TravelEvent]:
        return self.db.query(TravelEvent).filter(TravelEvent.trip_id == trip_id).order_by(TravelEvent.created_at.desc()).all()

    def mark_handled(self, event_id: int, version: int):
        event = self.db.query(TravelEvent).filter(TravelEvent.id == event_id).first()
        if event:
            event.handled_version = version
            self.db.commit()


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_message(
        self,
        trip_id: int,
        role: str,
        content: str,
        intent: Optional[str] = None,
        version_before: Optional[int] = None,
        version_after: Optional[int] = None
    ) -> ChatMessage:
        msg = ChatMessage(
            trip_id=trip_id,
            role=role,
            content=content,
            intent=intent,
            version_before=version_before,
            version_after=version_after
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_history(self, trip_id: int, limit: int = 10) -> List[ChatMessage]:
        return self.db.query(ChatMessage).filter(ChatMessage.trip_id == trip_id).order_by(ChatMessage.created_at.asc()).all()[-limit:]


class CacheRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, key: str) -> Optional[dict]:
        row = self.db.query(ApiCache).filter(ApiCache.key == key).first()
        if not row:
            return None
        now = datetime.now(timezone.utc)
        # Check freshness
        fetched_at = row.fetched_at.replace(tzinfo=timezone.utc) if row.fetched_at.tzinfo is None else row.fetched_at
        age_seconds = (now - fetched_at).total_seconds()
        is_stale = age_seconds > row.ttl_seconds
        return {
            "value": row.value_json,
            "stale": is_stale,
            "age_seconds": age_seconds,
            "fetched_at": fetched_at.isoformat()
        }

    def set(self, key: str, provider: str, value_json: Any, ttl_seconds: int = 86400):
        row = self.db.query(ApiCache).filter(ApiCache.key == key).first()
        if row:
            row.value_json = value_json
            row.fetched_at = datetime.now(timezone.utc)
            row.ttl_seconds = ttl_seconds
        else:
            row = ApiCache(
                key=key,
                provider=provider,
                value_json=value_json,
                fetched_at=datetime.now(timezone.utc),
                ttl_seconds=ttl_seconds
            )
            self.db.add(row)
        self.db.commit()
