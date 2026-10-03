from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_owned_trip
from app.core.errors import BudgetInvalidError, DestinationUnsupportedError
from app.models.database import get_db
from app.models.entities import Trip, User
from app.repositories.trips import TripRepository
from app.repositories.versions import VersionRepository
from app.schemas.common import success_response
from app.schemas.itinerary import CanonicalItinerary
from app.schemas.trips import TripCreateRequest, TripSummary
from app.services.catalog import CatalogService
from app.workers.budget import BudgetEngine

router = APIRouter(tags=["Trips"])


@router.get("/destinations")
def get_destinations(db: Session = Depends(get_db)):
    """List supported travel destinations."""
    dests = CatalogService.get_destinations(db=db)
    return success_response([d.model_dump() for d in dests])


@router.get("/destinations/search")
def search_destinations(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """Search global destinations using free Nominatim geocoding and presets."""
    dests = CatalogService.search_destinations(db, q)
    return success_response([d.model_dump() for d in dests])


@router.post("/trips", status_code=status.HTTP_201_CREATED)
def create_trip(
    req: TripCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate destination (or dynamically resolve from geocoding)
    dest = CatalogService.get_destination_by_id(req.destination_id, db=db)
    if not dest:
        dest = CatalogService.resolve_and_register_destination(db, req.destination_id)

    if not dest:
        supported = [d.id for d in CatalogService.get_destinations(db=db)]
        raise DestinationUnsupportedError(
            f"Could not locate destination '{req.destination_id}'. Please enter a valid city or destination name.",
            details={"supported_destinations": supported}
        )

    # 2. Validate dates & duration
    try:
        s_dt = datetime.strptime(req.start_date, "%Y-%m-%d")
        e_dt = datetime.strptime(req.end_date, "%Y-%m-%d")
        num_days = (e_dt - s_dt).days + 1
        if num_days < 1 or num_days > 14:
            raise ValueError("Trip duration must be between 1 and 14 days")
    except Exception as e:
        raise DestinationUnsupportedError(f"Invalid date format or duration: {e}")

    # 3. Validate budget feasibility
    min_budget = BudgetEngine.min_feasible_cost(num_days, req.travelers)
    if req.budget < min_budget:
        raise BudgetInvalidError(
            f"Budget of ₹{req.budget:,} is below minimum feasible cost of ₹{min_budget:,} for {num_days} days.",
            details={"min_feasible_cost": min_budget, "provided_budget": req.budget}
        )

    title = req.title or f"{dest.name} {num_days}-Day Trip"
    repo = TripRepository(db)
    trip = repo.create(
        user_id=user.id,
        title=title,
        destination_id=dest.id,
        start_date=req.start_date,
        end_date=req.end_date,
        num_days=num_days,
        budget=req.budget,
        adults=req.travelers.adults,
        children=req.travelers.children,
        mode="live"
    )

    return success_response({
        "trip_id": trip.id,
        "title": trip.title,
        "destination_id": trip.destination_id,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "num_days": trip.num_days,
        "status": trip.status,
        "current_version": trip.current_version,
        "created_at": trip.created_at.isoformat()
    })


@router.get("/trips")
def list_trips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = TripRepository(db)
    version_repo = VersionRepository(db)
    trips = repo.list_by_user(user.id)

    summaries: List[TripSummary] = []
    for t in trips:
        dest = CatalogService.get_destination_by_id(t.destination_id)
        latest_v = version_repo.get_latest(t.id)

        est_total = 0
        tot_budget = 30000
        b_status = "ok"

        if latest_v and latest_v.json:
            b_block = latest_v.json.get("budget", {})
            est_total = b_block.get("estimated_total", 0)
            tot_budget = b_block.get("total_limit", 30000)
            b_status = b_block.get("status", "ok")

        summaries.append(TripSummary(
            id=t.id,
            user_id=t.user_id,
            title=t.title,
            destination_id=t.destination_id,
            destination_name=dest.name if dest else t.destination_id,
            start_date=t.start_date,
            end_date=t.end_date,
            num_days=t.num_days,
            status=t.status,
            current_version=t.current_version,
            mode=t.mode,
            total_budget=tot_budget,
            estimated_total=est_total,
            budget_status=b_status,
            created_at=t.created_at.isoformat()
        ))

    return success_response([s.model_dump() for s in summaries])


@router.get("/trips/{trip_id}")
def get_trip(
    trip: Trip = Depends(get_owned_trip),
    db: Session = Depends(get_db)
):
    version_repo = VersionRepository(db)
    latest_v = version_repo.get_latest(trip.id)
    itinerary_data = latest_v.json if latest_v else None

    dest = CatalogService.get_destination_by_id(trip.destination_id)
    summary = TripSummary(
        id=trip.id,
        user_id=trip.user_id,
        title=trip.title,
        destination_id=trip.destination_id,
        destination_name=dest.name if dest else trip.destination_id,
        start_date=trip.start_date,
        end_date=trip.end_date,
        num_days=trip.num_days,
        status=trip.status,
        current_version=trip.current_version,
        mode=trip.mode,
        total_budget=itinerary_data.get("budget", {}).get("total_limit", 30000) if itinerary_data else 30000,
        estimated_total=itinerary_data.get("budget", {}).get("estimated_total", 0) if itinerary_data else 0,
        budget_status=itinerary_data.get("budget", {}).get("status", "ok") if itinerary_data else "ok",
        created_at=trip.created_at.isoformat()
    )

    return success_response({
        "trip": summary.model_dump(),
        "itinerary": itinerary_data
    })


@router.delete("/trips/{trip_id}")
def delete_trip(
    trip: Trip = Depends(get_owned_trip),
    db: Session = Depends(get_db)
):
    repo = TripRepository(db)
    repo.delete(trip)
    return success_response({"deleted": True, "trip_id": trip.id})
