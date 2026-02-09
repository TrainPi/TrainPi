from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile, Roadmap
from app.auth import SECRET_KEY, ALGORITHM
from app.services.ai_service import get_gemini_response
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CHAT_MESSAGE
from pydantic import BaseModel
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
optional_bearer = HTTPBearer(auto_error=False)
QUOTA_MESSAGE_SUBSTRING = "All AI quota is temporarily used"


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Return current user if valid token present, else None (allows guest/bypass auth for chat)."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except JWTError:
        return None


class ChatMessage(BaseModel):
    message: str
    image: str | None = None


class ChatResponse(BaseModel):
    response: str
    credits_used: int = 0
    credits_remaining: int | None = None


@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_data: ChatMessage,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to use the AI Career Mentor and spend credits.",
        )

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    credits_remaining = current_user.credits or 0

    if not use_own_key:
        try:
            credits_remaining = deduct_credits(
                db,
                current_user.id,
                CREDITS_PER_CHAT_MESSAGE,
                "usage",
                "AI Career Mentor chat",
            )
        except HTTPException as e:
            if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="INSUFFICIENT_CREDITS",
                    headers={"X-Credits-Remaining": str(current_user.credits or 0)},
                )
            raise

    try:
        profile = db.query(CareerProfile).filter(CareerProfile.user_id == current_user.id).order_by(CareerProfile.created_at.desc()).first()
        roadmap = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.created_at.desc()).first()
        context_parts = [f"User: {current_user.full_name or current_user.email or 'Learner'}."]
        if profile:
            context_parts.append(f"Interested in: {profile.career_path}. Skills: {', '.join(profile.skills or [])}.")
        if roadmap:
            context_parts.append(f"Current Roadmap Step: {roadmap.current_step + 1}/{len(roadmap.steps) if roadmap.steps else '?'}.")
        context = " ".join(context_parts)
        system_prompt = f"""You are a warm, expert AI Career Mentor for TrainPi. You help people choose career paths, plan their learning, and reach their goals.

Context about this user: {context}

Answer in an open, natural way—like a thoughtful human mentor would:
- Be conversational and encouraging. It's fine to elaborate when it helps.
- When suggesting careers or options, name specific roles and briefly why they might fit (e.g. "Software Engineer — if you enjoy building products and coding").
- Use clear structure when useful: short paragraphs, bullet points, or numbered steps. You can use **bold** for role names or key terms.
- Don't limit yourself to one short sentence unless the question is trivial. Give a full, helpful answer.
- If they ask for career ideas, give 2–4 concrete paths with one-line reasons. If they ask for a plan, give actionable steps.
- Stay on topic (career, learning, skills, roadmap, job readiness) but be flexible and open to follow-up questions."""
        full_prompt = f"{system_prompt}\n\nUser message: {chat_data.message}\n\nYour response:"
        response_text = get_gemini_response(
            full_prompt,
            image_url=chat_data.image,
            user_api_key=current_user.gemini_api_key if use_own_key else None,
        )

        if not use_own_key and QUOTA_MESSAGE_SUBSTRING in (response_text or ""):
            credits_remaining = refund_credits(
                db, current_user.id, CREDITS_PER_CHAT_MESSAGE, "Refund: AI quota full"
            )
        return {
            "response": response_text,
            "credits_used": 0 if use_own_key else CREDITS_PER_CHAT_MESSAGE,
            "credits_remaining": credits_remaining,
        }
    except Exception as e:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_CHAT_MESSAGE, "Refund: error")
        print(f"Chat Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
