from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.models.database import get_db
from app.models.entities import User
from app.repositories.users import UserRepository
from app.schemas.auth import UserResponse
from app.schemas.common import success_response
from app.schemas.preferences import PreferencesSchema

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return success_response(
        UserResponse(id=user.id, email=user.email, display_name=user.display_name, created_at=user.created_at.isoformat())
    )


@router.get("/me/preferences")
def get_my_preferences(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = UserRepository(db)
    pref = repo.get_preferences(user.id)
    if not pref:
        return success_response(PreferencesSchema())
    return success_response(PreferencesSchema(
        interests=pref.interests or [],
        pace=pref.pace or "relaxed",
        budget_level=pref.budget_level or "mid",
        transport_modes=pref.transport_modes or ["taxi"],
        accommodation_type=pref.accommodation_type or "hotel",
        dietary=pref.dietary or [],
        avoid=pref.avoid or [],
        mobility=pref.mobility or "standard",
        home_city=pref.home_city
    ))


@router.put("/me/preferences")
def update_my_preferences(
    pref_in: PreferencesSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = UserRepository(db)
    updated = repo.update_preferences(user.id, pref_in.model_dump())
    return success_response(PreferencesSchema(
        interests=updated.interests or [],
        pace=updated.pace or "relaxed",
        budget_level=updated.budget_level or "mid",
        transport_modes=updated.transport_modes or ["taxi"],
        accommodation_type=updated.accommodation_type or "hotel",
        dietary=updated.dietary or [],
        avoid=updated.avoid or [],
        mobility=updated.mobility or "standard",
        home_city=updated.home_city
    ))
