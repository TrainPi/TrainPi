"""
Dashboard AI features: each uses Gemini (user's key when set, else app keys + credits).
Used by: AI Learning (generate lesson), Gamified (generate challenge), Job Readiness (feedback),
Practice (hint), Personalized (learning style), Find Tutor (recommendation).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.services.ai_service import get_gemini_response, get_gemini_json_response
from app.routers.credits import (
    deduct_credits,
    refund_credits,
    CREDITS_PER_LESSON_GENERATE,
    CREDITS_PER_GAMIFIED_CHALLENGE,
    CREDITS_PER_READINESS_FEEDBACK,
    CREDITS_PER_PRACTICE_HINT,
    CREDITS_PER_LEARNING_STYLE,
    CREDITS_PER_TUTOR_RECOMMEND,
    CREDITS_PER_QUIZ_GENERATE,
    CREDITS_PER_CAREER_DISCOVER,
)

router = APIRouter()


def _user_key_or_deduct(db: Session, user: User, amount: int, kind: str, description: str):
    use_own = bool(user.gemini_api_key and user.gemini_api_key.strip())
    if not use_own:
        deduct_credits(db, user.id, amount, kind, description)
    return use_own, user.gemini_api_key if use_own else None


class TopicRequest(BaseModel):
    topic: str


class GoalRequest(BaseModel):
    goal: str


class ProblemRequest(BaseModel):
    problem_title: str


class StatsRequest(BaseModel):
    career_path: str | None = None
    roadmap_completion: float = 0
    resume_score: float | None = None
    lessons_completed: int = 0


class GenerateQuizRequest(BaseModel):
    """Generate quiz questions for a lesson/topic (Gemini + credits)."""
    topic: str | None = None
    lesson_title: str | None = None
    context: str | None = None


class CareerGoalRequest(BaseModel):
    """Get step-by-step guidance for a career goal (e.g. 'I want to learn Python')."""
    goal: str


@router.post("/generate-lesson")
def generate_lesson(
    body: TopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_LESSON_GENERATE, "usage", "AI Generate Lesson")
    prompt = f"""Generate a short learning lesson on the topic: {body.topic}.
Return a JSON object with:
- "title": string (concise lesson title)
- "modules": array of {{ "module_number": 1, "title": string, "content": string (2-3 sentences), "key_takeaways": [string], "duration_minutes": number }}
- "quiz_questions": array of {{ "question": string, "type": "mcq" or "true_false", "options": [string] or null, "correct_answer": string, "rationale": string }}
Provide 2-3 modules and 2 quiz questions. Topic: {body.topic}."""
    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_LESSON_GENERATE, "Refund: generate lesson failed")
            raise HTTPException(status_code=502, detail=data.get("error", "AI could not generate lesson"))
        return data
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_LESSON_GENERATE, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/generate-quiz")
def generate_quiz(
    body: GenerateQuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate quiz questions for a topic or lesson. Uses Gemini; user key or deducts credits."""
    use_own, key = _user_key_or_deduct(
        db, current_user, CREDITS_PER_QUIZ_GENERATE, "usage", "AI Generate Quiz"
    )
    topic = body.topic or body.lesson_title or "General knowledge"
    context = (body.context or "")[:1500]
    prompt = f"""Generate a short quiz. Topic or lesson: {topic}.
{f'Context: {context}' if context else ''}
Return a JSON object with a single key "quiz_questions": array of 2-4 objects, each with:
- "question": string
- "type": "mcq" or "true_false"
- "options": array of strings (for mcq) or null (for true_false)
- "correct_answer": string (exact text of correct option or "True"/"False")
- "rationale": string (brief explanation)
Return ONLY valid JSON, no markdown."""
    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_QUIZ_GENERATE, "Refund: generate quiz failed")
            raise HTTPException(status_code=502, detail=data.get("error", "AI could not generate quiz"))
        questions = data.get("quiz_questions")
        if not isinstance(questions, list):
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_QUIZ_GENERATE, "Refund: invalid response")
            raise HTTPException(status_code=502, detail="Invalid quiz format")
        return {"quiz_questions": questions}
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_QUIZ_GENERATE, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


class SaveCourseRequest(BaseModel):
    goal: str
    steps: list
    estimated_timeline: str
    key_skills: list
    next_action: str

@router.post("/save-course")
def save_course(
    body: SaveCourseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import Roadmap
    new_roadmap = Roadmap(
        user_id=current_user.id,
        career_path=body.goal[:100],
        steps=body.steps,
        current_step=0,
        completion_percentage=0.0
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)
    return {"message": "Course saved", "roadmap_id": new_roadmap.id}

@router.post("/career-goals-guidance")
def career_goals_guidance(
    body: CareerGoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate step-by-step guidance for a career goal (Like a full course).
    The user will preview this and then decide whether to save it.
    """
    use_own, key = _user_key_or_deduct(
        db, current_user, CREDITS_PER_CAREER_DISCOVER, "usage", f"AI Course Generation: {body.goal}"
    )
    
    prompt = f"""The user's learning goal: "{body.goal}"
    
    Create a highly detailed, professional learning roadmap (like a full course) for this goal.
    The roadmap must follow a logical progression: Fundamentals -> Intermediate -> Advanced -> Job Readiness/Expertise.
    
    Return a strictly valid JSON object:
    {{
      "steps": [
        {{ 
          "step_number": 1, 
          "title": "Clear Step Title", 
          "description": "3-4 sentences explaining what to learn and why.", 
          "skills": ["skill1", "skill2"],
          "estimated_time": "e.g. 2 weeks",
          "resources": [
            {{ "name": "Resource Title (Source)", "url": "Actual URL if known (e.g. W3Schools, YouTube, MDN, React.dev) or a search link" }}
          ]
        }}
      ],
      "estimated_timeline": "Overall time to master",
      "key_skills": ["top 5 skills to gain"],
      "next_action": "First concrete step to take right now"
    }}
    
    Generate 7-9 steps. Be extremely specific."""

    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: generation failed")
            raise HTTPException(status_code=502, detail=data.get("error", "AI could not generate course"))
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/generate-gamified")
def generate_gamified_challenge(
    body: TopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_GAMIFIED_CHALLENGE, "usage", "AI Gamified Challenge")
    prompt = f"""Create a gamified learning challenge for the topic: {body.topic}.
Return JSON: {{ "title": string, "description": string (1-2 sentences), "type": "Quiz" or "Challenge" or "Puzzle", "difficulty": "Easy" or "Medium" or "Hard", "xpReward": number (100-500) }}."""
    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_GAMIFIED_CHALLENGE, "Refund: gamified failed")
            raise HTTPException(status_code=502, detail="AI could not generate challenge")
        return data
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_GAMIFIED_CHALLENGE, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/job-readiness-feedback")
def job_readiness_feedback(
    body: StatsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_READINESS_FEEDBACK, "usage", "AI Job Readiness Feedback")
    prompt = f"""The user has: career_path={body.career_path or 'Not set'}, roadmap_completion={body.roadmap_completion}%, resume_score={body.resume_score}, lessons_completed={body.lessons_completed}.
In 2-4 short sentences, give encouraging feedback on their job readiness and one concrete next step. Plain text, no JSON."""
    try:
        text = get_gemini_response(prompt, user_api_key=key)
        if not text or "add GOOGLE_API_KEY" in text:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_READINESS_FEEDBACK, "Refund: feedback failed")
            raise HTTPException(status_code=502, detail="AI unavailable")
        return {"feedback": text}
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_READINESS_FEEDBACK, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/practice-hint")
def practice_hint(
    body: ProblemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_PRACTICE_HINT, "usage", "AI Practice Hint")
    prompt = f"""The learner is working on: {body.problem_title}. Give a short, helpful hint (1-3 sentences) without giving away the full solution. Plain text."""
    try:
        text = get_gemini_response(prompt, user_api_key=key)
        if not text or "add GOOGLE_API_KEY" in text:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_PRACTICE_HINT, "Refund: hint failed")
            raise HTTPException(status_code=502, detail="AI unavailable")
        return {"hint": text}
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_PRACTICE_HINT, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/learning-style")
def learning_style_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_LEARNING_STYLE, "usage", "AI Learning Style")
    prompt = """Analyze a typical learner and suggest their learning style (e.g. visual, kinesthetic, reading) and in 2-3 sentences recommend how they can learn best. Plain text, friendly tone."""
    try:
        text = get_gemini_response(prompt, user_api_key=key)
        if not text or "add GOOGLE_API_KEY" in text:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_LEARNING_STYLE, "Refund: analysis failed")
            raise HTTPException(status_code=502, detail="AI unavailable")
        return {"analysis": text}
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_LEARNING_STYLE, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/tutor-recommendation")
def tutor_recommendation(
    body: GoalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_TUTOR_RECOMMEND, "usage", "AI Tutor Recommendation")
    prompt = f"""The user's learning goal: {body.goal}. In 2-4 sentences, recommend what type of tutor or expertise they should look for and one tip for getting the most from tutoring. Plain text."""
    try:
        text = get_gemini_response(prompt, user_api_key=key)
        if not text or "add GOOGLE_API_KEY" in text:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_TUTOR_RECOMMEND, "Refund: recommendation failed")
            raise HTTPException(status_code=502, detail="AI unavailable")
        return {"recommendation": text}
    except HTTPException:
        raise
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_TUTOR_RECOMMEND, "Refund: error")
        raise HTTPException(status_code=503, detail=str(e))
