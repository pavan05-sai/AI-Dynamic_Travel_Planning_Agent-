import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.schemas.itinerary import BudgetBlock, BudgetBreakdown, ItineraryDay, AccommodationBlock, Travelers
from app.schemas.preferences import PreferencesSchema


def round_up_10(amount: float) -> int:
    return int(math.ceil(amount / 10.0) * 10)


class BudgetEngine:
    MEAL_DEFAULTS = {
        "budget": 250,
        "mid": 600,
        "luxury": 1500
    }

    TRANSPORT_RATES = {
        "walk": 0,
        "scooter": 12,
        "auto": 18,
        "taxi": 25,
        "bus": 5
    }

    DAILY_MIN_TRANSPORT = {
        "walk": 0,
        "scooter": 150,
        "auto": 200,
        "taxi": 300,
        "bus": 100
    }

    MISC_PCT = 0.08  # 8%
    DEFAULT_RESERVE_PCT = 10  # 10%

    @classmethod
    def calculate_rooms(cls, adults: int, children: int) -> int:
        adult_rooms = math.ceil(adults / 2.0) if adults > 0 else 1
        child_rooms = math.ceil(children / 4.0) if children > 0 else 0
        return max(1, int(adult_rooms + child_rooms))

    @classmethod
    def calculate_budget(
        cls,
        days: List[ItineraryDay],
        accommodation: AccommodationBlock,
        travelers: Travelers,
        total_limit: int,
        preferences: Optional[PreferencesSchema] = None,
        reserve_pct: int = 10
    ) -> BudgetBlock:
        num_travelers = max(1, travelers.adults + travelers.children)
        nights = max(1, accommodation.nights)
        budget_level = preferences.budget_level if preferences else "mid"
        if budget_level not in cls.MEAL_DEFAULTS:
            budget_level = "mid"

        # 1. Accommodation
        rooms = cls.calculate_rooms(travelers.adults, travelers.children)
        accommodation_cost = round_up_10(accommodation.nightly_cost * nights * rooms)

        # 2. Activities & Food
        activities_cost = 0
        food_cost = 0

        for day in days:
            day_meals_count = 0
            for item in day.items:
                if item.type == "activity":
                    if item.cost.per == "person":
                        activities_cost += item.cost.amount * num_travelers
                    else:
                        activities_cost += item.cost.amount
                elif item.type == "meal":
                    day_meals_count += 1
                    food_cost += item.cost.amount * num_travelers

            # If fewer than 2 meals planned in the day (lunch & dinner), add default budget allowance
            unplanned_meals = max(0, 2 - day_meals_count)
            default_rate = cls.MEAL_DEFAULTS[budget_level]
            food_cost += unplanned_meals * default_rate * num_travelers

        activities_cost = round_up_10(activities_cost)
        food_cost = round_up_10(food_cost)

        # 3. Transport
        transport_cost = 0
        preferred_mode = preferences.transport_modes[0] if preferences and preferences.transport_modes else "taxi"
        rate_per_km = cls.TRANSPORT_RATES.get(preferred_mode, 25)
        min_day_transport = cls.DAILY_MIN_TRANSPORT.get(preferred_mode, 200)

        for day in days:
            day_transport = 0
            if day.routes:
                for leg in day.routes:
                    leg_mode = leg.mode or preferred_mode
                    leg_rate = cls.TRANSPORT_RATES.get(leg_mode, rate_per_km)
                    leg_cost = round_up_10(leg.distance_km * leg_rate)
                    leg.cost = leg_cost
                    day_transport += leg_cost
            day_transport = max(day_transport, min_day_transport)
            transport_cost += day_transport

        transport_cost = round_up_10(transport_cost)

        # 4. Misc & Reserve
        subtotal = accommodation_cost + activities_cost + food_cost + transport_cost
        misc_cost = round_up_10(subtotal * cls.MISC_PCT)
        reserve_cost = round_up_10(total_limit * (reserve_pct / 100.0))

        estimated_total = subtotal + misc_cost
        spendable = total_limit - reserve_cost
        remaining = spendable - estimated_total

        num_days = max(1, len(days))
        per_day = round_up_10(estimated_total / float(num_days))
        per_person = round_up_10(estimated_total / float(num_travelers))

        # Status
        if estimated_total <= spendable:
            status = "ok"
        elif estimated_total <= total_limit:
            status = "tight"
        else:
            status = "over"

        breakdown = BudgetBreakdown(
            accommodation=accommodation_cost,
            transport=transport_cost,
            food=food_cost,
            activities=activities_cost,
            misc=misc_cost,
            reserve=reserve_cost
        )

        return BudgetBlock(
            total_limit=total_limit,
            reserve_pct=reserve_pct,
            breakdown=breakdown,
            estimated_total=estimated_total,
            spendable=spendable,
            remaining=remaining,
            per_day=per_day,
            per_person=per_person,
            status=status,
            computed_at=datetime.now(timezone.utc).isoformat()
        )

    @classmethod
    def min_feasible_cost(cls, num_days: int, travelers: Travelers, cheapest_hotel_rate: int = 1500) -> int:
        num_travelers = max(1, travelers.adults + travelers.children)
        nights = max(1, num_days - 1)
        rooms = cls.calculate_rooms(travelers.adults, travelers.children)

        # Cheapest accommodation
        acc = cheapest_hotel_rate * nights * rooms
        # Budget meals (2 meals/day * 250)
        food = num_days * 2 * cls.MEAL_DEFAULTS["budget"] * num_travelers
        # Min transport
        transport = num_days * cls.DAILY_MIN_TRANSPORT["scooter"]
        # Free activities = 0
        subtotal = acc + food + transport
        misc = subtotal * cls.MISC_PCT
        return round_up_10(subtotal + misc)
