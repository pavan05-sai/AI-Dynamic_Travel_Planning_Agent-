from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.errors import NotFoundError, UnauthorizedError
from app.core.security import get_current_user_id
from app.models.database import get_db
from app.models.entities import Trip, User
from app.repositories.trips import TripRepository
from app.repositories.users import UserRepository


def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedError("User account not found")
    return user


def get_owned_trip(
    trip_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Trip:
    repo = TripRepository(db)
    trip = repo.get_by_id_and_user(trip_id=trip_id, user_id=user.id)
    if not trip:
        # Return 404 per Section 18 to avoid leaking trip existence
        raise NotFoundError("Trip not found")
    return trip
