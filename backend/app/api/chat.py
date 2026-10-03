from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_owned_trip
from app.core.ratelimit import check_llm_rate_limit
from app.models.database import get_db
from app.models.entities import Trip
from app.orchestrator.orchestrator import Orchestrator
from app.repositories.entities import ChatRepository
from app.schemas.chat import ChatMessageResponse, ChatRequest
from app.schemas.common import success_response

router = APIRouter(prefix="/trips/{trip_id}/chat", tags=["AI Assistant"])


@router.post("")
def send_chat_message(
    chat_req: ChatRequest,
    request: Request,
    trip: Trip = Depends(get_owned_trip),
    db: Session = Depends(get_db)
):
    check_llm_rate_limit(request)
    chat_resp = Orchestrator.handle_chat(db, trip.id, chat_req.message)
    return success_response(chat_resp.model_dump())


@router.get("")
def get_chat_history(
    trip: Trip = Depends(get_owned_trip),
    db: Session = Depends(get_db)
):
    repo = ChatRepository(db)
    messages = repo.get_history(trip.id, limit=20)
    return success_response([
        ChatMessageResponse(
            id=m.id,
            trip_id=m.trip_id,
            role=m.role,
            content=m.content,
            intent=m.intent,
            version_before=m.version_before,
            version_after=m.version_after,
            created_at=m.created_at.isoformat()
        ).model_dump()
        for m in messages
    ])
