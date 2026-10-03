from typing import Any, Dict, List
from app.schemas.itinerary import CanonicalItinerary


class DetectedEvent:
    def __init__(self, event_type: str, day_id: str, severity: str, detail: str, affected_item_ids: List[str], payload: Dict[str, Any]):
        self.event_type = event_type
        self.day_id = day_id
        self.severity = severity
        self.detail = detail
        self.affected_item_ids = affected_item_ids
        self.payload = payload


class EventDetector:
    RAIN_THRESHOLD_PCT = 60
    HEAT_THRESHOLD_C = 38.0

    @classmethod
    def detect_weather_events(cls, itinerary: CanonicalItinerary) -> List[DetectedEvent]:
        events = []
        for day in itinerary.days:
            rain = day.weather.rain_prob_pct if day.weather else 0
            temp = day.weather.temp_max_c if day.weather else 30.0

            outdoor_items = [it for it in day.items if not it.indoor and it.type == "activity"]

            if rain >= cls.RAIN_THRESHOLD_PCT and outdoor_items:
                severity = "high" if rain >= 80 else "medium"
                detail = f"Rain probability {rain}% forecasted for Day {day.day_number}. Outdoor activities affected."
                events.append(DetectedEvent(
                    event_type="weather",
                    day_id=day.id,
                    severity=severity,
                    detail=detail,
                    affected_item_ids=[it.id for it in outdoor_items],
                    payload={
                        "condition": "rain",
                        "rain_prob_pct": rain,
                        "day_number": day.day_number,
                        "affected_items": [it.name for it in outdoor_items]
                    }
                ))
            elif temp >= cls.HEAT_THRESHOLD_C and outdoor_items:
                detail = f"Extreme temperature ({temp}°C) forecasted for Day {day.day_number}. Outdoor afternoon activities affected."
                events.append(DetectedEvent(
                    event_type="weather",
                    day_id=day.id,
                    severity="medium",
                    detail=detail,
                    affected_item_ids=[it.id for it in outdoor_items],
                    payload={
                        "condition": "extreme_heat",
                        "temp_max_c": temp,
                        "day_number": day.day_number,
                        "affected_items": [it.name for it in outdoor_items]
                    }
                ))

        return events

    @classmethod
    def detect_budget_events(cls, itinerary: CanonicalItinerary) -> List[DetectedEvent]:
        events = []
        if itinerary.budget.status == "over":
            events.append(DetectedEvent(
                event_type="budget",
                day_id="all",
                severity="high",
                detail=f"Itinerary is ₹{abs(itinerary.budget.remaining):,} over spendable budget.",
                affected_item_ids=[],
                payload={
                    "total_limit": itinerary.budget.total_limit,
                    "estimated_total": itinerary.budget.estimated_total,
                    "over_amount": abs(itinerary.budget.remaining)
                }
            ))
        return events
