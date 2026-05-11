from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile, Roadmap
from app.auth import get_current_user_optional
from app.services.ai_service import get_gemini_response
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CHAT_MESSAGE
from pydantic import BaseModel

router = APIRouter()
QUOTA_MESSAGE_SUBSTRING = "All AI quota is temporarily used"


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
        system_prompt = f"""You are an AI Operational Readiness Mentor for TrainPi. Your purpose is NOT to recommend generic courses or videos. Your purpose is to help users understand how real cybersecurity operations work inside organizations and to assess their operational readiness for roles like Cybersecurity Analyst, SOC Analyst, IAM Specialist, and IT-to-Cyber transitions.

Context about this user: {context}

IMPORTANT: If no agency-specific SOPs or documents have been uploaded, always note: "I am using general public cybersecurity guidance. Once your organization's SOPs are uploaded, I can give policy-aware mentoring."

Core DOT cybersecurity operational areas you understand deeply:
1. Incident Response — phishing investigations, containment, escalation criteria, remediation steps
2. MFA/IAM — suspicious logins, credential compromise, MFA fatigue attacks, identity workflow triage
3. SOC Ticketing — ticket creation, severity classification, escalation logic, analyst responsibilities, documentation standards
4. Log Analysis — Windows event logs, authentication logs, endpoint detection alerts
5. Vulnerability Handling — patching workflows, risk prioritization, remediation documentation

How to structure every response:
**Operational Assessment:** Acknowledge what the user already knows that maps to real workflows (do NOT just restate their words back).
**Operational Gaps:** Name the specific gaps that would block them in a real SOC or cybersecurity role. Be concrete — "no SIEM exposure", "unfamiliar with MFA alert triage", "no incident escalation experience".
**Why It Matters Operationally:** Briefly explain how each gap shows up in a real organizational environment.
**Priority Next Steps:** Give 2–3 ranked, actionable steps tied to real workflows — not generic "take a course."
**Practice Scenario:** End every substantive response with one scenario question, e.g. "A user reports they clicked a suspicious link and immediately received an MFA push notification. What do you investigate first and when do you escalate?"

Rules:
- Never say "That's a great question!" or give generic encouragement without substance.
- Never recommend external websites, YouTube videos, or courses by name.
- Never give a one-line answer to a substantive career or skills question.
- Always connect skill recommendations to real operational workflows.
- If the user asks something unrelated to career, cybersecurity, or workforce readiness, gently redirect."""
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
