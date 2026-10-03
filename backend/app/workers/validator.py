from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from app.schemas.itinerary import CanonicalItinerary, WarningItem
from app.models.entities import Place


class ValidationResult:
    def __init__(self, is_valid: bool, errors: List[str], warnings: List[WarningItem]):
        self.is_valid = is_valid
        self.errors = errors
        self.warnings = warnings


def parse_time_to_minutes(time_str: str) -> int:
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0


class ItineraryValidator:
    PACE_CAPS = {
        "relaxed": 3,
        "balanced": 4,
        "packed": 5
    }

    PACE_DAILY_MINUTES = {
        "relaxed": 360,   # 6 hours
        "balanced": 480,  # 8 hours
        "packed": 600     # 10 hours
    }

    DAY_START_MINUTES = 9 * 60   # 09:00
    DAY_END_MINUTES = 21 * 60 + 30  # 21:30

    @classmethod
    def validate(
        cls,
        itinerary: CanonicalItinerary,
        catalog_places: Dict[str, Place],
        previous_version: Optional[CanonicalItinerary] = None
    ) -> ValidationResult:
        errors: List[str] = []
        warnings: List[WarningItem] = []

        pace = itinerary.preferences.pace.lower() if itinerary.preferences else "relaxed"
        max_activities = cls.PACE_CAPS.get(pace, 4)
        max_daily_minutes = cls.PACE_DAILY_MINUTES.get(pace, 480)

        destination_id = itinerary.trip.destination.catalog_id

        # V11: Dates and num_days consistent
        if len(itinerary.days) != itinerary.trip.num_days:
            errors.append(f"V11: Number of days ({len(itinerary.days)}) does not match trip num_days ({itinerary.trip.num_days}).")

        # Track visited places for duplicate detection (V2)
        visited_places: Set[str] = set()
        hotel_place_id = itinerary.accommodation.place_id

        # V9: Locked items tracking
        prev_locked_items: Dict[str, dict] = {}
        if previous_version:
            for p_day in previous_version.days:
                for p_item in p_day.items:
                    if p_item.locked:
                        prev_locked_items[p_item.id] = p_item.model_dump()

        for day in itinerary.days:
            # V11: Each day has at least 1 item
            if not day.items:
                errors.append(f"V11: Day {day.day_number} has no items.")
                continue

            day_activity_count = 0
            day_total_active_mins = 0
            day_items_sorted: List[Tuple[int, int, str]] = []  # (start_min, end_min, item_id)

            # Determine day of week from date
            day_of_week = ""
            try:
                dt = datetime.strptime(day.date, "%Y-%m-%d")
                day_of_week = dt.strftime("%A")
            except Exception:
                pass

            for item in day.items:
                # V12: Every item has non-empty reason
                if not item.reason or not item.reason.strip():
                    errors.append(f"V12: Item '{item.name}' ({item.id}) on Day {day.day_number} missing reason.")

                # V1: Check place exists in catalog for destination
                place = catalog_places.get(item.place_id)
                if not place:
                    errors.append(f"V1: Place ID '{item.place_id}' for item '{item.name}' not found in catalog.")
                elif place.destination_id != destination_id:
                    errors.append(f"V1: Place '{item.place_id}' belongs to {place.destination_id}, not {destination_id}.")
                else:
                    # V4: Opening hours and closed days
                    if day_of_week and place.closed_days:
                        if day_of_week in place.closed_days:
                            errors.append(f"V4: Place '{place.name}' is closed on {day_of_week} (Day {day.day_number}).")

                    start_min = parse_time_to_minutes(item.start_time)
                    end_min = parse_time_to_minutes(item.end_time)
                    open_min = parse_time_to_minutes(place.open_from)
                    close_min = parse_time_to_minutes(place.open_to)

                    if open_min > 0 and close_min > open_min:
                        if start_min < open_min or end_min > close_min:
                            warnings.append(WarningItem(
                                code="OUTSIDE_OPENING_HOURS",
                                message=f"'{item.name}' scheduled {item.start_time}-{item.end_time} outside opening hours {place.open_from}-{place.open_to}.",
                                day_id=day.id
                            ))

                    # V10: Dietary & avoid preferences
                    if itinerary.preferences:
                        # Avoid list
                        for avoid_tag in (itinerary.preferences.avoid or []):
                            if avoid_tag.lower() in [t.lower() for t in (place.tags or [])] or avoid_tag.lower() == place.category.lower():
                                errors.append(f"V10: Place '{place.name}' violates avoid preference: '{avoid_tag}'.")

                        # Dietary list
                        for diet in (itinerary.preferences.dietary or []):
                            if diet.lower() == "vegetarian" and place.kind == "restaurant":
                                tags = [t.lower() for t in (place.tags or [])]
                                if "vegetarian" not in tags and "pure-veg" not in tags:
                                    warnings.append(WarningItem(
                                        code="DIETARY_MISMATCH",
                                        message=f"Restaurant '{place.name}' may not cater fully to vegetarian preference.",
                                        day_id=day.id
                                    ))

                # V2: Duplicate places check (hotel is exempt)
                if item.place_id != hotel_place_id and item.type == "activity":
                    if item.place_id in visited_places:
                        errors.append(f"V2: Duplicate visit to place '{item.name}' ({item.place_id}) on Day {day.day_number}.")
                    visited_places.add(item.place_id)

                # V3: Item timing window and validity
                s_min = parse_time_to_minutes(item.start_time)
                e_min = parse_time_to_minutes(item.end_time)

                if s_min >= e_min:
                    errors.append(f"V3: Item '{item.name}' on Day {day.day_number} has invalid start ({item.start_time}) >= end ({item.end_time}).")
                if s_min < cls.DAY_START_MINUTES or e_min > cls.DAY_END_MINUTES:
                    warnings.append(WarningItem(
                        code="OUTSIDE_DAY_WINDOW",
                        message=f"'{item.name}' on Day {day.day_number} falls outside typical day window (09:00 - 21:30).",
                        day_id=day.id
                    ))

                day_items_sorted.append((s_min, e_min, item.name))

                if item.type == "activity":
                    day_activity_count += 1
                day_total_active_mins += item.duration_min

            # V3: Check no overlapping items on the same day
            day_items_sorted.sort(key=lambda x: x[0])
            for i in range(len(day_items_sorted) - 1):
                cur_s, cur_e, cur_name = day_items_sorted[i]
                nxt_s, nxt_e, nxt_name = day_items_sorted[i + 1]
                if cur_e > nxt_s:
                    errors.append(f"V3: Overlapping schedule on Day {day.day_number} between '{cur_name}' and '{nxt_name}'.")

            # V5: Activity cap per day
            if day_activity_count > max_activities:
                errors.append(f"V5: Day {day.day_number} has {day_activity_count} activities, exceeding {pace} pace cap of {max_activities}.")

            # V6: Total daily active + travel minutes
            day_travel_mins = sum(r.duration_min for r in day.routes)
            if (day_total_active_mins + day_travel_mins) > max_daily_minutes:
                warnings.append(WarningItem(
                    code="PACE_TIME_EXCEEDED",
                    message=f"Day {day.day_number} active + travel time ({day_total_active_mins + day_travel_mins}m) exceeds {pace} pace target ({max_daily_minutes}m).",
                    day_id=day.id
                ))

            # V7: Each route leg <= 90 minutes
            for route in day.routes:
                if route.duration_min > 90:
                    warnings.append(WarningItem(
                        code="LONG_TRANSIT_LEG",
                        message=f"Route leg from {route.from_item} to {route.to_item} is {route.duration_min} mins (over 90 min threshold).",
                        day_id=day.id
                    ))

        # V8: Budget status
        if itinerary.budget.status == "over":
            warnings.append(WarningItem(
                code="BUDGET_OVER",
                message=f"Itinerary estimated cost (₹{itinerary.budget.estimated_total}) exceeds budget limit (₹{itinerary.budget.total_limit})."
            ))

        # V9: Locked items check
        if prev_locked_items:
            current_items_by_id = {item.id: item for day in itinerary.days for item in day.items}
            for locked_id, prev_data in prev_locked_items.items():
                curr = current_items_by_id.get(locked_id)
                if not curr:
                    errors.append(f"V9: Locked item '{prev_data.get('name')}' ({locked_id}) was removed in new version.")
                elif curr.place_id != prev_data.get("place_id"):
                    errors.append(f"V9: Locked item '{prev_data.get('name')}' ({locked_id}) was modified in new version.")

        is_valid = len(errors) == 0
        return ValidationResult(is_valid=is_valid, errors=errors, warnings=warnings)
