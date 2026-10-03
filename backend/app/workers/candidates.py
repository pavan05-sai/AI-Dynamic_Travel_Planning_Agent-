from typing import Dict, List, Optional
from app.models.entities import Place
from app.schemas.places import PlaceSchema
from app.schemas.preferences import PreferencesSchema


class CandidateRetriever:
    @classmethod
    def score_place(
        cls,
        place: Place,
        preferences: Optional[PreferencesSchema] = None,
        max_cost: Optional[int] = None,
        preferred_indoor: Optional[bool] = None
    ) -> float:
        score = float(place.rating or 4.0) * 10.0  # Base 40-50 pts

        interests = [i.lower() for i in (preferences.interests if preferences else [])]
        tags = [t.lower() for t in (place.tags or [])]
        category = place.category.lower()

        # Check avoid list (penalize heavily if match)
        if preferences and preferences.avoid:
            for av in preferences.avoid:
                if av.lower() in tags or av.lower() == category:
                    return -100.0

        # Interest matching
        matched_interests = 0
        for interest in interests:
            if interest in tags or interest == category:
                matched_interests += 1

        score += matched_interests * 20.0

        # Indoor preference (e.g. rainy day)
        if preferred_indoor is not None:
            if place.indoor == preferred_indoor:
                score += 25.0
            else:
                score -= 15.0

        # Budget fit
        budget_level = preferences.budget_level if preferences else "mid"
        if budget_level == "budget" and place.cost_amount <= 200:
            score += 15.0
        elif budget_level == "luxury" and place.rating >= 4.6:
            score += 10.0

        if max_cost is not None and place.cost_amount > max_cost:
            score -= 30.0

        return score

    @classmethod
    def get_reason_factors(cls, place: Place, preferences: Optional[PreferencesSchema] = None) -> List[str]:
        factors = []
        interests = [i.lower() for i in (preferences.interests if preferences else [])]
        tags = [t.lower() for t in (place.tags or [])]
        category = place.category.lower()

        for interest in interests:
            if interest in tags or interest == category:
                factors.append(f"interest:{interest}")

        if place.cost_amount == 0:
            factors.append("cost:free")
        elif place.cost_amount <= 200:
            factors.append("cost:budget_friendly")

        if place.rating and place.rating >= 4.5:
            factors.append(f"rating:{place.rating}")

        if place.indoor:
            factors.append("weather:indoor")
        else:
            factors.append("scenic:outdoor")

        return factors

    @classmethod
    def retrieve(
        cls,
        places: List[Place],
        kind: Optional[str] = None,
        preferences: Optional[PreferencesSchema] = None,
        category: Optional[str] = None,
        indoor: Optional[bool] = None,
        max_cost: Optional[int] = None,
        limit: int = 20
    ) -> List[PlaceSchema]:
        candidates = []
        for p in places:
            if kind and p.kind != kind:
                continue
            if category and p.category.lower() != category.lower():
                continue
            if indoor is not None and p.indoor != indoor:
                continue
            if max_cost is not None and p.cost_amount > max_cost:
                continue

            score = cls.score_place(p, preferences, max_cost, indoor)
            if score < 0:
                continue

            factors = cls.get_reason_factors(p, preferences)
            candidates.append((score, p, factors))

        # Sort descending by score
        candidates.sort(key=lambda x: x[0], reverse=True)

        # Convert to PlaceSchema with scores & reason_factors
        results: List[PlaceSchema] = []
        for score, p, factors in candidates[:limit]:
            schema = PlaceSchema(
                id=p.id,
                destination_id=p.destination_id,
                kind=p.kind,
                name=p.name,
                category=p.category,
                tags=p.tags or [],
                lat=p.lat,
                lng=p.lng,
                cost_amount=p.cost_amount,
                cost_per=p.cost_per,
                duration_min=p.duration_min,
                open_from=p.open_from,
                open_to=p.open_to,
                closed_days=p.closed_days or [],
                indoor=p.indoor,
                rating=p.rating,
                description=p.description or "",
                source=p.source or "catalog",
                verified=p.verified,
                booking_url=p.booking_url,
                score=round(score, 1),
                reason_factors=factors
            )
            results.append(schema)

        return results
