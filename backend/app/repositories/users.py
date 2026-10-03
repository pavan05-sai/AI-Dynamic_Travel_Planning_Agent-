from typing import Optional
from sqlalchemy.orm import Session
from app.models.entities import User, UserPreference


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower().strip()).first()

    def create(self, email: str, password_hash: str, display_name: str) -> User:
        user = User(
            email=email.lower().strip(),
            password_hash=password_hash,
            display_name=display_name.strip()
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        # Initialize default preferences
        pref = UserPreference(user_id=user.id)
        self.db.add(pref)
        self.db.commit()
        return user

    def get_preferences(self, user_id: int) -> Optional[UserPreference]:
        return self.db.query(UserPreference).filter(UserPreference.user_id == user_id).first()

    def update_preferences(self, user_id: int, pref_data: dict) -> UserPreference:
        pref = self.get_preferences(user_id)
        if not pref:
            pref = UserPreference(user_id=user_id, **pref_data)
            self.db.add(pref)
        else:
            for k, v in pref_data.items():
                if hasattr(pref, k):
                    setattr(pref, k, v)
        self.db.commit()
        self.db.refresh(pref)
        return pref
