from apscheduler.schedulers.background import BackgroundScheduler
from app.core.logging import get_logger
from app.models.database import SessionLocal
from app.models.entities import Trip
from app.orchestrator.orchestrator import Orchestrator

logger = get_logger("scheduler")
scheduler: BackgroundScheduler = BackgroundScheduler()


def check_trips_job():
    logger.info("Executing scheduled periodic condition check on active trips")
    db = SessionLocal()
    try:
        active_trips = db.query(Trip).filter(Trip.status == "active").all()
        for trip in active_trips:
            try:
                events, replan_it = Orchestrator.check_conditions_and_replan(db, trip.id)
                if events:
                    logger.info(f"Scheduled check detected {len(events)} events for Trip {trip.id}")
            except Exception as e:
                logger.warning(f"Error checking conditions for Trip {trip.id}: {e}")
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_trips_job, "interval", minutes=60, id="periodic_condition_check", replace_existing=True)
        scheduler.start()
        logger.info("In-process APScheduler started (interval: 60 minutes)")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped")
