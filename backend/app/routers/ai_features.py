"""
Dashboard AI features: each uses Gemini (user's key when set, else app keys + credits).
Used by: AI Learning (generate lesson), Gamified (generate challenge), Job Readiness (feedback),
Practice (hint), Personalized (learning style), Find Tutor (recommendation).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from urllib.parse import quote_plus
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
logger = logging.getLogger(__name__)


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


def _build_fallback_career_guidance(goal: str) -> dict:
    topic = (goal or "new career").strip()
    roadmap_url = "https://roadmap.sh/roadmaps"
    lowered = topic.lower()
    if "python" in lowered:
        roadmap_url = "https://roadmap.sh/python"
    elif any(term in lowered for term in ["frontend", "front-end", "react", "ui"]):
        roadmap_url = "https://roadmap.sh/frontend"
    elif any(term in lowered for term in ["backend", "back-end", "api", "server"]):
        roadmap_url = "https://roadmap.sh/backend"
    elif any(term in lowered for term in ["devops", "cloud"]):
        roadmap_url = "https://roadmap.sh/devops"
    elif any(term in lowered for term in ["data", "machine learning", "ai"]):
        roadmap_url = "https://roadmap.sh/data-scientist"

    step_titles = [
        "Build your foundation",
        "Learn the core tools",
        "Practice through guided exercises",
        "Work on intermediate concepts",
        "Build real portfolio projects",
        "Strengthen production skills",
        "Prepare for interviews",
        "Launch your job search",
    ]
    skill_sets = [
        ["fundamentals", "learning habits", "problem solving"],
        ["core concepts", "tooling", "best practices"],
        ["hands-on practice", "debugging", "iteration"],
        ["intermediate skills", "architecture", "quality"],
        ["projects", "portfolio", "delivery"],
        ["advanced topics", "testing", "deployment"],
        ["interview prep", "communication", "resume"],
        ["job search", "networking", "applications"],
    ]
    time_boxes = [
        "1-2 weeks",
        "2-3 weeks",
        "2-3 weeks",
        "3-4 weeks",
        "4-6 weeks",
        "2-4 weeks",
        "1-2 weeks",
        "1-2 weeks",
    ]

    steps = []
    for index, title in enumerate(step_titles, start=1):
        search_query = quote_plus(f"{topic} {title}")
        steps.append({
            "step_number": index,
            "title": title,
            "description": f"Focus this stage on {topic} by mastering the outcomes tied to {title.lower()}. Study the concepts, take notes, and apply them in small exercises so each step builds directly into the next one.",
            "skills": skill_sets[index - 1],
            "estimated_time": time_boxes[index - 1],
            "resources": [
                {"name": "Roadmap.sh", "url": roadmap_url},
                {"name": "Coursera search", "url": f"https://www.coursera.org/search?query={search_query}"},
                {"name": f"YouTube - {title} tutorial", "url": f"https://www.youtube.com/results?search_query={search_query}+tutorial"},
            ],
        })

    return {
        "steps": steps,
        "estimated_timeline": "4-8 months",
        "key_skills": ["core concepts", "problem solving", "projects", "testing", "job readiness"],
        "next_action": f"Pick one beginner-friendly resource for {topic} today and complete the first study session within 45 minutes.",
        "prerequisites": ["Basic computer literacy", "Consistent weekly study time"],
        "common_challenges": ["Trying to learn too many tools at once", "Skipping projects before fundamentals are stable"],
        "project_ideas": [f"Starter project for {topic}", f"Intermediate portfolio project for {topic}", f"Capstone project for {topic}"],
        "job_titles": [topic.title(), "Junior Specialist", "Associate Professional"],
    }


@router.post("/generate-lesson")
def generate_lesson(
    body: TopicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    use_own, key = _user_key_or_deduct(db, current_user, CREDITS_PER_LESSON_GENERATE, "usage", "AI Generate Lesson")
    prompt = f"""Create a comprehensive, deeply detailed learning lesson for the TrainPi platform on: {body.topic}

You are writing as an expert educator. This lesson appears directly to students inside the platform — make it rich, thorough, and fully self-contained.

Return ONLY valid JSON with NO markdown, NO code fences, NO extra text:
{{
  "title": "Specific, engaging lesson title",
  "modules": [
    {{
      "module_number": 1,
      "title": "Module title",
      "content": "Write 400-600 words of expert teaching prose here. Cover: core concept explanation with depth, why it matters in practice, step-by-step breakdown with concrete examples, real-world applications, common mistakes students make and how to avoid them, and how this topic connects to the next module. Use multiple clear paragraphs. If the topic is technical, include code snippets or pseudocode. Write as if you are an expert teaching a student sitting next to you.",
      "key_takeaways": ["Specific actionable insight 1", "Important concept students often miss 2", "Practical tip 3", "Key principle 4", "Critical skill or habit 5", "Connection to bigger picture 6"],
      "duration_minutes": 35
    }}
  ],
  "quiz_questions": [
    {{
      "question": "Specific question testing real understanding, not just recall",
      "type": "mcq",
      "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
      "correct_answer": "Correct answer",
      "rationale": "Explanation of why this is correct and why each wrong answer is wrong"
    }}
  ]
}}

STRICT REQUIREMENTS:
- Generate exactly 5-7 modules progressing from fundamentals to advanced to practical application
- Each module "content" field MUST be 400-600 words of expert teaching — not a short summary
- 6-8 specific, actionable key_takeaways per module (concrete, not vague)
- 8-10 quiz questions total: at least 6 MCQ (4 options each) and 2-3 true_false
- For true_false type: set "options" to null, "correct_answer" to "True" or "False"
- duration_minutes: 25-50 per module (realistic deep-study time)
- NEVER reference external websites, tell students to leave the platform, or include URLs
- All content must be 100% self-contained — a student learns everything from this lesson alone
- Topic: {body.topic}"""
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
- YouTube - SPECIFIC video tutorials (use actual video URLs, NOT search pages)

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
3. YouTube: You MUST provide actual specific YouTube video URLs with real video IDs.
   - Use the format: https://www.youtube.com/watch?v=REAL_VIDEO_ID
   - Pick well-known, popular tutorial videos that actually exist on YouTube for the topic.
   - Examples of CORRECT YouTube URLs: https://www.youtube.com/watch?v=rfscVS0vtbw (Python tutorial)
   - NEVER use YouTube search result URLs like https://www.youtube.com/results?search_query=...
   - NEVER use YouTube channel or playlist browse pages.
   - If you are not certain a specific video exists, use https://youtu.be/ short links for known videos.
   - Each YouTube resource must be a direct link to a SINGLE playable video.

NEVER invent or hallucinate URLs. If unsure about a specific video, use a well-known educational channel's video.
Each resource MUST have a valid url from one of these three platforms.
YouTube resources MUST be direct video links (watch?v= or youtu.be/) so they can be embedded in our player.

STRUCTURE REQUIREMENTS:
- 15-20 steps for a complete, thorough learning program
- Progress: Fundamentals → Core Concepts → Intermediate → Advanced → Projects → Job Readiness
- Each step builds directly on the previous one
- 3-4 resources per step, all from roadmap.sh, Coursera, or YouTube
- Realistic time estimates (e.g. "2-3 weeks", "1 month")
- Each description must be 5-6 detailed sentences explaining: what is taught, why it is essential, how to approach it, what to build/practice, and how it prepares for the next step

Return ONLY this valid JSON structure:
{{
  "steps": [
    {{
      "step_number": 1,
      "title": "Specific, clear step title",
      "description": "5-6 detailed sentences: (1) what concepts/skills you learn in this step, (2) why this foundation is critical before advancing, (3) the best approach or study method for this material, (4) what you should build or practice during this step, (5) common mistakes beginners make here and how to avoid them, (6) how this step directly prepares you for the next step.",
      "skills": ["specific skill 1", "specific skill 2", "specific skill 3", "specific skill 4", "specific skill 5"],
      "estimated_time": "e.g. 2-3 weeks",
      "resources": [
        {{ "name": "Roadmap.sh - Python Path", "url": "https://roadmap.sh/python" }},
        {{ "name": "Python for Everybody - Coursera", "url": "https://www.coursera.org/search?query=python%20programming" }},
        {{ "name": "Python Full Course - freeCodeCamp", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw" }},
        {{ "name": "Python Tutorial - Corey Schafer", "url": "https://www.youtube.com/watch?v=YYXdXT2l-Gg" }}
      ]
    }}
  ],
  "estimated_timeline": "Total time (e.g. 8-14 months for full path)",
  "key_skills": ["Top 6-8 most important skills in priority order"],
  "next_action": "Specific, concrete first action to take in the next 2 hours",
  "prerequisites": ["Specific foundational knowledge needed"],
  "common_challenges": ["Common pitfall 1 and how to overcome it", "Common pitfall 2 and strategy"],
  "project_ideas": ["3-4 real portfolio projects with brief description"],
  "job_titles": ["Relevant entry-level and mid-level job titles"]
}}

Generate 15-20 detailed steps. Use ONLY the URL patterns above. Be specific, practical, and thorough.
REMINDER: Every YouTube URL MUST be a direct link to a specific video (watch?v=ID or youtu.be/ID). NO search result pages.
Well-known tutorial channels to reference: freeCodeCamp (rfscVS0vtbw for Python), Traversy Media, Fireship, The Net Ninja, Corey Schafer, Tech With Tim, Academind, Kevin Powell (CSS). Use their known popular tutorial videos."""

    try:
        data = get_gemini_json_response(prompt, user_api_key=key)
        if not data or "error" in data:
            error_msg = data.get("error", "AI could not generate course") if data else "AI could not generate course"
            if "json parsing failed" in str(error_msg).lower():
                data = _build_fallback_career_guidance(body.goal)
            else:
                if not use_own:
                    refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: generation failed")
            
                # Return 503 instead of 502 for service errors, with proper message
                if "quota" in str(error_msg).lower() or "rate limit" in str(error_msg).lower():
                    raise HTTPException(
                        status_code=503, 
                        detail="AI service is temporarily overwhelmed. Please try again in a few moments."
                    )
                elif "timeout" in str(error_msg).lower() or "deadline" in str(error_msg).lower():
                    raise HTTPException(
                        status_code=504, 
                        detail="Request took too long to process. Complex career paths may take time. Please try again."
                    )
                else:
                    raise HTTPException(
                        status_code=502, 
                        detail=f"AI generation failed: {error_msg}"
                    )
        
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
        
        logger.info("Course generated - Quality Score: %d/100", quality_score)
        
        return data
    except HTTPException:
        raise
    except TimeoutError as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: timeout")
        raise HTTPException(
            status_code=504, 
            detail="Request timed out. Complex career paths take time. Please try again in a moment."
        )
    except Exception as e:
        if not use_own:
            refund_credits(db, current_user.id, CREDITS_PER_CAREER_DISCOVER, "Refund: error")
        error_str = str(e).lower()
        if "quota" in error_str or "rate limit" in error_str:
            raise HTTPException(status_code=503, detail="AI service quota exceeded. Please try again later.")
        elif "timeout" in error_str or "deadline" in error_str:
            raise HTTPException(status_code=504, detail="Request processing time exceeded. Please try again.")
        else:
            raise HTTPException(status_code=502, detail=f"Error: {str(e)[:200]}")


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
