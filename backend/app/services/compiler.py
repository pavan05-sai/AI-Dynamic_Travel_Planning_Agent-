import re
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from app.models.entities import Place, Trip
from app.schemas.itinerary import CanonicalItinerary, ItineraryItem


class ItineraryCompilerService:
    """
    Parses unstructured travel documents, booking emails, WhatsApp notes,
    and tickets into structured itinerary candidates with provenance tracking.
    """

    TIME_PATTERNS = [
        r'\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\b',
        r'\b(\d{1,2}:\d{2})\b',
    ]

    COST_PATTERNS = [
        r'(?:₹|INR|Rs\.?|rs\.?)\s*(\d+(?:,\d+)*)',
        r'(\d+(?:,\d+)*)\s*(?:₹|INR|rupees)',
    ]

    PNR_PATTERNS = [
        r'\b(?:PNR|Booking Ref|Ticket No|Confirmation|Ref)[:\s#]*([A-Z0-9]{5,10})\b',
        r'\b([A-Z]{2,3}[-\s]?\d{3,4})\b',  # Flight number e.g. 6E-204, AI-805
    ]

    @classmethod
    def compile_text(
        cls,
        text: str,
        trip: Trip,
        catalog_places: List[Place],
        existing_itinerary: Optional[CanonicalItinerary] = None
    ) -> Dict[str, Any]:
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        extracted_items = []
        conflicts = []

        trip_start = None
        if trip.start_date:
            try:
                trip_start = datetime.strptime(trip.start_date, "%Y-%m-%d")
            except Exception:
                pass

        # Normalize catalog for matching
        catalog_lookup = {}
        for p in catalog_places:
            catalog_lookup[p.name.lower()] = p
            # Also register keywords
            for word in p.name.lower().split():
                if len(word) > 4:
                    catalog_lookup[word] = p

        for idx, line in enumerate(lines):
            # Extract time
            found_time = "10:00"
            for tp in cls.TIME_PATTERNS:
                m = re.search(tp, line, re.IGNORECASE)
                if m:
                    raw_time = m.group(1).strip()
                    try:
                        # normalize to 24h
                        if 'am' in raw_time.lower() or 'pm' in raw_time.lower():
                            t = datetime.strptime(raw_time.upper().replace(" ", ""), "%I:%M%p" if ":" in raw_time else "%I%p")
                            found_time = t.strftime("%H:%M")
                        elif ':' in raw_time:
                            found_time = raw_time
                    except Exception:
                        pass
                    break

            # Extract cost
            cost = 0
            for cp in cls.COST_PATTERNS:
                m = re.search(cp, line, re.IGNORECASE)
                if m:
                    try:
                        cost = int(m.group(1).replace(',', ''))
                    except Exception:
                        pass
                    break

            # Extract booking / PNR code
            booking_ref = None
            for pp in cls.PNR_PATTERNS:
                m = re.search(pp, line, re.IGNORECASE)
                if m:
                    booking_ref = m.group(1).strip()
                    break

            # Determine day
            day_num = 1
            day_match = re.search(r'\bDay\s*(\d+)\b', line, re.IGNORECASE)
            if day_match:
                day_num = int(day_match.group(1))
            elif "tomorrow" in line.lower():
                day_num = 2
            elif "next day" in line.lower() or "day 2" in line.lower():
                day_num = 2
            elif "day 3" in line.lower():
                day_num = 3

            if day_num > trip.num_days:
                conflicts.append(f"Line refers to Day {day_num}, but trip is only {trip.num_days} days.")
                day_num = trip.num_days

            # Match against catalog
            matched_place = None
            line_lower = line.lower()
            for key, place in catalog_lookup.items():
                if key in line_lower:
                    matched_place = place
                    break

            # Infer type
            item_type = "activity"
            category = "sightseeing"
            if matched_place:
                category = matched_place.category or "sightseeing"
                item_name = matched_place.name
                item_cost = cost or matched_place.cost_estimate or 0
                place_id = matched_place.id
                lat = matched_place.lat
                lng = matched_place.lng
                confidence = 0.95
            else:
                # Clean up line to create item name
                clean_name = re.sub(r'(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|₹\d+|INR\s*\d+|Day\s*\d+', '', line, flags=re.IGNORECASE)
                clean_name = clean_name.strip(' -:;,•*#')
                if len(clean_name) < 3:
                    continue
                item_name = clean_name[:60]
                item_cost = cost or 200
                place_id = f"custom_{idx}"
                lat = trip.destination.lat if hasattr(trip, 'destination') and trip.destination else 15.49
                lng = trip.destination.lng if hasattr(trip, 'destination') and trip.destination else 73.82
                confidence = 0.72

            if any(w in line_lower for w in ["flight", "train", "bus", "cab", "drive", "airport"]):
                item_type = "travel"
                category = "transport"
            elif any(w in line_lower for w in ["hotel", "resort", "stay", "check in", "hostel", "check-in"]):
                item_type = "stay"
                category = "accommodation"
            elif any(w in line_lower for w in ["lunch", "dinner", "breakfast", "cafe", "restaurant", "food"]):
                category = "food"

            extracted_items.append({
                "id": f"imported_{idx}_{int(datetime.now().timestamp())}",
                "day_id": f"day_{day_num}",
                "day_number": day_num,
                "name": item_name,
                "place_id": place_id,
                "type": item_type,
                "category": category,
                "start_time": found_time,
                "duration_min": 90 if item_type == "activity" else 60,
                "cost": item_cost,
                "booking_ref": booking_ref,
                "provenance": {
                    "source": "imported_text",
                    "original_snippet": line[:120],
                    "confidence": confidence,
                    "catalog_matched": matched_place is not None
                },
                "coordinates": {"lat": lat, "lng": lng}
            })

        return {
            "source_lines_analyzed": len(lines),
            "extracted_count": len(extracted_items),
            "items": extracted_items,
            "conflicts": conflicts,
            "catalog_matched_count": sum(1 for it in extracted_items if it["provenance"]["catalog_matched"])
        }
