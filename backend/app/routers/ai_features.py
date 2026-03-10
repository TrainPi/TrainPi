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
from app.services.course_validator import CourseValidator
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

Create a comprehensive, structured learning roadmap using ONLY resources from these trusted platforms:
- roadmap.sh (https://roadmap.sh) - structured developer roadmaps
- Coursera (https://www.coursera.org) - verified courses
- YouTube - tutorials and courses (use search URLs)

CRITICAL - RESOURCE URLs (use EXACTLY these patterns, never invent URLs):
1. roadmap.sh: Use https://roadmap.sh/TOPIC for known paths. Examples:
   - Python: https://roadmap.sh/python
   - Frontend: https://roadmap.sh/frontend
   - Backend: https://roadmap.sh/backend
   - Full-stack/DevOps: https://roadmap.sh/devops
   - Data Science: https://roadmap.sh/data-scientist
   - If no exact match, use https://roadmap.sh/roadmaps to browse
2. Coursera: Use https://www.coursera.org/search?query=TOPIC (replace spaces with %20)
   - Example: https://www.coursera.org/search?query=python%20programming
3. YouTube: Use https://www.youtube.com/results?search_query=TOPIC+tutorial (replace spaces with +)
   - Example: https://www.youtube.com/results?search_query=python+beginner+tutorial

NEVER invent or hallucinate URLs. If unsure, use the search URL pattern for the platform.
Each resource MUST have a valid url from one of these three platforms.

STRUCTURE REQUIREMENTS:
- 12-20 steps for a full, complete learning program
- Progress: Fundamentals → Core Concepts → Intermediate → Advanced → Projects → Job Readiness
- Each step builds on the previous
- 2-4 resources per step, all from roadmap.sh, Coursera, or YouTube
- Realistic time estimates (e.g. "2-3 weeks", "1 month")

Return ONLY this valid JSON structure:
{{
  "steps": [
    {{
      "step_number": 1,
      "title": "Clear step title",
      "description": "3-4 sentences: what you learn, why it matters, how it connects to the goal.",
      "skills": ["skill1", "skill2", "skill3"],
      "estimated_time": "e.g. 2-3 weeks",
      "resources": [
        {{ "name": "Roadmap.sh - Python Path", "url": "https://roadmap.sh/python" }},
        {{ "name": "Coursera - Search Python", "url": "https://www.coursera.org/search?query=python%20programming" }},
        {{ "name": "YouTube - Python Tutorials", "url": "https://www.youtube.com/results?search_query=python+tutorial+beginner" }}
      ]
    }}
  ],
  "estimated_timeline": "Total time (e.g. 6-12 months for full path)",
  "key_skills": ["Top 5-7 skills in order"],
  "next_action": "Specific first action to take today",
  "prerequisites": ["Foundational knowledge if any"],
  "common_challenges": ["Pitfalls and how to overcome"],
  "project_ideas": ["2-3 real projects"],
  "job_titles": ["Relevant job titles"]
}}

Generate 12-20 detailed steps. Use ONLY the URL patterns above. Be specific and practical."""

    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            if not use_own:
                refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: generation failed")
            raise HTTPException(status_code=502, detail=data.get("error", "AI could not generate course") if data else "AI could not generate course")
        
        # Sanitize resources: replace invalid URLs with trusted platform links (Coursera, roadmap.sh, YouTube)
        data = CourseValidator.sanitize_resources(data, topic_hint=body.goal)
        
        # Add quality validation and scoring
        is_valid, validation_issues = CourseValidator.validate_course(data)
        quality_score, suggestions = CourseValidator.get_quality_score(data)
        
        # Add metadata to response
        data["quality_score"] = quality_score
        data["is_valid"] = is_valid
        data["validation_issues"] = validation_issues
        data["improvement_suggestions"] = suggestions
        
        print(f"[OK] Course generated - Quality Score: {quality_score}/100")
        
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
    prompt = f"""Create an engaging, educational gamified learning challenge for: {body.topic}

Requirements:
- Make it fun but educational
- Appropriate difficulty progression
- Clear learning objective
- Time estimate: 5-15 minutes
- Rewards should motivate progress (100-500 XP range)

Return ONLY this JSON:
{{
  "title": "Catchy, clear challenge title",
  "description": "2-3 sentences: What the learner will do and learn",
  "type": "Quiz" or "Challenge" or "Puzzle",
  "difficulty": "Easy" or "Medium" or "Hard",
  "xpReward": 100-500,
  "learning_objective": "What learner will be able to do after completing this",
  "time_estimate": "Estimated time in minutes"
}}"""
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
    prompt = f"""Analyze this learner's job readiness:
- Target Career: {body.career_path or 'Not set'}
- Learning Progress: {body.roadmap_completion}% complete
- Resume Quality: {body.resume_score}/100
- Lessons Completed: {body.lessons_completed}

Provide feedback that is:
1. Honest but encouraging
2. Specific to their current progress
3. Identifies their strengths
4. Gives ONE specific, actionable next step to improve job readiness
5. Realistic about timeline to job readiness

Keep it 3-5 sentences. Be practical and motivating. Plain text, no JSON."""
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
    prompt = f"""The learner is working on this problem: {body.problem_title}

Provide a helpful hint that:
1. Guides them toward the solution WITHOUT spoiling it
2. Teaches a relevant concept or approach
3. Encourages them to think critically
4. Is 2-4 sentences max
5. Suggests where to look or what to try next

Example: Instead of giving the answer, say 'Think about how X relates to Y. Try starting with Z approach.'
Plain text, conversational tone."""
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
