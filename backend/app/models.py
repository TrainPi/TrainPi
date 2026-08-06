from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
try:
    from sqlalchemy.dialects.postgresql import JSON
except ImportError:
    from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.encryption import EncryptedText

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    credits = Column(Integer, default=100)
    gemini_api_key = Column(String, nullable=True)
    is_platform_admin = Column(Boolean, default=False)  # platform-wide superadmin (Exhibit A admin dashboard)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    career_profiles = relationship("CareerProfile", back_populates="user")
    roadmaps = relationship("Roadmap", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    lessons = relationship("Lesson", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    exceptions = relationship("ExceptionModel", back_populates="user")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")

    @property
    def has_gemini_api_key(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.strip())

    @property
    def has_any_api_key(self) -> bool:
        return self.has_gemini_api_key


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="password_reset_tokens")

class CareerProfile(Base):
    __tablename__ = "career_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    interests = Column(JSON)  # List of interests
    skills = Column(JSON)  # List of skills
    career_path = Column(String)  # Selected career path
    match_score = Column(Float)  # AI match score
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="career_profiles")

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    career_path = Column(String, nullable=False)
    steps = Column(JSON)  # List of roadmap steps
    current_step = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="roadmaps")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(JSON)  # Structured resume data
    resume_score = Column(Float, default=0.0)
    ats_compliant = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="resumes")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    content = Column(Text)
    source_document = Column(String)  # Original document name
    modules = Column(JSON)  # List of micro-lesson modules
    quiz_questions = Column(JSON)  # List of quiz questions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="lessons")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=True)
    progress_type = Column(String)  # 'lesson', 'roadmap', 'certification'
    completion_percentage = Column(Float, default=0.0)
    quiz_scores = Column(JSON)  # List of quiz scores
    time_spent = Column(Integer, default=0)  # Time in minutes
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="progress")

class ExceptionModel(Base):
    __tablename__ = "exceptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False)
    status = Column(String, default="exception")
    remarks = Column(String, nullable=True)
    duration = Column(Integer, default=0) # Duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cleared_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="exceptions")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # positive = add, negative = deduct
    kind = Column(String, nullable=False)  # 'signup_bonus', 'purchase', 'usage', 'refund', 'redeem'
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="credit_transactions")


class CourseEnrollment(Base):
    """Tracks user enrollment and progress in catalog courses (pre-built YouTube courses)."""
    __tablename__ = "course_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(String, nullable=False)          # slug like 'python-fundamentals'
    completed_units = Column(JSON, default=list)         # list of unit indices completed
    completed = Column(Boolean, default=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    provider = Column(String)  # Coursera, edX, etc.
    career_path = Column(String)  # Associated career path
    url = Column(String)
    cost = Column(Float, default=0.0)  # 0 for free
    duration = Column(String)  # e.g., "4 weeks"
    skills_covered = Column(JSON)  # List of skills
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────────────────────────────────
# Workforce Readiness (Exhibit A) — operational workforce readiness platform.
# Kept separate from CareerProfile/Resume/Roadmap, which power the individual
# career-guidance flow. One active WorkforceProfile / analysis / roadmap per
# user; org documents accumulate until cleared.
# ──────────────────────────────────────────────────────────────────────────

class WorkforceProfile(Base):
    """Step 1: Participant Profile — capability profile extracted from resume + form input."""
    __tablename__ = "workforce_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    current_job_title = Column(String, nullable=True)
    years_experience = Column(String, nullable=True)
    primary_skills = Column(JSON, default=list)       # list[str] entered by user
    additional_notes = Column(Text, nullable=True)

    resume_filename = Column(String, nullable=True)
    resume_text = Column(EncryptedText, nullable=True)  # extracted text from uploaded resume — PII, encrypted at rest when ENCRYPTION_KEY is set

    # AI-extracted Participant Capability Profile (Exhibit A step 1 output)
    extracted_work_history = Column(JSON, default=list)
    extracted_skills = Column(JSON, default=list)
    extracted_certifications = Column(JSON, default=list)
    extracted_tools = Column(JSON, default=list)
    extracted_years_experience = Column(String, nullable=True)
    extracted_strengths = Column(JSON, default=list)
    extracted_missing_skills = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class OrganizationDocument(Base):
    """Step 2: Operational Context Ingestion — one row per uploaded org document."""
    __tablename__ = "organization_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # sop | workflow | role | mission | skill_framework | other
    document_type = Column(String, nullable=True)  # AI-classified type (e.g. "Incident Response SOP")
    size_kb = Column(Integer, default=0)

    parsed_text = Column(EncryptedText, nullable=True)  # raw org document text — confidential, encrypted at rest when ENCRYPTION_KEY is set

    # AI-extracted Operational Requirements fields (Exhibit A step 2 suggested structure)
    extracted_requirements = Column(JSON, default=list)
    extracted_skills = Column(JSON, default=list)
    extracted_workflows = Column(JSON, default=list)
    extracted_role_expectations = Column(JSON, default=list)
    extracted_keywords = Column(JSON, default=list)
    extracted_tools = Column(JSON, default=list)
    extracted_compliance_requirements = Column(JSON, default=list)
    extracted_mission_objectives = Column(JSON, default=list)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class WorkforceAnalysis(Base):
    """Step 3/4: AI Analysis & Comparison Engine output — Results & Insights."""
    __tablename__ = "workforce_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_id = Column(Integer, ForeignKey("workforce_profiles.id"), nullable=True)

    overall_score = Column(Float, default=0.0)
    readiness_label = Column(String, nullable=True)
    summary = Column(Text, nullable=True)

    # Operational Readiness Scoring Categories (Exhibit A step 3)
    technical_skills_score = Column(Float, default=0.0)
    experience_alignment_score = Column(Float, default=0.0)
    workflow_readiness_score = Column(Float, default=0.0)
    mission_alignment_score = Column(Float, default=0.0)
    compliance_readiness_score = Column(Float, default=0.0)

    top_strengths = Column(JSON, default=list)
    top_gaps = Column(JSON, default=list)
    key_insights = Column(JSON, default=list)

    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    partial_skills = Column(JSON, default=list)

    comparison_table = Column(JSON, default=list)  # list of {area, participant, agency_requirement, result}
    gap_summary = Column(JSON, default=dict)        # {major, moderate, minor}

    document_ids = Column(JSON, default=list)  # snapshot of OrganizationDocument ids used in this run

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    profile = relationship("WorkforceProfile")


class WorkforceRoadmap(Base):
    """Step 5: Personalized Roadmap & Pathway, generated from a WorkforceAnalysis."""
    __tablename__ = "workforce_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("workforce_analyses.id"), nullable=True)

    phases = Column(JSON, default=list)  # list of {number, label, duration, items}
    top_priorities = Column(JSON, default=list)
    next_steps = Column(JSON, default=list)

    recommended_skills_count = Column(Integer, default=0)
    learning_modules_count = Column(Integer, default=0)
    key_projects_count = Column(Integer, default=0)
    days_to_complete = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    analysis = relationship("WorkforceAnalysis")


# ──────────────────────────────────────────────────────────────────────────
# Admin & Organizational Features (Exhibit A) — groups participants under
# an organization so an org_admin can monitor aggregate readiness across
# many participants, not just their own profile.
# ──────────────────────────────────────────────────────────────────────────

class Organization(Base):
    """An organization/agency whose participants' workforce readiness is tracked in aggregate."""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", foreign_keys=[created_by_user_id])
    memberships = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")


class OrganizationMembership(Base):
    """Links a user to an organization with a role. One user can belong to multiple orgs."""
    __tablename__ = "organization_memberships"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False, default="participant")  # 'participant' | 'org_admin'
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User")

