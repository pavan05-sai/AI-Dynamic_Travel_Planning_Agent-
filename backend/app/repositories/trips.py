from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Trip


class TripRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, trip_id: int) -> Optional[Trip]:
        return self.db.query(Trip).filter(Trip.id == trip_id).first()

    def get_by_id_and_user(self, trip_id: int, user_id: int) -> Optional[Trip]:
        return self.db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()

    def list_by_user(self, user_id: int) -> List[Trip]:
        return self.db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.updated_at.desc()).all()

    def create(
        self,
        user_id: int,
        title: str,
        destination_id: str,
        start_date: str,
        end_date: str,
        num_days: int,
        budget: int = 30000,
        adults: int = 2,
        children: int = 0,
        mode: str = "live"
    ) -> Trip:
        trip = Trip(
            user_id=user_id,
            title=title,
            destination_id=destination_id,
            start_date=start_date,
            end_date=end_date,
            num_days=num_days,
            budget=budget,
            adults=adults,
            children=children,
            mode=mode,
            current_version=0
        )
        self.db.add(trip)
        self.db.commit()
        self.db.refresh(trip)
        return trip

    def update_version_pointer(self, trip_id: int, version: int):
        trip = self.get_by_id(trip_id)
        if trip:
            trip.current_version = version
            self.db.commit()
            self.db.refresh(trip)
        return trip

    def delete(self, trip: Trip):
        self.db.delete(trip)
        self.db.commit()
