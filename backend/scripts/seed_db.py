import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import hash_password
from app.models.database import SessionLocal, init_db
from app.models.entities import Trip, User
from app.orchestrator.orchestrator import Orchestrator
from app.repositories.entities import ExpenseRepository
from app.repositories.trips import TripRepository
from app.repositories.users import UserRepository
from app.services.catalog import CatalogService


def seed_database():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        print("Loading catalog places into database...")
        CatalogService.load_seed_to_db(db)

        # Create demo user
        user_repo = UserRepository(db)
        demo_email = "demo@tripplanner.ai"
        user = user_repo.get_by_email(demo_email)
        if not user:
            print(f"Creating demo user: {demo_email}")
            user = user_repo.create(
                email=demo_email,
                password_hash=hash_password("demopass123"),
                display_name="Demo Traveler"
            )
        else:
            print(f"Demo user already exists (id={user.id})")

        # Create pre-generated demo trip for Goa if none exists
        trip_repo = TripRepository(db)
        existing_trips = trip_repo.list_by_user(user.id)
        if not existing_trips:
            print("Creating pre-generated demo trip: 'Goa Escape'...")
            trip = trip_repo.create(
                user_id=user.id,
                title="Goa Escape (Demo)",
                destination_id="dest_goa",
                start_date="2026-11-20",
                end_date="2026-11-23",
                num_days=4,
                mode="demo"
            )

            print("Generating initial itinerary v1...")
            itinerary, trace, alts = Orchestrator.generate_trip(db, trip.id)
            print(f"Generated Itinerary v1 with {len(itinerary.days)} days.")

            # Log sample expenses for analytics demo (Deliverable 25)
            exp_repo = ExpenseRepository(db)
            exp_repo.create(trip.id, "food", 850, "day_1", "Dinner at The Fisherman's Wharf")
            exp_repo.create(trip.id, "transport", 380, "day_1", "Airport to Candolim taxi")
            exp_repo.create(trip.id, "activities", 100, "day_2", "Fort Aguada entry")
            print("Logged sample demo expenses.")

        print("Database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
