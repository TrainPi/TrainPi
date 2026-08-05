import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile
from app.schemas import CareerInterestRequest, CareerMatch, CareerProfileResponse, CareerSelectRequest
from app.auth import get_current_user
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CAREER_DISCOVER
from typing import List
from app.services.ai_service import get_gemini_json_response

router = APIRouter()
logger = logging.getLogger(__name__)

CYBER_ROLE_PROFILES = """
Known cybersecurity role profiles with operational context:

1. Cybersecurity Analyst
   - Daily workflows: monitoring SIEM alerts, investigating phishing emails, reviewing endpoint detections, triaging tickets, documenting incidents
   - Required operational skills: log analysis, MFA/IAM alert triage, incident documentation, threat indicator identification, escalation judgment
   - Readiness indicators: can describe what happens after a user clicks a phishing link; understands ticket severity levels; knows when to escalate vs. contain

2. SOC Analyst (Tier 1/2)
   - Daily workflows: alert queue triage, false positive identification, suspicious login investigation, malware containment, shift handoff documentation
   - Required operational skills: SIEM navigation, EDR alert review, network traffic basics, Windows event log reading, playbook execution
   - Readiness indicators: can walk through a phishing investigation end-to-end; understands SOC shift structure; knows escalation criteria

3. IT Support to Cyber Transition
   - Existing strengths to leverage: help desk ticketing, Windows administration, user access management, hardware/software troubleshooting
   - Operational gaps to close: SIEM familiarity, threat hunting basics, security-specific ticket triage, incident response concepts
   - Bridge path: use IT support experience as context for understanding SOC workflows, then layer security-specific skills

4. IAM Specialist (Identity & Access Management)
   - Daily workflows: provisioning/deprovisioning user accounts, reviewing access anomalies, MFA enrollment management, privileged access reviews, identity governance reporting
   - Required operational skills: Active Directory/Entra ID, conditional access policies, MFA administration, access review workflows, role-based access control
   - Readiness indicators: understands least-privilege principles; can investigate a suspicious login alert; knows identity lifecycle stages

5. AI Business Analyst (Cybersecurity Focus)
   - Daily workflows: requirements gathering from security teams, documenting AI tool use cases, translating operational needs into technical requirements, process mapping
   - Required operational skills: business process documentation, stakeholder communication, security workflow understanding, AI tool evaluation
   - Readiness indicators: can document a security workflow end-to-end; understands how AI tools assist SOC operations
"""


def get_ai_career_matches(interests: List[str], skills: List[str], user_api_key: str | None = None) -> List[CareerMatch]:
    prompt = f"""You are an Operational Readiness Career Advisor for TrainPi. Match the user to cybersecurity and technology career paths based on their profile, with a focus on operational readiness and real workforce fit.

User Profile:
Interests: {', '.join(interests) if interests else 'Not specified'}
Skills: {', '.join(skills) if skills else 'Not specified'}

{CYBER_ROLE_PROFILES}

Based on the user's interests and skills, suggest 3 career paths. Prioritize cybersecurity operational roles when the profile shows any security, IT, networking, or analytical background. For each match, assess operational fit — not just keyword overlap.

Return a valid JSON object with a key 'matches' containing a list of objects.
Each object must have:
- 'career_path' (str): Specific role name (e.g. "Cybersecurity Analyst", "SOC Analyst", "IAM Specialist", "IT Support to Cyber Transition")
- 'match_score' (int, 0-100): Based on genuine operational fit, not just keyword matching
- 'salary_range' (str, e.g. "$65k - $95k")
- 'growth_outlook' (str, e.g. "32% growth — high demand in federal and enterprise sectors")
- 'required_skills' (list of str): 4-6 specific operational skills needed for this role
- 'job_titles' (list of str): 3-4 real job titles that map to this path
"""
    try:
        data = get_gemini_json_response(prompt, user_api_key=user_api_key)
        matches_data = data.get("matches", [])
        return [CareerMatch(**m) for m in matches_data]
    except Exception as e:
        logger.warning("AI Match Error: %s", e)
        return []

@router.post("/discover", response_model=List[CareerMatch])
def discover_careers(
    request: CareerInterestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(
                db,
                current_user.id,
                CREDITS_PER_CAREER_DISCOVER,
                "usage",
                "AI Career Discover",
            )
        except HTTPException as e:
            if e.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="INSUFFICIENT_CREDITS",
                )
            raise

    profile = CareerProfile(
        user_id=current_user.id,
        interests=request.interests,
        skills=request.skills
    )
    db.add(profile)
    db.commit()

    matches = get_ai_career_matches(request.interests, request.skills, user_api_key=current_user.gemini_api_key if use_own_key else None)
    if not use_own_key and not matches:
        refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: AI career discover failed")
    return matches


@router.post("/select")
def select_career(
    request: CareerSelectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Update user's selected career path or create new profile
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    
    if profile:
        profile.career_path = request.career_path
    else:
        profile = CareerProfile(
            user_id=current_user.id,
            career_path=request.career_path,
            interests=[],
            skills=[]
        )
        db.add(profile)
    
    db.commit()
    
    return {"message": f"Career path {request.career_path} selected"}

@router.get("/profile", response_model=CareerProfileResponse)
def get_career_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Career profile not found")
    
    return profile

