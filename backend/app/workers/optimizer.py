import math
from typing import Dict, List, Optional, Tuple
from app.models.entities import Place
from app.schemas.itinerary import (
    BookingRef, ItineraryDay, ItineraryItem, ItemCost, RouteLeg, DayTotals
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def format_minutes_to_time(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


class ScheduleOptimizer:
    DAY_START = 9 * 60 + 30  # 09:30
    LUNCH_TIME = 13 * 60     # 13:00
    DINNER_TIME = 19 * 60 + 30  # 19:30
    TRANSIT_BUFFER = 30     # 30 minutes transit buffer between stops

    @classmethod
    def order_stops_nearest_neighbor(cls, places: List[Place], start_lat: float, start_lng: float) -> List[Place]:
        if not places:
            return []
        unvisited = places.copy()
        ordered = []
        cur_lat, cur_lng = start_lat, start_lng

        while unvisited:
            best_idx = 0
            best_dist = float("inf")
            for i, p in enumerate(unvisited):
                dist = haversine_km(cur_lat, cur_lng, p.lat, p.lng)
                if dist < best_dist:
                    best_dist = dist
                    best_idx = i
            next_place = unvisited.pop(best_idx)
            ordered.append(next_place)
            cur_lat, cur_lng = next_place.lat, next_place.lng

        return ordered

    @classmethod
    def optimize_day_schedule(
        cls,
        day_number: int,
        date_str: str,
        theme: str,
        activities: List[Place],
        restaurants: List[Place],
        hotel: Optional[Place],
        reasons_map: Optional[Dict[str, str]] = None,
        factors_map: Optional[Dict[str, List[str]]] = None
    ) -> ItineraryDay:
        reasons = reasons_map or {}
        factors = factors_map or {}

        hotel_lat = hotel.lat if hotel else (activities[0].lat if activities else 15.49)
        hotel_lng = hotel.lng if hotel else (activities[0].lng if activities else 73.82)

        # Order activities geographically starting from hotel
        ordered_activities = cls.order_stops_nearest_neighbor(activities, hotel_lat, hotel_lng)

        # Split activities around lunch (morning vs afternoon/evening)
        morning_acts: List[Place] = []
        afternoon_acts: List[Place] = []

        if len(ordered_activities) <= 2:
            morning_acts = ordered_activities[:1]
            afternoon_acts = ordered_activities[1:]
        elif len(ordered_activities) == 3:
            morning_acts = ordered_activities[:1]
            afternoon_acts = ordered_activities[1:]
        else:
            morning_acts = ordered_activities[:2]
            afternoon_acts = ordered_activities[2:]

        # Restaurants for lunch and dinner
        lunch_rest = restaurants[0] if len(restaurants) > 0 else None
        dinner_rest = restaurants[1] if len(restaurants) > 1 else (restaurants[0] if restaurants else None)

        day_items: List[ItineraryItem] = []
        item_counter = 1
        current_time = cls.DAY_START

        # 1. Morning activities
        for act in morning_acts:
            duration = min(act.duration_min or 90, 120)
            end_time = current_time + duration
            day_items.append(ItineraryItem(
                id=f"it_d{day_number}_{item_counter:02d}",
                type="activity",
                place_id=act.id,
                name=act.name,
                category=act.category,
                lat=act.lat,
                lng=act.lng,
                start_time=format_minutes_to_time(current_time),
                end_time=format_minutes_to_time(end_time),
                duration_min=duration,
                indoor=act.indoor,
                cost=ItemCost(amount=act.cost_amount, per=act.cost_per, basis="catalog"),
                reason=reasons.get(act.id, f"Iconic {act.category} stop; best explored in the morning."),
                reason_factors=factors.get(act.id, [f"category:{act.category}"]),
                locked=False,
                booking=BookingRef(url=act.booking_url) if act.booking_url else None
            ))
            item_counter += 1
            current_time = end_time + cls.TRANSIT_BUFFER

        # 2. Lunch
        lunch_start = max(current_time, cls.LUNCH_TIME)
        lunch_duration = 75  # 1 hour 15 mins
        if lunch_rest:
            day_items.append(ItineraryItem(
                id=f"it_d{day_number}_{item_counter:02d}",
                type="meal",
                place_id=lunch_rest.id,
                name=lunch_rest.name,
                category="restaurant",
                lat=lunch_rest.lat,
                lng=lunch_rest.lng,
                start_time=format_minutes_to_time(lunch_start),
                end_time=format_minutes_to_time(lunch_start + lunch_duration),
                duration_min=lunch_duration,
                indoor=lunch_rest.indoor,
                cost=ItemCost(amount=lunch_rest.cost_amount, per="person", basis="catalog"),
                reason=reasons.get(lunch_rest.id, f"Delicious local cuisine at {lunch_rest.name}."),
                reason_factors=factors.get(lunch_rest.id, ["meal:lunch", "cuisine:local"]),
                locked=False,
                booking=BookingRef(url=lunch_rest.booking_url) if lunch_rest.booking_url else None
            ))
            item_counter += 1
            current_time = lunch_start + lunch_duration + cls.TRANSIT_BUFFER
        else:
            current_time = lunch_start + lunch_duration

        # 3. Afternoon activities
        for act in afternoon_acts:
            duration = min(act.duration_min or 90, 120)
            end_time = current_time + duration
            day_items.append(ItineraryItem(
                id=f"it_d{day_number}_{item_counter:02d}",
                type="activity",
                place_id=act.id,
                name=act.name,
                category=act.category,
                lat=act.lat,
                lng=act.lng,
                start_time=format_minutes_to_time(current_time),
                end_time=format_minutes_to_time(end_time),
                duration_min=duration,
                indoor=act.indoor,
                cost=ItemCost(amount=act.cost_amount, per=act.cost_per, basis="catalog"),
                reason=reasons.get(act.id, f"Scenic afternoon experience at {act.name}."),
                reason_factors=factors.get(act.id, [f"category:{act.category}"]),
                locked=False,
                booking=BookingRef(url=act.booking_url) if act.booking_url else None
            ))
            item_counter += 1
            current_time = end_time + cls.TRANSIT_BUFFER

        # 4. Dinner
        dinner_start = max(current_time, cls.DINNER_TIME)
        dinner_duration = 90
        if dinner_rest:
            day_items.append(ItineraryItem(
                id=f"it_d{day_number}_{item_counter:02d}",
                type="meal",
                place_id=dinner_rest.id,
                name=dinner_rest.name,
                category="restaurant",
                lat=dinner_rest.lat,
                lng=dinner_rest.lng,
                start_time=format_minutes_to_time(dinner_start),
                end_time=format_minutes_to_time(dinner_start + dinner_duration),
                duration_min=dinner_duration,
                indoor=dinner_rest.indoor,
                cost=ItemCost(amount=dinner_rest.cost_amount, per="person", basis="catalog"),
                reason=reasons.get(dinner_rest.id, f"Atmospheric dinner experience at {dinner_rest.name}."),
                reason_factors=factors.get(dinner_rest.id, ["meal:dinner"]),
                locked=False,
                booking=BookingRef(url=dinner_rest.booking_url) if dinner_rest.booking_url else None
            ))

        # Generate route legs between consecutive items
        routes: List[RouteLeg] = []
        for i in range(len(day_items) - 1):
            from_it = day_items[i]
            to_it = day_items[i + 1]
            dist_km = round(haversine_km(from_it.lat, from_it.lng, to_it.lat, to_it.lng) * 1.3, 1)
            # Speed approx 30 km/h in city + 5 min traffic
            duration_m = max(10, int((dist_km / 30.0) * 60) + 5)
            routes.append(RouteLeg(
                id=f"rt_d{day_number}_{i+1:02d}",
                from_item=from_it.id,
                to_item=to_it.id,
                mode="taxi",
                distance_km=dist_km,
                duration_min=duration_m,
                cost=int(dist_km * 25),
                source="estimated",
                geometry=[[from_it.lat, from_it.lng], [to_it.lat, to_it.lng]]
            ))

        # Calculate totals
        act_cost = sum(it.cost.amount for it in day_items if it.type == "activity")
        food_cost = sum(it.cost.amount for it in day_items if it.type == "meal")
        trans_cost = sum(r.cost for r in routes)
        active_mins = sum(it.duration_min for it in day_items)
        travel_mins = sum(r.duration_min for r in routes)

        return ItineraryDay(
            id=f"day_{day_number}",
            day_number=day_number,
            date=date_str,
            theme=theme,
            items=day_items,
            routes=routes,
            totals=DayTotals(
                activity_cost=act_cost,
                food_cost=food_cost,
                transport_cost=trans_cost,
                travel_minutes=travel_mins,
                active_minutes=active_mins
            )
        )
