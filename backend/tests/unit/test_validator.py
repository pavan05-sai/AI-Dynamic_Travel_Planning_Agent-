import pytest
from app.models.entities import Place
from app.schemas.itinerary import (
    AccommodationBlock, BudgetBlock, CanonicalItinerary, DestinationRef, ItineraryDay,
    ItineraryItem, ItemCost, TripInfo, Travelers
)
from app.schemas.preferences import PreferencesSchema
from app.workers.validator import ItineraryValidator


@pytest.fixture
def mock_places():
    return {
        "p1": Place(id="p1", destination_id="dest_goa", kind="attraction", name="Fort Aguada", category="heritage", lat=15.5, lng=73.8, cost_amount=50, open_from="09:00", open_to="18:00", closed_days=["Monday"], indoor=False, tags=["heritage"]),
        "p2": Place(id="p2", destination_id="dest_goa", kind="attraction", name="Goa Museum", category="museum", lat=15.5, lng=73.8, cost_amount=20, open_from="09:30", open_to="17:30", closed_days=[], indoor=True, tags=["museum", "art"]),
        "r1": Place(id="r1", destination_id="dest_goa", kind="restaurant", name="Seafood Shack", category="restaurant", lat=15.5, lng=73.8, cost_amount=400, open_from="11:00", open_to="23:00", closed_days=[], indoor=False, tags=["seafood"]),
        "h1": Place(id="h1", destination_id="dest_goa", kind="hotel", name="Candolim Hotel", category="hotel", lat=15.5, lng=73.8, cost_amount=3000, open_from="00:00", open_to="23:59", closed_days=[], indoor=True)
    }


@pytest.fixture
def valid_itinerary():
    return CanonicalItinerary(
        schema_version="1.0",
        trip_id="1",
        version=1,
        trip=TripInfo(
            title="Goa Trip",
            destination=DestinationRef(name="Goa", catalog_id="dest_goa", lat=15.5, lng=73.8),
            start_date="2026-11-20",  # Friday
            end_date="2026-11-20",
            num_days=1,
            travelers=Travelers(adults=2, children=0)
        ),
        preferences=PreferencesSchema(pace="relaxed", interests=["heritage"]),
        budget=BudgetBlock(total_limit=30000, estimated_total=15000, status="ok"),
        accommodation=AccommodationBlock(place_id="h1", name="Candolim Hotel", nights=1, nightly_cost=3000, check_in="2026-11-20", check_out="2026-11-21"),
        days=[
            ItineraryDay(
                id="day_1",
                day_number=1,
                date="2026-11-20",
                theme="Heritage",
                items=[
                    ItineraryItem(id="it_1", type="activity", place_id="p1", name="Fort Aguada", category="heritage", lat=15.5, lng=73.8, start_time="10:00", end_time="12:00", duration_min=120, reason="Historic fort"),
                    ItineraryItem(id="it_2", type="meal", place_id="r1", name="Seafood Shack", category="restaurant", lat=15.5, lng=73.8, start_time="13:00", end_time="14:15", duration_min=75, reason="Local food")
                ]
            )
        ]
    )


def test_validator_v1_place_not_in_catalog(valid_itinerary, mock_places):
    valid_itinerary.days[0].items[0].place_id = "unknown_place_id"
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V1" in e for e in res.errors)


def test_validator_v2_duplicate_places(valid_itinerary, mock_places):
    # Add duplicate p1 activity on same trip
    dup_item = valid_itinerary.days[0].items[0].model_copy()
    dup_item.id = "it_dup"
    dup_item.start_time = "15:00"
    dup_item.end_time = "17:00"
    valid_itinerary.days[0].items.append(dup_item)

    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V2" in e for e in res.errors)


def test_validator_v3_overlapping_schedules(valid_itinerary, mock_places):
    # Overlap it_1 (10:00-12:00) with it_2 (11:30-13:00)
    valid_itinerary.days[0].items[1].start_time = "11:30"
    valid_itinerary.days[0].items[1].end_time = "13:00"
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V3" in e and "Overlapping" in e for e in res.errors)


def test_validator_v4_closed_days(valid_itinerary, mock_places):
    # Change date to a Monday (e.g. 2026-11-23)
    valid_itinerary.trip.start_date = "2026-11-23"
    valid_itinerary.days[0].date = "2026-11-23"  # Monday
    # p1 is closed on Monday
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V4" in e and "closed" in e for e in res.errors)


def test_validator_v5_pace_cap_exceeded(valid_itinerary, mock_places):
    valid_itinerary.preferences.pace = "relaxed"  # cap is 3
    # Add 4 activities
    valid_itinerary.days[0].items = [
        ItineraryItem(id="it_1", type="activity", place_id="p1", name="Fort", category="heritage", lat=15.5, lng=73.8, start_time="09:30", end_time="11:00", duration_min=90, reason="R1"),
        ItineraryItem(id="it_2", type="activity", place_id="p2", name="Museum", category="museum", lat=15.5, lng=73.8, start_time="11:30", end_time="13:00", duration_min=90, reason="R2"),
        ItineraryItem(id="it_3", type="activity", place_id="p1", name="Fort 2", category="heritage", lat=15.5, lng=73.8, start_time="14:00", end_time="15:30", duration_min=90, reason="R3"),
        ItineraryItem(id="it_4", type="activity", place_id="p2", name="Museum 2", category="museum", lat=15.5, lng=73.8, start_time="16:00", end_time="17:30", duration_min=90, reason="R4"),
    ]
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V5" in e for e in res.errors)


def test_validator_v9_locked_item_modified(valid_itinerary, mock_places):
    prev_it = valid_itinerary.model_copy(deep=True)
    prev_it.days[0].items[0].locked = True

    # Mutate current version by removing or swapping place of locked item
    valid_itinerary.days[0].items[0].place_id = "p2"

    res = ItineraryValidator.validate(valid_itinerary, mock_places, previous_version=prev_it)
    assert not res.is_valid
    assert any("V9" in e and "Locked" in e for e in res.errors)


def test_validator_v10_avoid_preference(valid_itinerary, mock_places):
    valid_itinerary.preferences.avoid = ["museum"]
    # Add museum
    valid_itinerary.days[0].items[0].place_id = "p2"
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V10" in e and "avoid" in e for e in res.errors)


def test_validator_v12_empty_reason(valid_itinerary, mock_places):
    valid_itinerary.days[0].items[0].reason = ""
    res = ItineraryValidator.validate(valid_itinerary, mock_places)
    assert not res.is_valid
    assert any("V12" in e for e in res.errors)
