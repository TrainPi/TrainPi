from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Resume
from app.schemas import ResumeCreate, ResumeResponse, ResumeContent
from app.auth import get_current_user
from app.services.ai_service import get_gemini_json_response
from app.routers.credits import deduct_credits, refund_credits, CREDITS_PER_CAREER_DISCOVER
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
    
    # In production, use AI to enhance resume based on job description
    # For now, return a message
    return {
        "message": "Resume enhancement suggestions generated",
        "suggestions": [
            "Add more relevant keywords from job description",
            "Quantify achievements with numbers",
            "Use action verbs in experience descriptions"
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
        prompt = f"""Analyze this resume and extract:
1. List of technical and professional skills (as a JSON array)
2. Recommended career path (single best match, e.g. "Software Engineer", "Data Analyst", "AI Engineer", "IT Specialist")
3. Match score (0-100) based on skills and experience

Resume text:
{resume_text[:8000]}

Return JSON:
{{
  "skills_found": ["skill1", "skill2", ...],
  "recommended_career": "Career Name",
  "match_score": 85,
  "summary": "Brief 1-2 sentence summary of their background"
}}"""
        
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
                "recommended_career": result.get("recommended_career", "Software Engineer"),
                "skills_found": result.get("skills_found", []),
                "match_score": result.get("match_score", 75),
                "summary": result.get("summary", "Resume analyzed successfully.")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        if not use_own_key:
            refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))

