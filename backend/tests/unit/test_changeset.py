import pytest
from app.core.errors import ValidationError
from app.models.entities import Place
from app.schemas.changeset import ChangeOp, ChangeSet, OpType
from app.schemas.itinerary import (
    AccommodationBlock, BudgetBlock, CanonicalItinerary, DestinationRef, ItineraryDay,
    ItineraryItem, TripInfo, Travelers
)
from app.schemas.preferences import PreferencesSchema
from app.workers.changeset import ChangeSetApplier


@pytest.fixture
def test_setup():
    places = {
        "p1": Place(id="p1", destination_id="dest_goa", kind="attraction", name="Fort Aguada", category="heritage", lat=15.5, lng=73.8, cost_amount=50),
        "p2": Place(id="p2", destination_id="dest_goa", kind="attraction", name="Goa Museum", category="museum", lat=15.5, lng=73.8, cost_amount=20, indoor=True),
        "h1": Place(id="h1", destination_id="dest_goa", kind="hotel", name="Hotel Candolim", category="hotel", lat=15.5, lng=73.8, cost_amount=3000),
        "h2": Place(id="h2", destination_id="dest_goa", kind="hotel", name="Taj Resort", category="hotel", lat=15.5, lng=73.8, cost_amount=8000)
    }

    itinerary = CanonicalItinerary(
        schema_version="1.0",
        trip_id="1",
        version=1,
        trip=TripInfo(
            title="Goa Trip",
            destination=DestinationRef(name="Goa", catalog_id="dest_goa", lat=15.5, lng=73.8),
            start_date="2026-11-20",
            end_date="2026-11-21",
            num_days=2,
            travelers=Travelers(adults=2, children=0)
        ),
        preferences=PreferencesSchema(pace="relaxed", interests=["heritage"]),
        budget=BudgetBlock(total_limit=30000, estimated_total=15000, status="ok"),
        accommodation=AccommodationBlock(place_id="h1", name="Hotel Candolim", nights=2, nightly_cost=3000, check_in="2026-11-20", check_out="2026-11-22"),
        days=[
            ItineraryDay(
                id="day_1",
                day_number=1,
                date="2026-11-20",
                theme="Heritage",
                items=[
                    ItineraryItem(id="it_1", type="activity", place_id="p1", name="Fort Aguada", category="heritage", lat=15.5, lng=73.8, start_time="10:00", end_time="12:00", duration_min=120, reason="Fort", locked=False)
                ]
            ),
            ItineraryDay(
                id="day_2",
                day_number=2,
                date="2026-11-21",
                theme="Museums",
                items=[
                    ItineraryItem(id="it_2", type="activity", place_id="p2", name="Goa Museum", category="museum", lat=15.5, lng=73.8, start_time="10:00", end_time="11:30", duration_min=90, reason="Museum", locked=True)
                ]
            )
        ]
    )
    return places, itinerary


def test_changeset_replace_item(test_setup):
    places, itinerary = test_setup
    cs = ChangeSet(
        ops=[ChangeOp(op=OpType.REPLACE_ITEM, item_id="it_1", new_place_id="p2")]
    )
    new_it, affected = ChangeSetApplier.apply_changeset(itinerary, cs, places)
    assert 1 in affected
    assert new_it.days[0].items[0].place_id == "p2"
    assert new_it.days[0].items[0].name == "Goa Museum"


def test_changeset_locked_item_protection(test_setup):
    places, itinerary = test_setup
    # it_2 is locked
    cs = ChangeSet(
        ops=[ChangeOp(op=OpType.REMOVE_ITEM, item_id="it_2")]
    )
    with pytest.raises(ValidationError) as exc:
        ChangeSetApplier.apply_changeset(itinerary, cs, places)
    assert "locked" in str(exc.value).lower()


def test_changeset_add_and_move_item(test_setup):
    places, itinerary = test_setup
    cs = ChangeSet(
        ops=[
            ChangeOp(op=OpType.ADD_ITEM, day_id="day_1", place_id="p2"),
            ChangeOp(op=OpType.MOVE_ITEM, item_id="it_1", to_day_id="day_2")
        ]
    )
    new_it, affected = ChangeSetApplier.apply_changeset(itinerary, cs, places)
    assert 1 in affected and 2 in affected
    # Day 1 now has newly added item, it_1 moved to Day 2
    assert len(new_it.days[0].items) == 1
    assert len(new_it.days[1].items) == 2


def test_changeset_max_ops_limit(test_setup):
    places, itinerary = test_setup
    # 9 ops exceeds MAX_OPS (8)
    cs = ChangeSet(
        ops=[ChangeOp(op=OpType.SET_BUDGET, total_limit=20000) for _ in range(9)]
    )
    with pytest.raises(ValidationError):
        ChangeSetApplier.apply_changeset(itinerary, cs, places)
