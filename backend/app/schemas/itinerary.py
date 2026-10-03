from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.preferences import PreferencesSchema


class DestinationRef(BaseModel):
    name: str
    country: str = "IN"
    lat: float
    lng: float
    catalog_id: str


class Travelers(BaseModel):
    adults: int = 2
    children: int = 0


class TripInfo(BaseModel):
    title: str
    destination: DestinationRef
    start_date: str
    end_date: str
    num_days: int
    travelers: Travelers = Field(default_factory=Travelers)
    currency: str = "INR"


class BudgetBreakdown(BaseModel):
    accommodation: int = 0
    transport: int = 0
    food: int = 0
    activities: int = 0
    misc: int = 0
    reserve: int = 0


class BudgetBlock(BaseModel):
    total_limit: int
    reserve_pct: int = 10
    breakdown: BudgetBreakdown = Field(default_factory=BudgetBreakdown)
    estimated_total: int = 0
    spendable: int = 0
    remaining: int = 0
    per_day: int = 0
    per_person: int = 0
    status: str = "ok"  # ok, tight, over
    computed_at: Optional[str] = None


class BookingRef(BaseModel):
    type: str = "reference"
    url: Optional[str] = None
    ref: Optional[str] = None
    note: str = "Reference link only. Not a live booking."


class AccommodationBlock(BaseModel):
    place_id: str
    name: str
    nights: int
    rooms: int = 1
    nightly_cost: int
    check_in: str
    check_out: str
    booking: Optional[BookingRef] = Field(default_factory=BookingRef)
    reason: str = ""


class ItemCost(BaseModel):
    amount: int = 0
    per: str = "person"  # person, group
    basis: str = "catalog"


class ItineraryItem(BaseModel):
    id: str  # e.g. it_d1_01
    type: str = "activity"  # activity, meal, transit, free_time, checkin, checkout
    place_id: str
    name: str
    category: str
    lat: float
    lng: float
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    duration_min: int
    indoor: bool = False
    cost: ItemCost = Field(default_factory=ItemCost)
    reason: str
    reason_factors: List[str] = Field(default_factory=list)
    locked: bool = False
    status: str = "planned"
    booking: Optional[BookingRef] = None
    alt_ids: List[str] = Field(default_factory=list)


class RouteLeg(BaseModel):
    id: str  # rt_d1_01
    from_item: str
    to_item: str
    mode: str = "taxi"
    distance_km: float = 0.0
    duration_min: int = 0
    cost: int = 0
    source: str = "estimated"  # live, cache, estimated
    geometry: List[List[float]] = Field(default_factory=list)


class DayTotals(BaseModel):
    activity_cost: int = 0
    food_cost: int = 0
    transport_cost: int = 0
    travel_minutes: int = 0
    active_minutes: int = 0


class DayWeather(BaseModel):
    summary: str = "Sunny"
    temp_max_c: float = 30.0
    rain_prob_pct: int = 10
    source: str = "demo"  # live, cache, demo, simulated
    as_of: Optional[str] = None


class ItineraryDay(BaseModel):
    id: str  # day_1
    day_number: int
    date: str  # YYYY-MM-DD
    theme: str
    weather: DayWeather = Field(default_factory=DayWeather)
    items: List[ItineraryItem] = Field(default_factory=list)
    routes: List[RouteLeg] = Field(default_factory=list)
    totals: DayTotals = Field(default_factory=DayTotals)


class AlternativeOption(BaseModel):
    id: str
    label: str
    summary: str
    delta: Dict[str, Any] = Field(default_factory=dict)  # {"cost": -3200, "travel_min": 25}
    change_set: Dict[str, Any] = Field(default_factory=dict)


class EventRecord(BaseModel):
    id: str
    type: str  # weather, budget, closure
    day_id: Optional[str] = None
    severity: str = "medium"
    detail: str = ""
    source: str = "simulated"  # live, simulated
    handled_in_version: Optional[int] = None


class NoteItem(BaseModel):
    id: str
    day_id: Optional[str] = None
    text: str
    origin: str = "user"


class ProvenanceBlock(BaseModel):
    weather: str = "demo"
    routing: str = "estimated"
    places: str = "catalog"
    llm: str = "live"
    overall: str = "live_with_fallbacks"


class WarningItem(BaseModel):
    code: str
    message: str
    day_id: Optional[str] = None


class CanonicalItinerary(BaseModel):
    schema_version: str = "1.0"
    trip_id: str
    version: int = 1
    parent_version: Optional[int] = None
    created_by: str = "baseline_planner"
    change_summary: str = "Initial itinerary generated"
    mode: str = "live"  # live, demo, replay

    trip: TripInfo
    preferences: PreferencesSchema
    budget: BudgetBlock
    accommodation: AccommodationBlock
    days: List[ItineraryDay] = Field(default_factory=list)
    alternatives: List[AlternativeOption] = Field(default_factory=list)
    events: List[EventRecord] = Field(default_factory=list)
    notes: List[NoteItem] = Field(default_factory=list)
    provenance: ProvenanceBlock = Field(default_factory=ProvenanceBlock)
    warnings: List[WarningItem] = Field(default_factory=list)
