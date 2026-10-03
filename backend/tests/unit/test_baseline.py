import pytest
from app.models.entities import Place
from app.schemas.itinerary import DestinationRef, Travelers
from app.schemas.preferences import PreferencesSchema
from app.services.catalog import CatalogService
from app.workers.baseline import BaselinePlanner
from app.workers.validator import ItineraryValidator


@pytest.mark.parametrize("dest_id,dest_name", [
    ("dest_goa", "Goa"),
    ("dest_jaipur", "Jaipur"),
    ("dest_hyderabad", "Hyderabad")
])
@pytest.mark.parametrize("pace", ["relaxed", "balanced", "packed"])
@pytest.mark.parametrize("budget_level", ["budget", "mid", "luxury"])
def test_baseline_planner_validity(db_session, dest_id, dest_name, pace, budget_level):
    catalog_places = CatalogService.get_places_for_destination(db_session, dest_id)
    assert len(catalog_places) > 0

    dest_ref = DestinationRef(name=dest_name, catalog_id=dest_id, lat=15.5, lng=73.8)
    travelers = Travelers(adults=2, children=0)
    preferences = PreferencesSchema(
        pace=pace,
        budget_level=budget_level,
        interests=["heritage", "beaches", "food"]
    )

    itinerary = BaselinePlanner.generate_itinerary(
        trip_id="test_trip_1",
        title=f"{dest_name} Test Trip",
        destination=dest_ref,
        start_date="2026-11-20",
        end_date="2026-11-23",
        num_days=4,
        travelers=travelers,
        budget=40000,
        preferences=preferences,
        catalog_places=catalog_places
    )

    place_by_id = {p.id: p for p in catalog_places}
    val_result = ItineraryValidator.validate(itinerary, place_by_id)

    assert val_result.is_valid, f"Validation failed for {dest_name}, {pace}, {budget_level}: {val_result.errors}"
    assert len(itinerary.days) == 4
    assert itinerary.budget.status in ["ok", "tight", "over"]
    assert itinerary.budget.estimated_total > 0
