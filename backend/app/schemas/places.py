from typing import List, Optional
from pydantic import BaseModel, Field


class DestinationSchema(BaseModel):
    id: str
    name: str
    country: str = "IN"
    lat: float
    lng: float
    blurb: str
    image: Optional[str] = None
    coverage: int = 30
    catalog_id: str


class PlaceSchema(BaseModel):
    id: str
    destination_id: str
    kind: str  # attraction, restaurant, hotel
    name: str
    category: str
    tags: List[str] = Field(default_factory=list)
    lat: float
    lng: float
    cost_amount: int
    cost_per: str = "person"
    duration_min: int = 60
    open_from: str = "09:00"
    open_to: str = "18:00"
    closed_days: List[str] = Field(default_factory=list)
    indoor: bool = False
    rating: float = 4.5
    description: str = ""
    source: str = "catalog"
    verified: bool = True
    booking_url: Optional[str] = None
    score: Optional[float] = None
    reason_factors: Optional[List[str]] = Field(default_factory=list)
