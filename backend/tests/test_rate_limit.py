"""
Per-user rate limiting (app/rate_limit.py) — verifies the in-memory fallback
path (no Redis configured in tests) actually blocks after max_requests and
returns 429 with a Retry-After header, and that limits are scoped per user.
"""
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

from app.rate_limit import rate_limit, _requests
from app.auth import get_current_user


@pytest.fixture(autouse=True)
def _clear_rate_limit_state():
    _requests.clear()
    yield
    _requests.clear()


def _build_limited_app(current_user):
    app = FastAPI()

    @app.get("/limited", dependencies=[Depends(rate_limit("test_endpoint", max_requests=3, window_seconds=60))])
    def limited():
        return {"ok": True}

    app.dependency_overrides[get_current_user] = lambda: current_user
    return TestClient(app)


def test_allows_requests_up_to_the_limit(make_user, db_session):
    user = make_user(email="rl1@example.com")
    client = _build_limited_app(user)

    for _ in range(3):
        resp = client.get("/limited")
        assert resp.status_code == 200


def test_blocks_the_request_after_the_limit(make_user, db_session):
    user = make_user(email="rl2@example.com")
    client = _build_limited_app(user)

    for _ in range(3):
        assert client.get("/limited").status_code == 200

    resp = client.get("/limited")
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers


def test_limit_is_scoped_per_user(make_user, db_session):
    user_a = make_user(email="rl3a@example.com")
    user_b = make_user(email="rl3b@example.com")

    client_a = _build_limited_app(user_a)
    for _ in range(3):
        assert client_a.get("/limited").status_code == 200
    assert client_a.get("/limited").status_code == 429

    # A different user hitting the same endpoint_key must not be blocked
    # by user_a's usage.
    client_b = _build_limited_app(user_b)
    assert client_b.get("/limited").status_code == 200
