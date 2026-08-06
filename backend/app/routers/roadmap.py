import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Roadmap, CareerProfile
from app.schemas import RoadmapCreate, RoadmapResponse
from app.auth import get_current_user
from app.routers.credits import refund_credits, user_key_or_deduct, CREDITS_PER_ROADMAP_CREATE
from typing import Any, List
import re

from app.services.ai_service import get_gemini_json_response
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
logger = logging.getLogger(__name__)


def _slugify(value: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return slug or 'guided-step'


def _sanitize_resources(step_title: str, resources: Any) -> list[dict[str, str]]:
    items = resources if isinstance(resources, list) else []
    sanitized: list[dict[str, str]] = []

    for index, resource in enumerate(items[:3], start=1):
        if isinstance(resource, dict):
            raw_name = str(resource.get('name') or resource.get('title') or '').strip()
        else:
            raw_name = str(resource or '').strip()

        name = raw_name or f'TrainPi guided lesson {index}'
        slug = _slugify(f'{step_title}-{name}')
        sanitized.append({
            'name': name,
            'url': f'trainpi://guided/{slug}',
        })

    if sanitized:
        return sanitized

    fallback_slug = _slugify(step_title)
    return [{
        'name': f'TrainPi guided lesson: {step_title}',
        'url': f'trainpi://guided/{fallback_slug}',
    }]


def _normalize_step(step_data: Any, index: int) -> dict[str, Any]:
    if not isinstance(step_data, dict):
        step_data = {}

    title = str(step_data.get('title') or f'Step {index + 1}').strip() or f'Step {index + 1}'
    description = str(step_data.get('description') or 'Continue progressing through this guided TrainPi step.').strip()
    estimated_time = str(step_data.get('estimated_time') or '1-2 weeks').strip()

    skills = step_data.get('skills')
    if not isinstance(skills, list):
        skills = []
    skills = [str(skill).strip() for skill in skills if str(skill).strip()]

    certifications = step_data.get('certifications')
    if not isinstance(certifications, list):
        certifications = []
    certifications = [str(certification).strip() for certification in certifications if str(certification).strip()]

    resources = _sanitize_resources(title, step_data.get('resources'))

    return {
        'step_number': index + 1,
        'title': title,
        'description': description,
        'skills': skills,
        'certifications': certifications,
        'estimated_time': estimated_time,
        'resources': resources,
    }


@router.post('/create', response_model=RoadmapResponse)
async def create_roadmap(
    roadmap_data: RoadmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    use_own_key, gemini_key = user_key_or_deduct(db, current_user, CREDITS_PER_ROADMAP_CREATE, 'usage', 'AI Roadmap Create')

    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()
    skills_context = f", Skills: {', '.join(profile.skills)}" if profile and profile.skills else ''
    interests_context = f", Interests: {', '.join(profile.interests)}" if profile and profile.interests else ''

    # Determine if this is a cybersecurity-related path for operational framing
    cyber_keywords = ['cyber', 'soc', 'security', 'analyst', 'iam', 'incident', 'infosec', 'it support', 'network']
    is_cyber_path = any(kw in roadmap_data.career_path.lower() for kw in cyber_keywords)

    if is_cyber_path:
        operational_progression = """
The roadmap must follow an OPERATIONAL READINESS progression specific to cybersecurity:
1. SOC Environment Orientation — how security teams are structured, analyst responsibilities, ticketing systems
2. Endpoint & Log Fundamentals — Windows event logs, authentication logs, basic SIEM navigation
3. Phishing Investigation Workflow — email header analysis, IOC identification, user communication, containment
4. MFA & IAM Concepts — identity lifecycle, suspicious login triage, MFA fatigue attacks, credential compromise response
5. Ticket Triage & Escalation — severity classification, escalation criteria, analyst-to-analyst handoff, documentation standards
6. Incident Response Process — detection, containment, eradication, recovery, post-incident documentation
7. Vulnerability & Patch Workflow — CVE prioritization, patch deployment concepts, risk acceptance, remediation tracking
8. Operational Readiness Assessment — scenario-based evaluation, readiness indicators, next-role preparation

Each step MUST explain: (1) what this looks like inside a real organization, (2) what an analyst actually does during this workflow, (3) what gaps this closes operationally.
"""
    else:
        operational_progression = """
The roadmap must follow a logical operational progression:
Foundational Concepts -> Core Technical Skills -> Applied Practice -> Real-world Workflows -> Job Readiness
Each step must explain what the skill means in a real work environment, not just as an abstract concept.
"""

    prompt = f"""Create a highly detailed, operationally-grounded learning roadmap for a career in {roadmap_data.career_path}.
    User Context: {skills_context}{interests_context}.

    {operational_progression}

    Return a strictly valid JSON object with a single 'steps' key containing a list of steps.
    Each step must have:
    - 'step_number' (int)
    - 'title' (str): Short, operational, and role-specific (e.g. "Phishing Investigation Workflow" not "Learn Security Basics").
    - 'description' (str): 4-5 sentences covering: what this step covers operationally, what an analyst/professional does in this area, why this skill gap matters in a real organization, and what the learner will be able to do after completing it.
    - 'skills' (list of str): 4-6 specific operational skills (e.g. "MFA alert triage", "incident ticket documentation", not just "security").
    - 'certifications' (list of str): 1-2 recognized industry certifications relevant to this step.
    - 'estimated_time' (str): realistic estimate.
    - 'resources' (list of dicts): Provide 2-3 internal TrainPi guided lesson references only.
      Format: {{ "name": "Guided lesson title", "url": "trainpi://guided/slug" }}

    Important rules:
    - Do not include Google, YouTube, Coursera, Udemy, or any external website.
    - Do not tell the learner to leave TrainPi.
    - Every step description must reference real organizational workflows, not abstract learning goals.
    - Keep the experience self-contained so each step becomes an internal operational lesson.

    Generate 7-9 comprehensive steps. Ensure the JSON is properly formatted and valid."""

    try:
        data = get_gemini_json_response(prompt, user_api_key=gemini_key)
        raw_steps = data.get('steps', []) if isinstance(data, dict) else []
        steps_data = [_normalize_step(step, index) for index, step in enumerate(raw_steps)]
    except Exception as e:
        logger.warning('AI Generation Error: %s', e)
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_ROADMAP_CREATE, 'Refund: AI roadmap failed')
        steps_data = []

    if not steps_data:
        steps_data = [_normalize_step({
            'title': f'Welcome to {roadmap_data.career_path}',
            'description': 'TrainPi could not generate the full roadmap right now. Start with this guided step and regenerate later if needed.',
            'skills': [],
            'certifications': [],
            'estimated_time': 'TBD',
            'resources': [],
        }, 0)]

    roadmap = Roadmap(
        user_id=current_user.id,
        career_path=roadmap_data.career_path,
        steps=steps_data,
        current_step=0,
        completion_percentage=0.0
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap


@router.get('/my-roadmap', response_model=RoadmapResponse)
def get_my_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id
    ).order_by(Roadmap.created_at.desc()).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail='Roadmap not found')

    return roadmap


@router.get('/get/{roadmap_id}', response_model=RoadmapResponse)
def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail='Roadmap not found')

    return roadmap


@router.get('/all', response_model=List[RoadmapResponse])
def get_all_roadmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id
    ).order_by(Roadmap.created_at.desc()).all()
    return roadmaps


@router.post('/update-progress/{roadmap_id}')
def update_roadmap_progress(
    roadmap_id: int,
    step_number: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail='Roadmap not found')

    total_steps = len(roadmap.steps) if roadmap.steps else 1
    completed = min(max(0, step_number), total_steps)
    roadmap.current_step = completed
    roadmap.completion_percentage = round((completed / total_steps) * 100, 1)

    db.commit()
    db.refresh(roadmap)
    return {'message': 'Progress updated', 'completion_percentage': roadmap.completion_percentage, 'current_step': completed}
