import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.database import Base, get_db
from app.models.entities import User
from app.repositories.users import UserRepository
from app.services.catalog import CatalogService

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def init_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    CatalogService.load_seed_to_db(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_user(db_session):
    user_repo = UserRepository(db_session)
    user = user_repo.create(
        email="testuser@example.com",
        password_hash=hash_password("password123"),
        display_name="Test Explorer"
    )
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture
def other_user(db_session):
    user_repo = UserRepository(db_session)
    user = user_repo.create(
        email="other@example.com",
        password_hash=hash_password("password123"),
        display_name="Other User"
    )
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"user": user, "token": token, "headers": {"Authorization": f"Bearer {token}"}}
