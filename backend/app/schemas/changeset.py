from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class OpType(str, Enum):
    ADD_ITEM = "ADD_ITEM"
    REMOVE_ITEM = "REMOVE_ITEM"
    REPLACE_ITEM = "REPLACE_ITEM"
    MOVE_ITEM = "MOVE_ITEM"
    SET_BUDGET = "SET_BUDGET"
    SET_PREFERENCE = "SET_PREFERENCE"
    SET_DURATION = "SET_DURATION"
    SET_ACCOMMODATION = "SET_ACCOMMODATION"
    LOCK_ITEM = "LOCK_ITEM"
    UNLOCK_ITEM = "UNLOCK_ITEM"
    REGENERATE_DAY = "REGENERATE_DAY"


class ChangeOp(BaseModel):
    op: OpType
    day_id: Optional[str] = None
    to_day_id: Optional[str] = None
    item_id: Optional[str] = None
    place_id: Optional[str] = None
    new_place_id: Optional[str] = None
    position: Optional[int] = None
    total_limit: Optional[int] = None
    key: Optional[str] = None
    value: Optional[Any] = None
    num_days: Optional[int] = None
    constraints: Optional[Dict[str, Any]] = None


class ChangeSet(BaseModel):
    ops: List[ChangeOp] = Field(default_factory=list)
    rationale: str = ""
    expected_effects: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DaySelection(BaseModel):
    day_number: int
    theme: str
    activity_ids: List[str] = Field(default_factory=list)
    meal_ids: List[str] = Field(default_factory=list)
    reasons: Dict[str, str] = Field(default_factory=dict)
    reason_factors: Dict[str, List[str]] = Field(default_factory=dict)


class AlternativeTheme(BaseModel):
    id: str
    label: str
    summary: str
    ops: List[ChangeOp] = Field(default_factory=list)


class PlannerSelection(BaseModel):
    hotel_id: str
    hotel_reason: str = ""
    days: List[DaySelection] = Field(default_factory=list)
    alternative_themes: List[AlternativeTheme] = Field(default_factory=list)
