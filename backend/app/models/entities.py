from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.models.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    interests = Column(JSON, default=list)  # ["beaches", "heritage", "food"]
    pace = Column(String(50), default="relaxed")  # "relaxed", "balanced", "packed"
    budget_level = Column(String(50), default="mid")  # "budget", "mid", "luxury"
    transport_modes = Column(JSON, default=lambda: ["taxi", "walk"])
    accommodation_type = Column(String(50), default="hotel")
    dietary = Column(JSON, default=list)  # ["vegetarian", "no_beef"]
    avoid = Column(JSON, default=list)  # ["nightclubs", "crowds"]
    mobility = Column(String(50), default="standard")
    home_city = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="preferences")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    destination_id = Column(String(50), nullable=False, index=True)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)    # YYYY-MM-DD
    num_days = Column(Integer, nullable=False)
    budget = Column(Integer, nullable=False, default=30000)  # User's total budget in INR
    adults = Column(Integer, nullable=False, default=2)
    children = Column(Integer, nullable=False, default=0)
    status = Column(String(50), default="active")   # draft, active, completed
    current_version = Column(Integer, default=0)
    mode = Column(String(50), default="live")       # live, demo, replay
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="trips")
    versions = relationship("ItineraryVersion", back_populates="trip", cascade="all, delete-orphan", order_by="ItineraryVersion.version")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    shares = relationship("TripShare", back_populates="trip", cascade="all, delete-orphan")
    events = relationship("TravelEvent", back_populates="trip", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="trip", cascade="all, delete-orphan", order_by="ChatMessage.id")


class ItineraryVersion(Base):
    __tablename__ = "itinerary_versions"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False, index=True)
    parent_version = Column(Integer, nullable=True)
    json = Column(JSON, nullable=False)  # Full canonical itinerary JSON snapshot
    created_by = Column(String(100), nullable=False)  # "planner_agent", "replanner_agent", "baseline_planner", "user_edit", "revert"
    change_summary = Column(Text, nullable=False)
    change_set_json = Column(JSON, nullable=True)  # Typed ops applied to reach this version
    created_at = Column(DateTime, default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="versions")

    __table_args__ = (
        Index("idx_trip_version", "trip_id", "version", unique=True),
    )


class Place(Base):
    __tablename__ = "places"

    id = Column(String(100), primary_key=True)  # e.g. poi_goa_basilica
    destination_id = Column(String(50), nullable=False, index=True)
    kind = Column(String(50), nullable=False, index=True)  # attraction, restaurant, hotel
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    tags = Column(JSON, default=list)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    cost_amount = Column(Integer, default=0)  # INR
    cost_per = Column(String(50), default="person")  # person, group
    duration_min = Column(Integer, default=60)
    open_from = Column(String(10), default="09:00")
    open_to = Column(String(10), default="18:00")
    closed_days = Column(JSON, default=list)  # ["Monday"]
    indoor = Column(Boolean, default=False)
    rating = Column(Float, default=4.5)
    description = Column(Text, default="")
    source = Column(String(50), default="catalog")
    verified = Column(Boolean, default=True)
    booking_url = Column(String(500), nullable=True)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    day_id = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)  # accommodation, transport, food, activities, misc
    amount = Column(Integer, nullable=False)  # INR
    note = Column(String(255), nullable=True)
    spent_at = Column(DateTime, default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="expenses")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)  # weather_alert, itinerary_change, budget_warning, reminder
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    severity = Column(String(50), default="info")  # info, warning, high
    read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    due_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="notifications")


class TripShare(Base):
    __tablename__ = "trip_shares"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    version_pinned = Column(Integer, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="shares")


class TravelEvent(Base):
    __tablename__ = "travel_events"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # weather, budget, closure, transport
    day_id = Column(String(50), nullable=True)
    severity = Column(String(50), default="medium")  # low, medium, high
    payload = Column(JSON, default=dict)
    source = Column(String(50), default="simulated")  # live, simulated, system
    handled_version = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="events")


class ApiCache(Base):
    __tablename__ = "api_cache"

    key = Column(String(255), primary_key=True)
    provider = Column(String(50), nullable=False, index=True)  # weather, osrm, nominatim, llm
    value_json = Column(JSON, nullable=False)
    fetched_at = Column(DateTime, default=utcnow, nullable=False)
    ttl_seconds = Column(Integer, default=86400)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)  # answer, modify, regenerate, clarify
    version_before = Column(Integer, nullable=True)
    version_after = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    trip = relationship("Trip", back_populates="chat_messages")
