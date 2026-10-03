from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.database import get_db
from app.schemas.common import success_response

router = APIRouter(tags=["System"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Check DB connectivity
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Providers status
    providers = {
        "gemini": "configured" if settings.GEMINI_API_KEY else "unconfigured_fallback_ready",
        "open_meteo": "active",
        "osrm": "active",
        "nominatim": "active",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL
    }

    return success_response({
        "status": "healthy",
        "version": "1.0.0",
        "database": db_status,
        "demo_mode": settings.DEMO_MODE,
        "environment": settings.ENVIRONMENT,
        "providers": providers
    })
