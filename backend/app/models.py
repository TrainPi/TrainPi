from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
try:
    from sqlalchemy.dialects.postgresql import JSON
except ImportError:
    from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    career_profiles = relationship("CareerProfile", back_populates="user")
    roadmaps = relationship("Roadmap", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    lessons = relationship("Lesson", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")

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

