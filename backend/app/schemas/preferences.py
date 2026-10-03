from typing import List, Optional
from pydantic import BaseModel, Field


class PreferencesSchema(BaseModel):
    interests: List[str] = Field(default_factory=lambda: ["beaches", "heritage", "food"])
    pace: str = Field(default="relaxed")  # relaxed, balanced, packed
    budget_level: str = Field(default="mid")  # budget, mid, luxury
    transport_modes: List[str] = Field(default_factory=lambda: ["taxi", "walk"])
    accommodation_type: str = Field(default="hotel")
    dietary: List[str] = Field(default_factory=list)
    avoid: List[str] = Field(default_factory=list)
    mobility: str = Field(default="standard")
    home_city: Optional[str] = None
