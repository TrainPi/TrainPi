"""
Credits: balance, Stripe Checkout (real purchase), webhook, and transaction history.
AI usage deducts credits from the user's balance (see ai_chat, career, roadmap).
Stripe is optional: install with `pip install stripe` and set STRIPE_SECRET_KEY for checkout.
"""
import os
try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_AVAILABLE = True
except ImportError:
    stripe = None
    STRIPE_AVAILABLE = False

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CreditTransaction
from app.schemas import CreditsBalance, CreditPurchaseRequest, CreditTransactionResponse, CheckoutSessionResponse, GeminiKeyRequest
from app.auth import get_current_user

router = APIRouter()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

# Cost in credits per action (used by ai_chat, career, roadmap, ai_features)
CREDITS_PER_CHAT_MESSAGE = 1
CREDITS_PER_CAREER_DISCOVER = 5
CREDITS_PER_ROADMAP_CREATE = 10
CREDITS_PER_LESSON_GENERATE = 5
CREDITS_PER_GAMIFIED_CHALLENGE = 3
CREDITS_PER_READINESS_FEEDBACK = 2
CREDITS_PER_PRACTICE_HINT = 1
CREDITS_PER_LEARNING_STYLE = 2
CREDITS_PER_TUTOR_RECOMMEND = 2
CREDITS_PER_QUIZ_GENERATE = 3

# Workforce Readiness (Exhibit A)
CREDITS_PER_WORKFORCE_PROFILE_ANALYZE = 5   # resume -> Participant Capability Profile extraction
CREDITS_PER_WORKFORCE_DOC_UPLOAD = 3        # per org document -> Operational Requirements extraction
CREDITS_PER_WORKFORCE_ANALYSIS = 10         # Step 3: full comparison engine
CREDITS_PER_WORKFORCE_ROADMAP = 8           # Step 5: roadmap generation


def deduct_credits(
    db: Session,
    user_id: int,
    amount: int,
    kind: str,
    description: str | None = None,
) -> int:
    """
    Deduct credits from user. Raises HTTP 402 if insufficient.
    Returns new balance after deduction.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    current = user.credits or 0
    if current < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="INSUFFICIENT_CREDITS",
            headers={"X-Credits-Remaining": str(current)},
        )
    user.credits = current - amount
    tx = CreditTransaction(user_id=user_id, amount=-amount, kind=kind, description=description)
    db.add(tx)
    db.commit()
    db.refresh(user)
    return user.credits


def refund_credits(
    db: Session,
    user_id: int,
    amount: int,
    description: str | None = "Refund (e.g. quota error)",
) -> int:
    """Add credits back (e.g. when Gemini quota failed after deducting). Returns new balance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return 0
    user.credits = (user.credits or 0) + amount
    tx = CreditTransaction(user_id=user_id, amount=amount, kind="refund", description=description)
    db.add(tx)
    db.commit()
    db.refresh(user)
    return user.credits


def user_key_or_deduct(
    db: Session,
    user: User,
    amount: int,
    kind: str,
    description: str | None = None,
) -> tuple[bool, str | None]:
    """
    Every AI-calling endpoint needs the same check: use the user's own Gemini
    key if they've set one (free, no credits touched), otherwise deduct
    credits from the shared app key's usage. deduct_credits already raises
    HTTPException(402, detail="INSUFFICIENT_CREDITS") on its own when the
    balance is too low, so callers don't need to catch/re-raise it — doing
    so around every call site was pure duplication that also dropped the
    X-Credits-Remaining header deduct_credits sets on that response.

    Returns (use_own_key, gemini_key_or_none).
    """
    gemini_key = user.gemini_api_key and user.gemini_api_key.strip()
    use_own_key = bool(gemini_key)
    if not use_own_key:
        deduct_credits(db, user.id, amount, kind, description)
    return use_own_key, (gemini_key or None)

# Credit packages: package_id -> credits, label, price in cents (USD)
CREDIT_PACKAGES = {
    "100": {"credits": 100, "label": "100 Credits", "price_cents": 499},
    "500": {"credits": 500, "label": "500 Credits", "price_cents": 1999},
    "1000": {"credits": 1000, "label": "1000 Credits", "price_cents": 3499},
    "2500": {"credits": 2500, "label": "2500 Credits", "price_cents": 7999},
}


@router.get("/balance", response_model=CreditsBalance)
def get_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return current user's credit balance."""
    return CreditsBalance(credits=current_user.credits or 0)


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    body: CreditPurchaseRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session for the selected credit package.
    Frontend redirects the user to the returned URL to complete payment.
    Credits are added via webhook when payment succeeds.
    """
    if not STRIPE_AVAILABLE or stripe is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not installed. Run: pip install stripe",
        )
    if not stripe.api_key or stripe.api_key.startswith("sk_test_your_"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY in .env",
        )
    pkg = CREDIT_PACKAGES.get(body.package_id)
    if not pkg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown package. Choose from: {list(CREDIT_PACKAGES.keys())}",
        )
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": pkg["price_cents"],
                        "product_data": {
                            "name": pkg["label"],
                            "description": f"TrainPi AI learning credits — {pkg['credits']} credits for chat, career discovery, and roadmap.",
                        },
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{FRONTEND_URL}/dashboard/credits?success=1&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/dashboard/credits?canceled=1",
            client_reference_id=str(current_user.id),
            customer_email=current_user.email,
            metadata={
                "package_id": body.package_id,
                "credits": str(pkg["credits"]),
                "user_id": str(current_user.id),
            },
        )
        return CheckoutSessionResponse(url=session.url)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe sends checkout.session.completed here. We add credits to the user.
    Must receive raw body for signature verification — do not use JSON body parser for this route.
    """
    if not STRIPE_AVAILABLE or stripe is None:
        return JSONResponse(content={"error": "Stripe not installed"}, status_code=503)
    if not STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET.startswith("whsec_your_"):
        return JSONResponse(content={"error": "Webhook secret not set"}, status_code=500)
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return JSONResponse(content={"error": "Invalid payload"}, status_code=400)
    except stripe.error.SignatureVerificationError as e:
        return JSONResponse(content={"error": "Invalid signature"}, status_code=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id_str = session.get("client_reference_id") or session.get("metadata", {}).get("user_id")
        credits_str = session.get("metadata", {}).get("credits")
        if not user_id_str or not credits_str:
            return JSONResponse(content={"error": "Missing user_id or credits in session"}, status_code=400)
        try:
            user_id = int(user_id_str)
            add_amount = int(credits_str)
        except (TypeError, ValueError):
            return JSONResponse(content={"error": "Invalid user_id or credits"}, status_code=400)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(content={"error": "User not found"}, status_code=404)
        user.credits = (user.credits or 0) + add_amount
        label = CREDIT_PACKAGES.get(session.get("metadata", {}).get("package_id", ""), {}).get("label", f"{add_amount} Credits")
        tx = CreditTransaction(user_id=user_id, amount=add_amount, kind="purchase", description=label)
        db.add(tx)
        db.commit()
    return JSONResponse(content={"received": True})


@router.put("/my-gemini-key", response_model=CreditsBalance)
def set_my_gemini_key(
    body: GeminiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set or clear your own Gemini API key from Google AI Studio.
    When set, your AI usage (chat, career discover, roadmap) uses your key and does not deduct TrainPi credits.
    Get a free key at https://aistudio.google.com/apikey
    """
    key = (body.api_key or "").strip()
    current_user.gemini_api_key = key if key else None
    db.commit()
    db.refresh(current_user)
    return CreditsBalance(credits=current_user.credits or 0)


class AnyKeyRequest(BaseModel):
    api_key: str | None = None

@router.put("/my-api-key")
def set_any_api_key(
    body: AnyKeyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Save a personal Gemini API key. Keys must start with 'AIza' (Google AI Studio format).
    """
    key = (body.api_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    if not key.startswith("AIza"):
        raise HTTPException(status_code=400, detail="Unrecognised key format. Gemini keys start with AIza")
    current_user.gemini_api_key = key
    db.commit()
    return {"provider": "Gemini", "saved": True, "credits": current_user.credits or 0}


@router.get("/history", response_model=list[CreditTransactionResponse])
def get_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return recent credit transactions for the current user."""
    rows = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return rows
