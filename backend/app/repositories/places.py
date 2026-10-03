from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Place


class PlaceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, place_id: str) -> Optional[Place]:
        return self.db.query(Place).filter(Place.id == place_id).first()

    def list_by_destination(
        self,
        destination_id: str,
        kind: Optional[str] = None,
        category: Optional[str] = None,
        indoor: Optional[bool] = None,
        max_cost: Optional[int] = None
    ) -> List[Place]:
        query = self.db.query(Place).filter(Place.destination_id == destination_id)
        if kind:
            query = query.filter(Place.kind == kind)
        if category:
            query = query.filter(Place.category == category)
        if indoor is not None:
            query = query.filter(Place.indoor == indoor)
        if max_cost is not None:
            query = query.filter(Place.cost_amount <= max_cost)
        return query.all()

    def bulk_create_or_update(self, places_data: List[dict]):
        for p_data in places_data:
            existing = self.get_by_id(p_data["id"])
            if existing:
                for k, v in p_data.items():
                    setattr(existing, k, v)
            else:
                self.db.add(Place(**p_data))
        self.db.commit()
