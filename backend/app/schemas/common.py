from typing import Any, Dict, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)
    request_id: Optional[str] = None


class ResponseEnvelope(BaseModel, Generic[DataT]):
    ok: bool = True
    data: Optional[DataT] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict)


def success_response(data: Any, provenance: Optional[Dict[str, Any]] = None, request_id: Optional[str] = None) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    if provenance:
        meta["provenance"] = provenance
    if request_id:
        meta["request_id"] = request_id
    return {
        "ok": True,
        "data": data,
        "meta": meta
    }
