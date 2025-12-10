from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Lesson
from app.schemas import LessonCreate, LessonResponse, LessonModule, QuizQuestion
from app.auth import get_current_user
from typing import List
import json

router = APIRouter()

def generate_lesson_modules(content: str) -> List[dict]:
    """Break content into micro-lesson modules"""
    # Simple implementation - split by paragraphs
    # In production, use AI to intelligently segment content
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    
    modules = []
    for i, para in enumerate(paragraphs[:5]):  # Limit to 5 modules
        modules.append({
            "module_number": i + 1,
            "title": f"Module {i + 1}",
            "content": para,
            "key_takeaways": para.split('.')[:3],  # First 3 sentences as takeaways
            "duration_minutes": max(2, len(para) // 200)  # Estimate based on length
        })
    
    return modules

def generate_quiz_questions(content: str) -> List[dict]:
    """Generate quiz questions from content"""
    # Simple implementation - in production, use AI
    questions = [
        {
            "question": "What is the main topic covered in this lesson?",
            "type": "mcq",
            "options": ["Topic A", "Topic B", "Topic C", "Topic D"],
            "correct_answer": "Topic A",
            "rationale": "This is the primary focus of the lesson."
        },
        {
            "question": "True or False: The concepts discussed are applicable in real-world scenarios.",
            "type": "true_false",
            "options": None,
            "correct_answer": "True",
            "rationale": "These concepts have practical applications."
        }
    ]
    return questions

@router.post("/create", response_model=LessonResponse)
def create_lesson(
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate modules and quiz questions
    content = lesson_data.content or "Sample lesson content. This is a placeholder for actual content."
    modules = generate_lesson_modules(content)
    quiz_questions = generate_quiz_questions(content)
    
    # Create lesson
    lesson = Lesson(
        user_id=current_user.id,
        title=lesson_data.title,
        content=content,
        source_document=lesson_data.source_document,
        modules=modules,
        quiz_questions=quiz_questions
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    
    return lesson

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # In production, parse PDF/DOCX files
    # For now, return a placeholder
    content = await file.read()
    
    # Create lesson from uploaded document
    lesson_data = LessonCreate(
        title=file.filename or "Uploaded Document",
        source_document=file.filename,
        content="Content extracted from document would appear here."
    )
    
    return await create_lesson(lesson_data, current_user, db)

@router.get("/my-lessons", response_model=List[LessonResponse])
def get_my_lessons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lessons = db.query(Lesson).filter(
        Lesson.user_id == current_user.id
    ).order_by(Lesson.created_at.desc()).all()
    
    return lessons

@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.user_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return lesson

