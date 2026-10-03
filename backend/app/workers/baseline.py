from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from app.models.entities import Place
from app.schemas.itinerary import (
    AccommodationBlock, BookingRef, CanonicalItinerary, DestinationRef, ItineraryDay,
    ProvenanceBlock, TripInfo, Travelers, DayWeather
)
from app.schemas.preferences import PreferencesSchema
from app.workers.budget import BudgetEngine
from app.workers.candidates import CandidateRetriever
from app.workers.optimizer import ScheduleOptimizer


class BaselinePlanner:
    THEMES = [
        "Heritage & Cultural Highlights",
        "Coastal Vistas & Local Cuisine",
        "Art, Markets & Sunset Horizons",
        "Nature Trails & Architectural Wonders",
        "Scenic Exploration & Culinary Delights",
        "Leisure, Cafes & Relaxation",
        "Historic Forts & Waterfront Promenade"
    ]

    @classmethod
    def generate_itinerary(
        cls,
        trip_id: str,
        title: str,
        destination: DestinationRef,
        start_date: str,
        end_date: str,
        num_days: int,
        travelers: Travelers,
        budget: int,
        preferences: PreferencesSchema,
        catalog_places: List[Place],
        weather_forecasts: Optional[List[DayWeather]] = None,
        created_by: str = "baseline_planner",
        mode: str = "live"
    ) -> CanonicalItinerary:
        # 1. Classify catalog
        hotels = [p for p in catalog_places if p.kind == "hotel"]
        attractions = [p for p in catalog_places if p.kind == "attraction"]
        restaurants = [p for p in catalog_places if p.kind == "restaurant"]

        # Score candidates
        scored_hotels = CandidateRetriever.retrieve(hotels, kind="hotel", preferences=preferences, limit=10)
        scored_attractions = CandidateRetriever.retrieve(attractions, kind="attraction", preferences=preferences, limit=50)
        scored_restaurants = CandidateRetriever.retrieve(restaurants, kind="restaurant", preferences=preferences, limit=30)

        # Place lookup map
        place_by_id = {p.id: p for p in catalog_places}

        # 2. Select Hotel
        selected_hotel_place = None
        if scored_hotels:
            selected_hotel_place = place_by_id.get(scored_hotels[0].id)
        if not selected_hotel_place and hotels:
            selected_hotel_place = hotels[0]

        hotel_id = selected_hotel_place.id if selected_hotel_place else "default_hotel"
        hotel_name = selected_hotel_place.name if selected_hotel_place else "Central Hotel"
        hotel_cost = selected_hotel_place.cost_amount if selected_hotel_place else 2500

        rooms = BudgetEngine.calculate_rooms(travelers.adults, travelers.children)
        nights = max(1, num_days - 1)

        accommodation_block = AccommodationBlock(
            place_id=hotel_id,
            name=hotel_name,
            nights=nights,
            rooms=rooms,
            nightly_cost=hotel_cost,
            check_in=start_date,
            check_out=end_date,
            booking=BookingRef(url=selected_hotel_place.booking_url) if selected_hotel_place and selected_hotel_place.booking_url else BookingRef(),
            reason=f"Selected for comfort, high rating ({selected_hotel_place.rating if selected_hotel_place else 4.5}★), and convenient central location."
        )

        # Collect sorted attraction places
        ranked_attractions: List[Place] = []
        for s_act in scored_attractions:
            p = place_by_id.get(s_act.id)
            if p:
                ranked_attractions.append(p)

        ranked_restaurants: List[Place] = []
        for s_res in scored_restaurants:
            p = place_by_id.get(s_res.id)
            if p:
                ranked_restaurants.append(p)

        # 3. Determine items per day based on pace and catalog availability
        pace = preferences.pace.lower()
        pace_cap = 2 if pace == "relaxed" else (3 if pace == "balanced" else 4)
        items_per_day = min(pace_cap, max(1, len(ranked_attractions) // num_days)) if ranked_attractions else 1

        # 4. Build Days
        days: List[ItineraryDay] = []
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")

        used_place_ids = set()
        restaurant_idx = 0

        for d_num in range(1, num_days + 1):
            cur_dt = start_dt + timedelta(days=d_num - 1)
            cur_date = cur_dt.strftime("%Y-%m-%d")
            day_of_week = cur_dt.strftime("%A")
            theme = cls.THEMES[(d_num - 1) % len(cls.THEMES)]

            # Pick attractions for the day respecting closed_days and avoiding duplicates
            day_acts: List[Place] = []
            for candidate in ranked_attractions:
                if len(day_acts) >= items_per_day:
                    break
                if candidate.id in used_place_ids:
                    continue
                if day_of_week and candidate.closed_days and day_of_week in candidate.closed_days:
                    continue
                day_acts.append(candidate)
                used_place_ids.add(candidate.id)

            # Pick lunch and dinner
            day_rests: List[Place] = []
            open_rests = [r for r in ranked_restaurants if not (day_of_week and r.closed_days and day_of_week in r.closed_days)]
            if open_rests:
                day_rests.append(open_rests[restaurant_idx % len(open_rests)])
                restaurant_idx += 1
                if len(open_rests) > 1:
                    day_rests.append(open_rests[restaurant_idx % len(open_rests)])
                    restaurant_idx += 1

            # Prepare reasons map
            reasons = {}
            factors = {}
            for act in day_acts:
                reasons[act.id] = f"Top-rated {act.category} matching your {preferences.interests[0] if preferences.interests else 'travel'} interest."
                factors[act.id] = [f"interest:{act.category}", f"rating:{act.rating}"]

            for rest in day_rests:
                reasons[rest.id] = f"Popular dining spot featuring authentic {rest.category} cuisine."
                factors[rest.id] = ["meal:dining", f"rating:{rest.rating}"]

            # Optimize schedule
            day_obj = ScheduleOptimizer.optimize_day_schedule(
                day_number=d_num,
                date_str=cur_date,
                theme=theme,
                activities=day_acts,
                restaurants=day_rests,
                hotel=selected_hotel_place,
                reasons_map=reasons,
                factors_map=factors
            )

            # Attach weather forecast if available
            if weather_forecasts and d_num - 1 < len(weather_forecasts):
                day_obj.weather = weather_forecasts[d_num - 1]
            else:
                day_obj.weather = DayWeather(
                    summary="Sunny with clear skies",
                    temp_max_c=31.0,
                    rain_prob_pct=10,
                    source="demo",
                    as_of=datetime.now(timezone.utc).isoformat()
                )

            days.append(day_obj)

        # 5. Compute Budget
        budget_block = BudgetEngine.calculate_budget(
            days=days,
            accommodation=accommodation_block,
            travelers=travelers,
            total_limit=budget,
            preferences=preferences
        )

        # 6. Build trip info
        trip_info = TripInfo(
            title=title,
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            num_days=num_days,
            travelers=travelers,
            currency="INR"
        )

        provenance = ProvenanceBlock(
            weather="demo" if not weather_forecasts else weather_forecasts[0].source,
            routing="estimated",
            places="catalog",
            llm="baseline",
            overall="demo" if mode != "live" else "live_with_fallbacks"
        )

        return CanonicalItinerary(
            schema_version="1.0",
            trip_id=str(trip_id),
            version=1,
            parent_version=None,
            created_by=created_by,
            change_summary="Initial personalized itinerary generated via baseline planner",
            mode=mode,
            trip=trip_info,
            preferences=preferences,
            budget=budget_block,
            accommodation=accommodation_block,
            days=days,
            alternatives=[],
            events=[],
            notes=[],
            provenance=provenance,
            warnings=[]
        )
