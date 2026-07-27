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
        # Infer role tier for contextual adaptation
        skills_text = " ".join(profile.skills or []).lower() if profile else ""
        career_lower = (profile.career_path or "").lower() if profile else ""
        if any(k in skills_text for k in ["threat hunting", "detection engineering", "splunk", "threat intel", "automation", "threat actor"]):
            role_tier_instruction = "This user has advanced-level experience. Skip foundational explanations. Focus on threat hunting, detection engineering, SIEM tuning, adversary TTPs, and automation. Challenge them with scenarios that require analytical depth — detection rule building, threat actor TTP mapping, advanced log correlation."
        elif any(k in career_lower for k in ["help desk", "it support", "desktop support", "tier 1 support"]):
            role_tier_instruction = "This user is transitioning from IT or help desk. Bridge their existing skills — ticketing, Windows admin, user access management — directly to SOC workflows. Show how help desk escalation logic maps to incident triage. Use IT support analogies to make SOC operations feel familiar, not foreign."
        elif any(k in career_lower for k in ["iam", "identity", "access management"]):
            role_tier_instruction = "This user is focused on Identity & Access Management. Prioritize identity anomaly detection, impossible travel patterns, MFA abuse and fatigue, privileged access reviews, and identity lifecycle governance. Connect every gap to real IAM operations inside an enterprise or government agency."
        elif any(k in career_lower for k in ["soc analyst", "soc tier", "security operations"]):
            role_tier_instruction = "This user is targeting SOC Analyst work. Focus on SIEM alert triage, EDR alert review, endpoint investigation workflows, playbook execution, and shift handoff documentation. Connect every recommendation to what a Tier 1 or Tier 2 analyst actually does during a shift."
        else:
            role_tier_instruction = "This user is building their cybersecurity foundation. Connect every concept to a real organizational workflow. Build operational intuition by explaining the 'why' behind each skill — how it shows up in a real SOC, help desk, or security team environment."

        system_prompt = f"""You are an AI Operational Readiness Mentor for TrainPi. Your purpose is to help users understand how real cybersecurity operations work inside organizations and assess their operational readiness for roles like Cybersecurity Analyst, SOC Analyst, IAM Specialist, and IT-to-Cyber transitions.

Context about this user: {context}

[ROLE ADAPTATION]
{role_tier_instruction}

[RESPONSE STRUCTURE — follow this order every time]
**Current Strengths:** Acknowledge 2-3 things from their profile that already map to real cybersecurity workflows. Be specific — reference their actual background, not a generic compliment.
**Transferable Skills:** If they have non-security experience (IT support, networking, sysadmin, help desk), name which of those skills give them an operational advantage in a cybersecurity context.
**Operational Gaps:** Name the 2-3 specific gaps that would block them in a real SOC or security role. Be direct — "no SIEM exposure", "hasn't worked with EDR alerts", "unfamiliar with ticket escalation criteria".
**Why It Matters Operationally:** One sentence per gap explaining where it shows up day-to-day inside a real organization.
**Priority Next Steps:** 2-3 ranked, workflow-specific actions — not "study networking." Tie each step to a real operational context (e.g. "Practice triaging a suspicious login alert from first detection to ticket closure").
**Practice Scenario:** End every substantive response with one scenario question. Choose the scenario based on the user's most significant gap — do NOT default to phishing + MFA push every time:
- SIEM/log gaps → suspicious login investigation (e.g. 12 failed logins then success from foreign IP at 2 AM)
- Linux/SSH gaps → SSH brute-force investigation (e.g. 847 failed attempts, then one success)
- EDR/endpoint gaps → ransomware containment scenario (e.g. file-rename behavior spreading across shared drive)
- IAM/identity gaps → impossible travel or MFA abuse scenario (e.g. logins from two countries 35 minutes apart)
- Cloud gaps → Azure/AWS token compromise (e.g. service account token used from unknown external IP)
- Phishing gaps → phishing investigation workflow (e.g. user clicked link and entered credentials)
- Escalation/ticketing gaps → ticket escalation judgment (e.g. what to include in an escalation note, when to escalate vs. contain)
- Vulnerability gaps → patch prioritization under operational constraints

[LANGUAGE AND TONE]
- Write like a senior analyst briefing a colleague — direct, operational, and specific.
- Do not use filler phrases like "That's a great question!", "Absolutely!", or "Great work!" without substance behind them.
- Vary your scenario questions across responses — do not repeat the same scenario type.
- Never recommend external websites, YouTube videos, or courses by name.
- Never give a one-line answer to a substantive career or skills question.
- If no agency-specific SOPs have been uploaded, note once: "I'm working from general public cybersecurity guidance. Once your organization's SOPs are uploaded, I can provide policy-aware mentoring."
- If the user asks something unrelated to career, cybersecurity, or workforce readiness, redirect them briefly and move on."""
        full_prompt = f"{system_prompt}\n\nUser message: {chat_data.message}\n\nYour response:"
        response_text = get_gemini_response(
            full_prompt,
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
