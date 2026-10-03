from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Place, Trip
from app.repositories.places import PlaceRepository
from app.repositories.trips import TripRepository
from app.repositories.versions import VersionRepository
from app.schemas.itinerary import CanonicalItinerary
from app.tools.registry import ToolRegistry


class AgentContext:
    def __init__(
        self,
        trip: Trip,
        itinerary: Optional[CanonicalItinerary],
        catalog_places: List[Place],
        tool_registry: ToolRegistry
    ):
        self.trip = trip
        self.itinerary = itinerary
        self.catalog_places = catalog_places
        self.tool_registry = tool_registry


def build_agent_context(db: Session, trip_id: int) -> AgentContext:
    trip_repo = TripRepository(db)
    version_repo = VersionRepository(db)
    place_repo = PlaceRepository(db)

    trip = trip_repo.get_by_id(trip_id)
    if not trip:
        raise ValueError(f"Trip {trip_id} not found")

    catalog_places = place_repo.list_by_destination(trip.destination_id)
    latest_version = version_repo.get_latest(trip_id)

    itinerary: Optional[CanonicalItinerary] = None
    if latest_version and latest_version.json:
        itinerary = CanonicalItinerary(**latest_version.json)

    tool_registry = ToolRegistry(db, itinerary, trip.destination_id)
    return AgentContext(
        trip=trip,
        itinerary=itinerary,
        catalog_places=catalog_places,
        tool_registry=tool_registry
    )
