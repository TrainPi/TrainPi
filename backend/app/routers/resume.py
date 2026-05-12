from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Resume
from app.schemas import ResumeCreate, ResumeResponse, ResumeContent
from app.auth import get_current_user
from app.services.ai_service import get_gemini_json_response
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CAREER_DISCOVER, CREDITS_PER_READINESS_FEEDBACK
from typing import List
import io
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
try:
    from docx import Document
except ImportError:
    Document = None

router = APIRouter()

def calculate_resume_score(resume_content: ResumeContent) -> float:
    """Calculate resume score based on completeness and quality"""
    score = 0.0
    
    if resume_content.personal_info.get("name"):
        score += 5
    if resume_content.personal_info.get("email"):
        score += 5
    
    # Summary (15 points)
    if resume_content.summary and len(resume_content.summary) > 50:
        score += 15
    
    # Experience (40 points)
    if resume_content.experience:
        score += min(len(resume_content.experience) * 10, 40)
    
    # Education (15 points)
    if resume_content.education:
        score += min(len(resume_content.education) * 7.5, 15)
    
    # Skills (10 points)
    if resume_content.skills:
        score += min(len(resume_content.skills) * 2, 10)
    
    # Certifications (10 points)
    if resume_content.certifications:
        score += min(len(resume_content.certifications) * 5, 10)
    
    return min(score, 100.0)

def check_ats_compliance(resume_content: ResumeContent) -> bool:
    """Basic ATS compliance check"""
    has_name = bool(resume_content.personal_info.get("name"))
    has_email = bool(resume_content.personal_info.get("email"))
    has_summary = bool(resume_content.summary)
    has_experience = len(resume_content.experience) > 0
    has_skills = len(resume_content.skills) > 0
    
    return has_name and has_email and has_summary and has_experience and has_skills

@router.post("/create", response_model=ResumeResponse)
def create_resume(
    resume_data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate resume score
    resume_score = calculate_resume_score(resume_data.content)
    ats_compliant = check_ats_compliance(resume_data.content)
    
    # Get latest version number
    latest_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.version.desc()).first()
    
    version = (latest_resume.version + 1) if latest_resume else 1
    
    # Create resume
    resume = Resume(
        user_id=current_user.id,
        title=resume_data.title or "My Resume",
        content=resume_data.content.model_dump(),
        resume_score=resume_score,
        ats_compliant=ats_compliant,
        version=version
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    return resume

@router.get("/my-resumes", response_model=List[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()
    
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return resume

@router.post("/enhance/{resume_id}")
def enhance_resume(
    resume_id: int,
    job_description: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_READINESS_FEEDBACK, "usage", "Resume Enhancement")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise

    import json as _json
    resume_text = _json.dumps(resume.content, indent=2) if resume.content else "Resume content unavailable"

    prompt = f"""You are a professional resume coach. Review this resume against the job description and provide specific, actionable enhancement suggestions.

Resume:
{resume_text[:4000]}

Job Description:
{job_description[:2000]}

Return ONLY valid JSON, no markdown:
{{
  "message": "Resume enhancement suggestions generated",
  "suggestions": [
    "Specific change 1 with example rewrite if applicable",
    "Specific change 2",
    "Specific change 3",
    "Specific change 4",
    "Specific change 5"
  ],
  "keyword_gaps": ["missing keyword 1", "missing keyword 2"],
  "overall_match": "Low | Medium | High",
  "priority_action": "The single highest-impact change to make first"
}}

Rules:
- Each suggestion must reference a specific section (Summary, Experience, Skills, etc.)
- Suggestions must directly address gaps between the resume and the job description
- keyword_gaps should list important terms from the JD not present in the resume
- Be direct and specific, not generic"""

    try:
        result = get_gemini_json_response(
            prompt,
            user_api_key=current_user.gemini_api_key if use_own_key else None
        )
        if result and "suggestions" in result:
            return result
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_READINESS_FEEDBACK, "Refund: resume enhancement failed")
    except Exception:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_READINESS_FEEDBACK, "Refund: resume enhancement error")

    return {
        "message": "Resume enhancement suggestions generated",
        "suggestions": [
            "Add more relevant keywords from the job description",
            "Quantify achievements with specific numbers and metrics",
            "Use strong action verbs at the start of each bullet point",
            "Tailor your summary to match the role's core requirements",
            "Ensure skills section includes all technologies mentioned in the job description",
        ]
    }

MAX_RESUME_SIZE = 10 * 1024 * 1024  # 10 MB

def extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract text from PDF or DOCX file. Raises HTTPException on failure."""
    lower = (filename or "").lower()
    text = ""

    if lower.endswith(".pdf"):
        if PyPDF2 is None:
            raise HTTPException(status_code=400, detail="PDF parsing unavailable on this server. Please paste your resume text instead.")
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")
    elif lower.endswith((".doc", ".docx")):
        if Document is None:
            raise HTTPException(status_code=400, detail="DOCX parsing unavailable on this server. Please paste your resume text instead.")
        try:
            doc = Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read DOCX: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or DOCX file.")

    stripped = text.strip()
    if not stripped:
        raise HTTPException(status_code=400, detail="No readable text found in this file. Please ensure it is not image-only or password-protected.")
    return stripped[:10000]


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload resume (PDF/DOCX), extract text, use Gemini to analyze and extract skills,
    then recommend career paths. Uses user's Gemini key or deducts credits.
    """
    content = await file.read()
    if len(content) > MAX_RESUME_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum resume size is 10 MB.")
    resume_text = extract_text_from_file(file.filename or "", content)
    
    use_own_key = bool(current_user.gemini_api_key and current_user.gemini_api_key.strip())
    if not use_own_key:
        try:
            deduct_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "usage", "Resume Upload & Analysis")
        except HTTPException as e:
            if e.status_code == 402:
                raise HTTPException(status_code=402, detail="INSUFFICIENT_CREDITS")
            raise
    
    try:
        prompt = f"""You are an Operational Readiness Analyst for TrainPi. Analyze this resume and produce an operational gap assessment — not just a skills list.

Resume text:
{resume_text[:8000]}

Evaluate the candidate against the requirements of a Cybersecurity Analyst / SOC Analyst role inside a real organization (e.g. DOT or federal/enterprise environment).

Return ONLY valid JSON in this exact structure:
{{
  "skills_found": ["skill1", "skill2", ...],
  "recommended_career": "Most fitting role (e.g. Cybersecurity Analyst, SOC Analyst, IT Support to Cyber Transition, IAM Specialist, AI Business Analyst)",
  "match_score": 0-100,
  "summary": "2-3 sentence summary of their professional background and what operational experience they already bring.",
  "operational_readiness_level": "Beginner | Developing | Operational",
  "operational_strengths": ["Specific strength that maps to a real workflow, e.g. 'Understands phishing behavior from end-user perspective'"],
  "operational_gaps": ["Specific gap that would block them in a SOC role, e.g. 'No Linux CLI experience', 'No SIEM or log analysis exposure', 'No MFA/IAM alert triage experience', 'No incident ticket documentation experience'"],
  "priority_gap": "The single most impactful operational gap to close first, with one sentence on why it matters in a real SOC environment."
}}

Rules:
- operational_strengths must reference actual workflow relevance, not just list skills.
- operational_gaps must be specific and role-relevant — not generic advice like "improve communication."
- If the resume shows IT support, Windows admin, or help desk experience, map those to cybersecurity operational parallels.
- recommended_career must be one of: Cybersecurity Analyst, SOC Analyst, IT Support to Cyber Transition, IAM Specialist, AI Business Analyst, or a similarly specific operational role."""

        result = get_gemini_json_response(
            prompt,
            user_api_key=current_user.gemini_api_key if use_own_key else None
        )

        if not result or "error" in result:
            if not use_own_key:
                refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: resume analysis failed")
            raise HTTPException(status_code=502, detail=result.get("error", "AI could not analyze resume"))

        return {
            "success": True,
            "analysis": {
                "recommended_career": result.get("recommended_career", "Cybersecurity Analyst"),
                "skills_found": result.get("skills_found", []),
                "match_score": result.get("match_score", 70),
                "summary": result.get("summary", "Resume analyzed successfully."),
                "operational_readiness_level": result.get("operational_readiness_level", "Beginner"),
                "operational_strengths": result.get("operational_strengths", []),
                "operational_gaps": result.get("operational_gaps", []),
                "priority_gap": result.get("priority_gap", ""),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))

