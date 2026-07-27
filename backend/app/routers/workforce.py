"""
Workforce Readiness (Exhibit A) — operational workforce readiness platform.

Five-step flow:
  1. Participant Profile        — resume + skills -> Participant Capability Profile
  2. Operational Context        — org documents -> Operational Requirements Profile (per doc)
  3. AI Analysis & Comparison   — compare both profiles -> readiness scores + gaps
  4. Results & Insights         — read the persisted WorkforceAnalysis
  5. Roadmap & Pathway          — AI-generated phased roadmap from the analysis

Kept separate from career.py/resume.py/roadmap.py, which power the individual
career-guidance flow (different models, different tables).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import (
    User,
    WorkforceProfile,
    OrganizationDocument,
    WorkforceAnalysis,
    WorkforceRoadmap,
)
from app.schemas import (
    WorkforceProfileUpdate,
    WorkforceProfileResponse,
    OrganizationDocumentResponse,
    WorkforceAnalysisResponse,
    WorkforceRoadmapResponse,
)
from app.auth import get_current_user
from app.rate_limit import rate_limit
from app.services.report_service import (
    build_analysis_report_html,
    build_roadmap_report_html,
    html_to_pdf_bytes,
)
from app.routers.credits import (
    deduct_credits,
    refund_credits,
    CREDITS_PER_WORKFORCE_PROFILE_ANALYZE,
    CREDITS_PER_WORKFORCE_DOC_UPLOAD,
    CREDITS_PER_WORKFORCE_ANALYSIS,
    CREDITS_PER_WORKFORCE_ROADMAP,
)
from app.routers.resume import extract_text_from_file, MAX_RESUME_SIZE
from app.services.ai_service import get_gemini_json_response, get_gemini_json_response_with_image

router = APIRouter()

CATEGORY_LABELS = {
    "sop": "SOPs & Policies",
    "workflow": "Workflows & Processes",
    "role": "Role Descriptions",
    "mission": "Mission & Objectives",
    "skill_framework": "Skill Frameworks",
    "other": "Other Supporting Docs",
}
VALID_CATEGORIES = set(CATEGORY_LABELS.keys())
MAX_DOC_SIZE = 25 * 1024 * 1024  # 25 MB, per Exhibit A


def _get_or_create_profile(db: Session, user_id: int) -> WorkforceProfile:
    profile = (
        db.query(WorkforceProfile)
        .filter(WorkforceProfile.user_id == user_id)
        .order_by(WorkforceProfile.created_at.desc())
        .first()
    )
    if not profile:
        profile = WorkforceProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# ──────────────────────────────────────────────────────────────────────────
# Step 1 — Participant Profile
# ──────────────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=WorkforceProfileResponse)
def get_workforce_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(db, current_user.id)
    return profile


@router.put("/profile", response_model=WorkforceProfileResponse)
def update_workforce_profile(
    body: WorkforceProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(db, current_user.id)
    profile.current_job_title = body.current_job_title
    profile.years_experience = body.years_experience
    profile.primary_skills = body.primary_skills
    profile.additional_notes = body.additional_notes
    db.commit()
    db.refresh(profile)
    return profile


def _build_participant_extraction_prompt(profile: WorkforceProfile, resume_text: str) -> str:
    skills_line = ", ".join(profile.primary_skills or []) or "None entered"
    return f"""You are an Operational Workforce Readiness Analyst for TrainPi. Extract a structured Participant Capability Profile from the resume and form data below.

Current job title: {profile.current_job_title or "Not provided"}
Years of experience: {profile.years_experience or "Not provided"}
Primary skills (self-reported): {skills_line}
Additional notes: {profile.additional_notes or "None"}

Resume text:
{resume_text[:8000] if resume_text else "No resume uploaded — base extraction on form data only."}

Return ONLY valid JSON in this exact structure:
{{
  "work_history": ["Company/Role summary line 1", "..."],
  "skills": ["skill1", "skill2", ...],
  "certifications": ["cert1", ...],
  "tools": ["tool/platform 1", ...],
  "years_experience": "normalized estimate, e.g. '3-5 years'",
  "strengths": ["Specific strength that maps to a real workflow"],
  "missing_or_unclear_skills": ["Specific gap or ambiguity in what they've shown"]
}}

Rules:
- Base extraction on both the resume text and form data; do not invent employers or dates not present in either.
- strengths must reference actual workflow relevance, not just repeat the skill list.
- If no resume was uploaded, extract what you can from job title/skills/notes and leave gaps honestly reflected in missing_or_unclear_skills."""


@router.post(
    "/profile/upload-resume",
    response_model=WorkforceProfileResponse,
    dependencies=[Depends(rate_limit("workforce_upload_resume", max_requests=5, window_seconds=60))],
)
async def upload_workforce_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload resume for the Participant Profile, extract text, and run AI extraction
    into a structured Participant Capability Profile (Exhibit A step 1 output)."""
    content = await file.read()
    if len(content) > MAX_RESUME_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum resume size is 10 MB.")
    resume_text = extract_text_from_file(file.filename or "", content)

    profile = _get_or_create_profile(db, current_user.id)
    profile.resume_filename = file.filename
    profile.resume_text = resume_text
    db.commit()

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_WORKFORCE_PROFILE_ANALYZE, "usage", "Workforce Profile Extraction")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise

    prompt = _build_participant_extraction_prompt(profile, resume_text)
    result = get_gemini_json_response(
        prompt,
        user_api_key=current_user.gemini_api_key if use_own_key else None,
    )

    if not result or "error" in result:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_WORKFORCE_PROFILE_ANALYZE, "Refund: workforce profile extraction failed")
    else:
        profile.extracted_work_history = result.get("work_history", []) or []
        profile.extracted_skills = result.get("skills", []) or []
        profile.extracted_certifications = result.get("certifications", []) or []
        profile.extracted_tools = result.get("tools", []) or []
        profile.extracted_years_experience = result.get("years_experience")
        profile.extracted_strengths = result.get("strengths", []) or []
        profile.extracted_missing_skills = result.get("missing_or_unclear_skills", []) or []
        db.commit()

    db.refresh(profile)
    return profile


# ──────────────────────────────────────────────────────────────────────────
# Step 2 — Operational Context Ingestion
# ──────────────────────────────────────────────────────────────────────────

def _build_org_document_extraction_prompt(category_label: str, doc_text: str) -> str:
    return f"""You are an Operational Workforce Readiness Analyst for TrainPi. Extract structured operational requirements from this organizational document so it can later be compared against a participant's capability profile.

Document category (as uploaded): {category_label}

Document text:
{doc_text[:8000]}

Return ONLY valid JSON in this exact structure:
{{
  "document_type": "Specific classification, e.g. 'Incident Response SOP', 'SOC Analyst Role Description', 'Agency Mission Statement'",
  "requirements": ["Specific operational requirement 1", "..."],
  "skills": ["Required skill 1", "..."],
  "workflows": ["Named workflow or process step 1", "..."],
  "role_expectations": ["Specific responsibility or expectation 1", "..."],
  "keywords": ["Important term 1", "..."],
  "tools": ["Required tool/platform 1", "..."],
  "compliance_requirements": ["Compliance/policy expectation 1", "..."],
  "mission_objectives": ["Mission or strategic objective 1, if present", "..."]
}}

Rules:
- Only extract what is actually present or clearly implied in the text — do not invent requirements.
- Fields that don't apply to this document type should be an empty list, not omitted.
- keywords should be specific technical/operational terms, not generic words."""


def _build_org_document_image_extraction_prompt(category_label: str) -> str:
    """Same extraction task as the text prompt, but for a photographed/scanned
    image with no separate OCR step — Gemini reads the image directly."""
    return f"""You are an Operational Workforce Readiness Analyst for TrainPi. This image is an organizational document (a photo or scan of a workflow diagram, SOP, role description, or similar). Read the text and any diagram structure visible in the image, then extract structured operational requirements so it can later be compared against a participant's capability profile.

Document category (as uploaded): {category_label}

Return ONLY valid JSON in this exact structure:
{{
  "document_type": "Specific classification, e.g. 'Incident Response SOP', 'SOC Analyst Role Description', 'Agency Mission Statement'",
  "requirements": ["Specific operational requirement 1", "..."],
  "skills": ["Required skill 1", "..."],
  "workflows": ["Named workflow or process step 1", "..."],
  "role_expectations": ["Specific responsibility or expectation 1", "..."],
  "keywords": ["Important term 1", "..."],
  "tools": ["Required tool/platform 1", "..."],
  "compliance_requirements": ["Compliance/policy expectation 1", "..."],
  "mission_objectives": ["Mission or strategic objective 1, if present", "..."]
}}

Rules:
- Only extract what is actually visible or clearly implied in the image — do not invent requirements.
- If the image contains a workflow/process diagram, describe each step in extracted_workflows in the order shown.
- Fields that don't apply to this document type should be an empty list, not omitted.
- keywords should be specific technical/operational terms, not generic words.
- If the image is unreadable or contains no relevant text/diagram, return empty lists for all fields rather than guessing."""


@router.post(
    "/context/upload",
    response_model=OrganizationDocumentResponse,
    dependencies=[Depends(rate_limit("workforce_context_upload", max_requests=15, window_seconds=60))],
)
async def upload_organization_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload one operational context document and run AI extraction (classify +
    extract requirements/skills/workflows/roles/tools/compliance/mission).
    PDF/DOCX/TXT go through text extraction; PNG/JPG go straight to Gemini's
    native image understanding (no separate OCR step)."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {sorted(VALID_CATEGORIES)}")

    filename_lower = (file.filename or "").lower()
    is_image = filename_lower.endswith((".png", ".jpg", ".jpeg"))

    content = await file.read()
    if len(content) > MAX_DOC_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum document size is 25 MB.")
    size_kb = max(1, round(len(content) / 1024))

    doc_text = None if is_image else extract_text_from_file(file.filename or "", content, max_chars=15000)

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_WORKFORCE_DOC_UPLOAD, "usage", f"Workforce Document Upload: {file.filename}")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise

    if is_image:
        mime_type = "image/jpeg" if filename_lower.endswith((".jpg", ".jpeg")) else "image/png"
        prompt = _build_org_document_image_extraction_prompt(CATEGORY_LABELS[category])
        result = get_gemini_json_response_with_image(
            prompt,
            image_bytes=content,
            image_mime_type=mime_type,
            user_api_key=current_user.gemini_api_key if use_own_key else None,
        )
    else:
        prompt = _build_org_document_extraction_prompt(CATEGORY_LABELS[category], doc_text)
        result = get_gemini_json_response(
            prompt,
            user_api_key=current_user.gemini_api_key if use_own_key else None,
        )

    if not result or "error" in result:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_WORKFORCE_DOC_UPLOAD, "Refund: document extraction failed")
        result = {}

    doc = OrganizationDocument(
        user_id=current_user.id,
        name=file.filename or "document",
        category=category,
        document_type=result.get("document_type"),
        size_kb=size_kb,
        parsed_text=doc_text,  # None for images — there is no separate extracted-text layer
        extracted_requirements=result.get("requirements", []) or [],
        extracted_skills=result.get("skills", []) or [],
        extracted_workflows=result.get("workflows", []) or [],
        extracted_role_expectations=result.get("role_expectations", []) or [],
        extracted_keywords=result.get("keywords", []) or [],
        extracted_tools=result.get("tools", []) or [],
        extracted_compliance_requirements=result.get("compliance_requirements", []) or [],
        extracted_mission_objectives=result.get("mission_objectives", []) or [],
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/context", response_model=List[OrganizationDocumentResponse])
def list_organization_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(OrganizationDocument)
        .filter(OrganizationDocument.user_id == current_user.id)
        .order_by(OrganizationDocument.uploaded_at.desc())
        .all()
    )


@router.delete("/context/{doc_id}")
def delete_organization_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(OrganizationDocument)
        .filter(OrganizationDocument.id == doc_id, OrganizationDocument.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


# ──────────────────────────────────────────────────────────────────────────
# Step 3/4 — AI Analysis & Comparison Engine / Results & Insights
# ──────────────────────────────────────────────────────────────────────────

def _build_comparison_prompt(profile: WorkforceProfile, docs: List[OrganizationDocument]) -> str:
    participant_block = f"""Participant Capability Profile:
- Current job title: {profile.current_job_title or "Not provided"}
- Years of experience: {profile.extracted_years_experience or profile.years_experience or "Not provided"}
- Skills: {", ".join((profile.extracted_skills or profile.primary_skills or [])) or "None"}
- Certifications: {", ".join(profile.extracted_certifications or []) or "None"}
- Tools used: {", ".join(profile.extracted_tools or []) or "None"}
- Strengths: {", ".join(profile.extracted_strengths or []) or "None"}
- Known gaps/unclear areas: {", ".join(profile.extracted_missing_skills or []) or "None"}
- Additional notes: {profile.additional_notes or "None"}"""

    if docs:
        org_lines = []
        for d in docs:
            org_lines.append(f"""Document: {d.name} ({CATEGORY_LABELS.get(d.category, d.category)}, classified as: {d.document_type or "Unclassified"})
  Requirements: {", ".join(d.extracted_requirements or []) or "None"}
  Required skills: {", ".join(d.extracted_skills or []) or "None"}
  Workflows: {", ".join(d.extracted_workflows or []) or "None"}
  Role expectations: {", ".join(d.extracted_role_expectations or []) or "None"}
  Required tools: {", ".join(d.extracted_tools or []) or "None"}
  Compliance requirements: {", ".join(d.extracted_compliance_requirements or []) or "None"}
  Mission objectives: {", ".join(d.extracted_mission_objectives or []) or "None"}""")
        org_block = "Agency Operational Requirements Profile (from " + str(len(docs)) + " uploaded document(s)):\n" + "\n\n".join(org_lines)
    else:
        org_block = "Agency Operational Requirements Profile: No organizational documents uploaded. Compare against general industry-standard operational expectations for the participant's apparent target role, and note the absence of organizational context as a limitation."

    return f"""You are TrainPi's AI Analysis & Comparison Engine — an Operational Workforce Readiness Analyst. Compare the Participant Capability Profile against the Agency Operational Requirements Profile to produce a workforce readiness assessment.

{participant_block}

{org_block}

Return ONLY valid JSON in this exact structure:
{{
  "overall_score": 0-100,
  "readiness_label": "Beginner Readiness | Moderate Readiness | High Readiness | Operational Readiness",
  "summary": "2-3 sentence summary of overall operational readiness",
  "technical_skills_score": 0-100,
  "experience_alignment_score": 0-100,
  "workflow_readiness_score": 0-100,
  "mission_alignment_score": 0-100,
  "compliance_readiness_score": 0-100,
  "matched_skills": ["skill the participant has that meets a requirement"],
  "missing_skills": ["required skill/capability the participant does not show"],
  "partial_skills": ["skill the participant partially demonstrates but needs development"],
  "top_strengths": ["Specific strength relevant to the operational requirements, max 5"],
  "top_gaps": ["Specific capability/workflow/compliance gap ranked by impact, max 5"],
  "key_insights": ["Actionable insight referencing the participant's actual profile, max 5"],
  "comparison_table": [
    {{"area": "e.g. SIEM / Log Analysis", "participant": "what the participant shows", "agency_requirement": "what is required", "result": "Major gap | Moderate gap | Match | Strength"}}
  ],
  "gap_summary": {{"major": 0, "moderate": 0, "minor": 0}}
}}

Rules:
- readiness_label must correspond to overall_score: <50 Beginner, 50-69 Moderate, 70-84 High, 85+ Operational.
- comparison_table must contain 5-8 rows covering the most operationally significant areas found in the data above.
- gap_summary counts must be internally consistent with comparison_table results (major = 'Major gap' count, moderate = 'Moderate gap' count, minor = remaining lower-priority gaps not in the table).
- Every list must reference specifics from the actual profiles above — no generic filler like "improve communication."
- If no organizational documents were uploaded, still produce a full assessment based on general operational expectations for the participant's likely target role, and mention the limitation once in summary."""


@router.post(
    "/analyze",
    response_model=WorkforceAnalysisResponse,
    dependencies=[Depends(rate_limit("workforce_analyze", max_requests=5, window_seconds=60))],
)
def run_workforce_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(db, current_user.id)
    docs = (
        db.query(OrganizationDocument)
        .filter(OrganizationDocument.user_id == current_user.id)
        .order_by(OrganizationDocument.uploaded_at.desc())
        .all()
    )

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_WORKFORCE_ANALYSIS, "usage", "Workforce Analysis & Comparison")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise

    prompt = _build_comparison_prompt(profile, docs)
    result = get_gemini_json_response(
        prompt,
        user_api_key=current_user.gemini_api_key if use_own_key else None,
    )

    if not result or "error" in result:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_WORKFORCE_ANALYSIS, "Refund: workforce analysis failed")
        raise HTTPException(status_code=502, detail=(result or {}).get("error", "AI could not complete the analysis. Please try again."))

    gap_summary = result.get("gap_summary") or {}
    analysis = WorkforceAnalysis(
        user_id=current_user.id,
        profile_id=profile.id,
        overall_score=float(result.get("overall_score", 0) or 0),
        readiness_label=result.get("readiness_label"),
        summary=result.get("summary"),
        technical_skills_score=float(result.get("technical_skills_score", 0) or 0),
        experience_alignment_score=float(result.get("experience_alignment_score", 0) or 0),
        workflow_readiness_score=float(result.get("workflow_readiness_score", 0) or 0),
        mission_alignment_score=float(result.get("mission_alignment_score", 0) or 0),
        compliance_readiness_score=float(result.get("compliance_readiness_score", 0) or 0),
        top_strengths=result.get("top_strengths", []) or [],
        top_gaps=result.get("top_gaps", []) or [],
        key_insights=result.get("key_insights", []) or [],
        matched_skills=result.get("matched_skills", []) or [],
        missing_skills=result.get("missing_skills", []) or [],
        partial_skills=result.get("partial_skills", []) or [],
        comparison_table=result.get("comparison_table", []) or [],
        gap_summary={
            "major": int(gap_summary.get("major", 0) or 0),
            "moderate": int(gap_summary.get("moderate", 0) or 0),
            "minor": int(gap_summary.get("minor", 0) or 0),
        },
        document_ids=[d.id for d in docs],
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/analysis", response_model=WorkforceAnalysisResponse)
def get_latest_workforce_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = (
        db.query(WorkforceAnalysis)
        .filter(WorkforceAnalysis.user_id == current_user.id)
        .order_by(WorkforceAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")
    return analysis


# ──────────────────────────────────────────────────────────────────────────
# Step 5 — Personalized Roadmap & Pathway
# ──────────────────────────────────────────────────────────────────────────

def _build_roadmap_prompt(analysis: WorkforceAnalysis, profile: WorkforceProfile) -> str:
    return f"""You are TrainPi's AI Roadmap Generator. Build a personalized, phased operational readiness roadmap based on this workforce readiness analysis.

Overall readiness score: {analysis.overall_score} ({analysis.readiness_label})
Summary: {analysis.summary}
Top gaps to close: {", ".join(analysis.top_gaps or []) or "None identified"}
Top strengths to build on: {", ".join(analysis.top_strengths or []) or "None identified"}
Missing skills: {", ".join(analysis.missing_skills or []) or "None"}
Partial skills needing development: {", ".join(analysis.partial_skills or []) or "None"}
Participant's current role: {profile.current_job_title or "Not specified"}

Return ONLY valid JSON in this exact structure:
{{
  "phases": [
    {{"number": 1, "label": "Foundation", "duration": "0-30 Days", "items": ["specific skill/action 1", "specific skill/action 2", "specific skill/action 3"]}},
    {{"number": 2, "label": "Build Skills", "duration": "31-90 Days", "items": ["...", "...", "..."]}},
    {{"number": 3, "label": "Advance", "duration": "91-180 Days", "items": ["...", "...", "..."]}},
    {{"number": 4, "label": "Optimize", "duration": "180+ Days", "items": ["...", "...", "..."]}}
  ],
  "top_priorities": ["highest-impact gap to close first", "second priority", "third priority"],
  "next_steps": ["Concrete immediate action 1", "action 2", "action 3", "action 4"],
  "recommended_skills_count": <int>,
  "learning_modules_count": <int>,
  "key_projects_count": <int>,
  "days_to_complete": "e.g. '180+'"
}}

Rules:
- Phase items must directly address the top_gaps and missing_skills listed above, in priority order across phases 1-4.
- top_priorities must be a subset/rephrasing of the analysis's top_gaps, most impactful first.
- Counts (recommended_skills_count, learning_modules_count, key_projects_count) must roughly match the actual items listed across all phases."""


@router.post(
    "/roadmap",
    response_model=WorkforceRoadmapResponse,
    dependencies=[Depends(rate_limit("workforce_roadmap", max_requests=5, window_seconds=60))],
)
def generate_workforce_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_create_profile(db, current_user.id)
    analysis = (
        db.query(WorkforceAnalysis)
        .filter(WorkforceAnalysis.user_id == current_user.id)
        .order_by(WorkforceAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Run the analysis (Step 3) before generating a roadmap.")

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_WORKFORCE_ROADMAP, "usage", "Workforce Roadmap Generation")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise

    prompt = _build_roadmap_prompt(analysis, profile)
    result = get_gemini_json_response(
        prompt,
        user_api_key=current_user.gemini_api_key if use_own_key else None,
    )

    if not result or "error" in result:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_WORKFORCE_ROADMAP, "Refund: roadmap generation failed")
        raise HTTPException(status_code=502, detail=(result or {}).get("error", "AI could not generate the roadmap. Please try again."))

    roadmap = WorkforceRoadmap(
        user_id=current_user.id,
        analysis_id=analysis.id,
        phases=result.get("phases", []) or [],
        top_priorities=result.get("top_priorities", []) or [],
        next_steps=result.get("next_steps", []) or [],
        recommended_skills_count=int(result.get("recommended_skills_count", 0) or 0),
        learning_modules_count=int(result.get("learning_modules_count", 0) or 0),
        key_projects_count=int(result.get("key_projects_count", 0) or 0),
        days_to_complete=result.get("days_to_complete"),
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return roadmap


@router.get("/roadmap", response_model=WorkforceRoadmapResponse)
def get_latest_workforce_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roadmap = (
        db.query(WorkforceRoadmap)
        .filter(WorkforceRoadmap.user_id == current_user.id)
        .order_by(WorkforceRoadmap.created_at.desc())
        .first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="No roadmap found. Generate one first.")
    return roadmap


# ──────────────────────────────────────────────────────────────────────────
# PDF Downloads (Exhibit A Step 4 & 5 — "Downloadable summary report" /
# "Download Roadmap (PDF)")
# ──────────────────────────────────────────────────────────────────────────

@router.get("/analysis/report.pdf")
def download_analysis_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis = (
        db.query(WorkforceAnalysis)
        .filter(WorkforceAnalysis.user_id == current_user.id)
        .order_by(WorkforceAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")

    profile = (
        db.query(WorkforceProfile)
        .filter(WorkforceProfile.id == analysis.profile_id)
        .first()
    )
    html = build_analysis_report_html(analysis, profile)
    pdf_bytes = html_to_pdf_bytes(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=trainpi-readiness-report.pdf"},
    )


@router.get("/roadmap/report.pdf")
def download_roadmap_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roadmap = (
        db.query(WorkforceRoadmap)
        .filter(WorkforceRoadmap.user_id == current_user.id)
        .order_by(WorkforceRoadmap.created_at.desc())
        .first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="No roadmap found. Generate one first.")

    analysis = (
        db.query(WorkforceAnalysis)
        .filter(WorkforceAnalysis.id == roadmap.analysis_id)
        .first()
    )
    html = build_roadmap_report_html(roadmap, analysis)
    pdf_bytes = html_to_pdf_bytes(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=trainpi-roadmap.pdf"},
    )
