"""
Credit deduct/refund is the cost-control mechanism gating every AI feature
in the app — every workforce/career/roadmap endpoint relies on this behaving
correctly. This was previously only verified manually (per the audit); these
tests make that reproducible.
"""
from fastapi import HTTPException
import pytest

from app.routers.credits import deduct_credits, refund_credits
from app.models import CreditTransaction


def test_deduct_credits_reduces_balance_and_logs_transaction(db_session, make_user):
    user = make_user(credits=100)

    new_balance = deduct_credits(db_session, user.id, 30, "usage", "Test Feature")

    assert new_balance == 70
    db_session.refresh(user)
    assert user.credits == 70

    tx = db_session.query(CreditTransaction).filter(CreditTransaction.user_id == user.id).one()
    assert tx.amount == -30
    assert tx.kind == "usage"
    assert tx.description == "Test Feature"


def test_deduct_credits_raises_402_when_insufficient(db_session, make_user):
    user = make_user(credits=10)

    with pytest.raises(HTTPException) as exc_info:
        deduct_credits(db_session, user.id, 50, "usage", "Too Expensive Feature")

    assert exc_info.value.status_code == 402
    assert exc_info.value.detail == "INSUFFICIENT_CREDITS"
    # Balance must be unchanged on a rejected deduction
    db_session.refresh(user)
    assert user.credits == 10


def test_deduct_credits_exact_balance_succeeds(db_session, make_user):
    user = make_user(credits=25)

    new_balance = deduct_credits(db_session, user.id, 25, "usage", "Exact Balance Feature")

    assert new_balance == 0


def test_refund_credits_restores_balance_and_logs_transaction(db_session, make_user):
    user = make_user(credits=50)
    deduct_credits(db_session, user.id, 20, "usage", "Feature That Will Fail")

    new_balance = refund_credits(db_session, user.id, 20, "Refund: AI call failed")

    assert new_balance == 50
    db_session.refresh(user)
    assert user.credits == 50

    refund_tx = (
        db_session.query(CreditTransaction)
        .filter(CreditTransaction.user_id == user.id, CreditTransaction.kind == "refund")
        .one()
    )
    assert refund_tx.amount == 20
    assert refund_tx.description == "Refund: AI call failed"


def test_refund_credits_on_unknown_user_is_a_noop(db_session):
    result = refund_credits(db_session, user_id=999999, amount=10)
    assert result == 0
