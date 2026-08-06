"""
Shared pytest fixtures: an isolated in-memory SQLite DB per test (so tests
never touch the real Neon database) and a TestClient with auth wired to a
fixture user via dependency_overrides.
"""
import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db, get_db_read
from app.main import app
from app.models import User
from app.auth import get_current_user, get_password_hash


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def make_user(db_session):
    def _make_user(email="user@example.com", credits=100, is_platform_admin=False):
        user = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name="Test User",
            credits=credits,
            is_platform_admin=is_platform_admin,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user
    return _make_user


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    # get_db_read (used by admin readiness-summary/ai-interactions) points
    # at a separate replica-routed session in production; tests need it
    # pinned to the same isolated in-memory DB as get_db.
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_read] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_db_read, None)
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def auth_as(client):
    """Call auth_as(user) inside a test to make subsequent client requests
    authenticate as that user."""
    def _auth_as(user):
        app.dependency_overrides[get_current_user] = lambda: user
        return client
    return _auth_as
