from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import ItineraryVersion


class VersionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_version(self, trip_id: int, version: int) -> Optional[ItineraryVersion]:
        return self.db.query(ItineraryVersion).filter(
            ItineraryVersion.trip_id == trip_id,
            ItineraryVersion.version == version
        ).first()

    def get_latest(self, trip_id: int) -> Optional[ItineraryVersion]:
        return self.db.query(ItineraryVersion).filter(
            ItineraryVersion.trip_id == trip_id
        ).order_by(ItineraryVersion.version.desc()).first()

    def list_by_trip(self, trip_id: int) -> List[ItineraryVersion]:
        return self.db.query(ItineraryVersion).filter(
            ItineraryVersion.trip_id == trip_id
        ).order_by(ItineraryVersion.version.asc()).all()

    def create(
        self,
        trip_id: int,
        version: int,
        json_data: Dict[str, Any],
        created_by: str,
        change_summary: str,
        parent_version: Optional[int] = None,
        change_set_json: Optional[Dict[str, Any]] = None
    ) -> ItineraryVersion:
        it_version = ItineraryVersion(
            trip_id=trip_id,
            version=version,
            parent_version=parent_version,
            json=json_data,
            created_by=created_by,
            change_summary=change_summary,
            change_set_json=change_set_json
        )
        self.db.add(it_version)
        self.db.commit()
        self.db.refresh(it_version)
        return it_version
