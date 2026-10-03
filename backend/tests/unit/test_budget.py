import pytest
from app.schemas.itinerary import AccommodationBlock, ItineraryDay, ItineraryItem, ItemCost, RouteLeg, Travelers
from app.schemas.preferences import PreferencesSchema
from app.workers.budget import BudgetEngine, round_up_10


def test_round_up_10():
    assert round_up_10(12.3) == 20
    assert round_up_10(20.0) == 20
    assert round_up_10(0) == 0
    assert round_up_10(1) == 10
    assert round_up_10(95) == 100


def test_rooms_calculation():
    # 2 adults, 0 children -> 1 room
    assert BudgetEngine.calculate_rooms(adults=2, children=0) == 1
    # 3 adults, 0 children -> 2 rooms
    assert BudgetEngine.calculate_rooms(adults=3, children=0) == 2
    # 4 adults, 0 children -> 2 rooms
    assert BudgetEngine.calculate_rooms(adults=4, children=0) == 2
    # 2 adults, 3 children -> 1 + 1 = 2 rooms
    assert BudgetEngine.calculate_rooms(adults=2, children=3) == 2
    # 2 adults, 5 children -> 1 + 2 = 3 rooms
    assert BudgetEngine.calculate_rooms(adults=2, children=5) == 3


def test_budget_engine_breakdown_and_status():
    acc = AccommodationBlock(
        place_id="hotel_1",
        name="Test Hotel",
        nights=3,
        rooms=1,
        nightly_cost=3000,
        check_in="2026-11-20",
        check_out="2026-11-23"
    )

    day1 = ItineraryDay(
        id="day_1",
        day_number=1,
        date="2026-11-20",
        theme="Sightseeing",
        items=[
            ItineraryItem(
                id="it_1",
                type="activity",
                place_id="p1",
                name="Fort",
                category="heritage",
                lat=15.5,
                lng=73.8,
                start_time="10:00",
                end_time="11:30",
                duration_min=90,
                cost=ItemCost(amount=100, per="person"),
                reason="Historic"
            ),
            ItineraryItem(
                id="it_2",
                type="meal",
                place_id="r1",
                name="Seafood Place",
                category="restaurant",
                lat=15.5,
                lng=73.8,
                start_time="13:00",
                end_time="14:15",
                duration_min=75,
                cost=ItemCost(amount=400, per="person"),
                reason="Local lunch"
            )
        ],
        routes=[
            RouteLeg(
                id="r_1",
                from_item="it_1",
                to_item="it_2",
                distance_km=10.0,
                duration_min=20,
                cost=250
            )
        ]
    )

    travelers = Travelers(adults=2, children=0)
    preferences = PreferencesSchema(budget_level="mid", transport_modes=["taxi"])

    # 1. Test OK status (Limit = 35,000)
    b_ok = BudgetEngine.calculate_budget(
        days=[day1],
        accommodation=acc,
        travelers=travelers,
        total_limit=35000,
        preferences=preferences,
        reserve_pct=10
    )

    assert b_ok.breakdown.accommodation == 9000  # 3000 * 3 nights * 1 room
    assert b_ok.breakdown.activities == 200     # 100 * 2 people
    # Food: meal 1 (400 * 2 = 800) + 1 unplanned dinner (600 * 2 = 1200) = 2000
    assert b_ok.breakdown.food == 2000
    assert b_ok.breakdown.transport >= 250
    assert b_ok.breakdown.reserve == 3500       # 10% of 35000
    assert b_ok.status == "ok"
    assert b_ok.remaining >= 0

    # 2. Test TIGHT status
    # Set limit right around estimated total
    est = b_ok.estimated_total
    b_tight = BudgetEngine.calculate_budget(
        days=[day1],
        accommodation=acc,
        travelers=travelers,
        total_limit=est + 500,  # estimated > spendable (limit - 10%), but <= limit
        preferences=preferences,
        reserve_pct=10
    )
    assert b_tight.status == "tight"

    # 3. Test OVER status
    b_over = BudgetEngine.calculate_budget(
        days=[day1],
        accommodation=acc,
        travelers=travelers,
        total_limit=est - 1000,
        preferences=preferences,
        reserve_pct=10
    )
    assert b_over.status == "over"
    assert b_over.remaining < 0


def test_min_feasible_cost():
    travelers = Travelers(adults=2, children=0)
    cost = BudgetEngine.min_feasible_cost(num_days=4, travelers=travelers, cheapest_hotel_rate=1500)
    # 3 nights * 1500 = 4500 acc
    # 4 days * 2 meals * 250 * 2 people = 4000 food
    # 4 days * 150 min transport = 600 transport
    # subtotal = 9100 + 8% misc (728) -> ~9830 rounded up
    assert cost > 8000
    assert cost <= 12000
