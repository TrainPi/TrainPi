from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        # Bcrypt has 72 byte limit, validate password length
        if len(self.password.encode('utf-8')) > 72:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 characters"
            )

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
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Career Schemas
class CareerInterestRequest(BaseModel):
    interests: List[str]
    skills: List[str]
    resume_text: Optional[str] = None

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
    skills: List[str]
    certifications: List[str]
    estimated_time: str
    resources: List[Dict[str, str]]

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

class LessonResponse(BaseModel):
    id: int
    title: str
    modules: List[LessonModule]
    quiz_questions: List[QuizQuestion]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    career_path: Optional[str]
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
    exceptions: Optional[List[Dict[str, Any]]] = []

class ProgressUpdate(BaseModel):
    lesson_id: Optional[int] = None
    roadmap_id: Optional[int] = None
    progress_type: str
    completion_percentage: float
    quiz_score: Optional[float] = None
    time_spent_minutes: int

