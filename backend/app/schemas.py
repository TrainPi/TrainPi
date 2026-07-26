from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    agree_to_terms: bool = False

    @model_validator(mode='after')
    def validate_registration(self) -> 'UserCreate':
        if not self.agree_to_terms:
            raise ValueError("You must agree to the Terms and Privacy Policy to continue")
        if len(self.password.encode('utf-8')) > 72:
            raise ValueError("Password cannot be longer than 72 characters")
        return self

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    bio: Optional[str]
    headline: Optional[str]
    profile_image: Optional[str]
    location: Optional[str]
    website: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    is_active: bool
    credits: Optional[int] = None
    has_gemini_api_key: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    headline: Optional[str] = None
    profile_image: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

# Career Schemas
class CareerInterestRequest(BaseModel):
    interests: List[str]
    skills: List[str]
    resume_text: Optional[str] = None

class CareerSelectRequest(BaseModel):
    career_path: str

class CareerMatch(BaseModel):
    career_path: str
    match_score: float
    salary_range: Optional[str] = None
    growth_outlook: Optional[str] = None
    required_skills: List[str]
    job_titles: List[str]

class CareerProfileResponse(BaseModel):
    id: int
    interests: List[str]
    skills: List[str]
    career_path: Optional[str]
    match_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Roadmap Schemas
class RoadmapStep(BaseModel):
    step_number: int
    title: str
    description: str
    skills: List[str] = []
    certifications: List[str] = []
    estimated_time: str
    resources: List[Dict[str, str]] = []

class RoadmapCreate(BaseModel):
    career_path: str

class RoadmapResponse(BaseModel):
    id: int
    career_path: str
    steps: List[RoadmapStep]
    current_step: int
    completion_percentage: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Resume Schemas
class ResumeContent(BaseModel):
    personal_info: Dict[str, str]
    summary: str
    experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    skills: List[str]
    certifications: List[str]

class ResumeCreate(BaseModel):
    title: Optional[str] = None
    content: ResumeContent

class ResumeResponse(BaseModel):
    id: int
    title: Optional[str]
    resume_score: float
    ats_compliant: bool
    version: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Lesson Schemas
class LessonModule(BaseModel):
    module_number: int
    title: str
    content: str
    key_takeaways: List[str]
    duration_minutes: int

class QuizQuestion(BaseModel):
    question: str
    type: str  # 'mcq', 'true_false', 'fill_blank'
    options: Optional[List[str]] = None
    correct_answer: str
    rationale: str

class LessonCreate(BaseModel):
    title: str
    source_document: Optional[str] = None
    content: Optional[str] = None


class LessonCreateFromAI(BaseModel):
    """Create a lesson from AI-generated content (title, modules, quiz_questions)."""
    title: str
    modules: List[LessonModule]
    quiz_questions: List[QuizQuestion]


class LessonResponse(BaseModel):
    id: int
    title: str
    modules: List[LessonModule]
    quiz_questions: List[QuizQuestion]
    created_at: datetime
    
    class Config:
        from_attributes = True


class LessonQuizUpdate(BaseModel):
    """Update lesson's quiz (e.g. after AI-generated quiz)."""
    quiz_questions: Optional[List[QuizQuestion]] = None

# Dashboard Schemas
class DashboardStats(BaseModel):
    career_path: Optional[str]
    roadmap_id: Optional[int] = None
    roadmap_completion: float
    skills_acquired: int
    skills_required: int
    courses_enrolled: int
    courses_completed: int
    lessons_in_progress: int
    resume_score: Optional[float]
    last_resume_update: Optional[datetime]
    weekly_goals: List[str]
    suggested_next_steps: List[str]
    current_roadmap_step: Optional[RoadmapStep] = None
    exceptions: Optional[List[Dict[str, Any]]] = []

class ProgressUpdate(BaseModel):
    lesson_id: Optional[int] = None
    roadmap_id: Optional[int] = None
    progress_type: str
    completion_percentage: float
    quiz_score: Optional[float] = None
    time_spent_minutes: int


# Credits Schemas
class CreditsBalance(BaseModel):
    credits: int


class CreditPurchaseRequest(BaseModel):
    package_id: str  # e.g. '100', '500', '1000'


class CheckoutSessionResponse(BaseModel):
    url: str  # Stripe Checkout URL to redirect the user to


class GeminiKeyRequest(BaseModel):
    api_key: Optional[str] = None  # set to null/empty to remove


class CreditTransactionResponse(BaseModel):
    id: int
    amount: int
    kind: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────
# Workforce Readiness Schemas (Exhibit A)
# ──────────────────────────────────────────────────────────────────────────

class WorkforceProfileUpdate(BaseModel):
    current_job_title: Optional[str] = None
    years_experience: Optional[str] = None
    primary_skills: List[str] = []
    additional_notes: Optional[str] = None


class WorkforceProfileResponse(BaseModel):
    id: int
    current_job_title: Optional[str]
    years_experience: Optional[str]
    primary_skills: List[str]
    additional_notes: Optional[str]
    resume_filename: Optional[str]

    extracted_work_history: List[str] = []
    extracted_skills: List[str] = []
    extracted_certifications: List[str] = []
    extracted_tools: List[str] = []
    extracted_years_experience: Optional[str] = None
    extracted_strengths: List[str] = []
    extracted_missing_skills: List[str] = []

    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrganizationDocumentResponse(BaseModel):
    id: int
    name: str
    category: str
    document_type: Optional[str] = None
    size_kb: int

    extracted_requirements: List[str] = []
    extracted_skills: List[str] = []
    extracted_workflows: List[str] = []
    extracted_role_expectations: List[str] = []
    extracted_keywords: List[str] = []
    extracted_tools: List[str] = []
    extracted_compliance_requirements: List[str] = []
    extracted_mission_objectives: List[str] = []

    uploaded_at: datetime

    class Config:
        from_attributes = True


class ComparisonRow(BaseModel):
    area: str
    participant: str
    agency_requirement: str
    result: str  # 'Major gap' | 'Moderate gap' | 'Match' | 'Strength'


class GapSummary(BaseModel):
    major: int = 0
    moderate: int = 0
    minor: int = 0


class WorkforceAnalysisResponse(BaseModel):
    id: int
    overall_score: float
    readiness_label: Optional[str]
    summary: Optional[str]

    technical_skills_score: float
    experience_alignment_score: float
    workflow_readiness_score: float
    mission_alignment_score: float
    compliance_readiness_score: float

    top_strengths: List[str] = []
    top_gaps: List[str] = []
    key_insights: List[str] = []

    matched_skills: List[str] = []
    missing_skills: List[str] = []
    partial_skills: List[str] = []

    comparison_table: List[ComparisonRow] = []
    gap_summary: GapSummary = GapSummary()

    created_at: datetime

    class Config:
        from_attributes = True


class RoadmapPhaseItem(BaseModel):
    number: int
    label: str
    duration: str
    items: List[str] = []


class WorkforceRoadmapResponse(BaseModel):
    id: int
    phases: List[RoadmapPhaseItem] = []
    top_priorities: List[str] = []
    next_steps: List[str] = []
    recommended_skills_count: int = 0
    learning_modules_count: int = 0
    key_projects_count: int = 0
    days_to_complete: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────
# Admin & Organizational Schemas (Exhibit A)
# ──────────────────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationMemberInvite(BaseModel):
    email: EmailStr
    role: str = "participant"  # 'participant' | 'org_admin'


class OrganizationMemberResponse(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str]
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class ParticipantReadinessSummary(BaseModel):
    """One row in the org admin's participant tracking view."""
    user_id: int
    email: str
    full_name: Optional[str]
    role: str
    has_profile: bool
    has_analysis: bool
    overall_score: Optional[float] = None
    readiness_label: Optional[str] = None
    top_gaps: List[str] = []
    last_analysis_at: Optional[datetime] = None


class OrganizationReadinessSummary(BaseModel):
    """Aggregate readiness view across all participants in an organization."""
    organization_id: int
    organization_name: str
    total_participants: int
    participants_with_analysis: int
    average_readiness_score: Optional[float] = None
    readiness_distribution: dict  # {"Beginner Readiness": 3, "Moderate Readiness": 5, ...}
    most_common_gaps: List[dict]  # [{"gap": "SIEM & Log Analysis", "count": 4}, ...]
    participants: List[ParticipantReadinessSummary]

