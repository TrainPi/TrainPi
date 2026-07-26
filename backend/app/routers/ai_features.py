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
from app.models import User, CareerProfile
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
    """Returns (use_own_key: bool, gemini_key_or_none)."""
    gemini = user.gemini_api_key and user.gemini_api_key.strip()
    use_own = bool(gemini)
    if not use_own:
        deduct_credits(db, user.id, amount, kind, description)
    return use_own, gemini if gemini else None


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
    cyber_keywords = ['cyber', 'soc', 'security', 'phishing', 'mfa', 'iam', 'incident', 'siem', 'malware', 'firewall', 'vulnerability', 'log', 'analyst', 'threat', 'escalat', 'triage']
    is_cyber_topic = any(kw in body.topic.lower() for kw in cyber_keywords)
    operational_instruction = ""
    if is_cyber_topic:
        operational_instruction = """
CYBERSECURITY OPERATIONAL REQUIREMENT: This is a cybersecurity lesson. Every module MUST:
- Explain the concept as it functions inside a real organization (SOC, enterprise, government agency)
- Describe what an analyst actually does during this workflow — not just definitions
- Include an operational scenario or example (e.g. "An alert fires in the SIEM showing 5 failed logins followed by a successful login from an unusual country. Here is what the analyst does...")
- End the module with a practice scenario question that tests operational judgment, not just recall
- Reference real tools by category (e.g. "SIEM platforms", "EDR tools") without naming external vendors
"""
    prompt = f"""Create a comprehensive, deeply detailed learning lesson for the TrainPi platform on: {body.topic}

You are writing as an expert educator. This lesson appears directly to students inside the platform — make it rich, thorough, and fully self-contained.
{operational_instruction}
Return ONLY valid JSON with NO markdown, NO code fences, NO extra text:
{{
  "title": "Specific, engaging lesson title",
  "modules": [
    {{
      "module_number": 1,
      "title": "Module title",
      "content": "Write 400-600 words of expert teaching prose here. Cover: core concept explanation with depth, why it matters in a real organizational context, step-by-step breakdown with concrete examples, real-world operational applications, common mistakes analysts or professionals make and how to avoid them, and how this topic connects to the next module. Use multiple clear paragraphs. For cybersecurity topics, ground every explanation in a real SOC or organizational workflow. Write as if you are an expert practitioner teaching a student sitting next to you.",
      "key_takeaways": ["Specific actionable insight 1", "Important concept students often miss 2", "Practical tip 3", "Key operational principle 4", "Critical skill or habit 5", "Connection to bigger picture 6"],
      "duration_minutes": 35
    }}
  ],
  "quiz_questions": [
    {{
      "question": "Specific question testing real operational understanding, not just recall",
      "type": "mcq",
      "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
      "correct_answer": "Correct answer",
      "rationale": "Explanation of why this is correct and why each wrong answer is wrong"
    }}
  ]
}}

STRICT REQUIREMENTS:
- Generate exactly 5-7 modules progressing from fundamentals to operational application
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
    
    cyber_keywords = ['cyber', 'soc', 'security', 'analyst', 'iam', 'incident', 'phishing', 'mfa', 'infosec', 'dot', 'government', 'federal', 'it support']
    is_cyber_goal = any(kw in body.goal.lower() for kw in cyber_keywords)
    operational_preamble = ""
    if is_cyber_goal:
        operational_preamble = """
IMPORTANT: This is a cybersecurity career goal. The roadmap must be OPERATIONALLY GROUNDED:
- Steps must reflect real SOC and organizational workflows, not just topic names
- Each step description must explain what an analyst actually does in this area
- Include steps for: SOC environment orientation, phishing investigation workflow, MFA/IAM triage, ticket escalation, incident response process, log analysis basics
- Every step must answer: "What does this look like inside a real organization?"
- Avoid generic steps like "Learn networking basics" — instead write "Network Traffic Analysis for SOC Analysts: understanding what normal looks like and identifying anomalies during phishing investigations"
"""

    prompt = f"""The user's learning goal: "{body.goal}"
{operational_preamble}
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
    cyber_keywords = ['cyber', 'soc', 'security', 'phishing', 'mfa', 'iam', 'incident', 'siem', 'malware', 'threat', 'escalat', 'triage', 'log', 'analyst', 'linux', 'ssh', 'edr', 'endpoint', 'cloud', 'azure', 'aws', 'ransomware', 'brute', 'identity', 'impossible travel', 'token', 'vulnerability', 'patch']
    is_cyber_topic = any(kw in body.topic.lower() for kw in cyber_keywords)
    topic_lower = body.topic.lower()
    scenario_instruction = ""
    if is_cyber_topic:
        # Select scenario type based on topic keywords
        if any(k in topic_lower for k in ["siem", "log", "authentication log", "log analysis"]):
            scenario_type = "A SIEM alert fires showing 14 failed authentication attempts followed by a successful login from a foreign IP at 3 AM on a privileged account. As the on-call analyst, walk through what you investigate first, what evidence you document, and when you escalate to Tier 2."
        elif any(k in topic_lower for k in ["linux", "ssh", "brute force", "brute-force"]):
            scenario_type = "Your EDR platform flags an SSH brute-force attempt against a Linux production server — 912 failed attempts over 6 minutes, followed by one successful login. Walk through your containment steps, what you collect as evidence, and how you determine whether lateral movement occurred."
        elif any(k in topic_lower for k in ["edr", "endpoint", "ransomware", "malware"]):
            scenario_type = "An EDR alert fires showing mass file-rename behavior consistent with ransomware on a shared network drive. The behavior started 4 minutes ago and is still active. You have a narrow window before it spreads further. What are your first three actions and in what order?"
        elif any(k in topic_lower for k in ["iam", "identity", "impossible travel", "mfa abuse", "access management"]):
            scenario_type = "An identity monitoring alert fires: a user account shows logins from Chicago and London 28 minutes apart — an impossible travel event. The user claims they haven't traveled. Walk through your investigation, what access decision you make immediately, and how you document the incident."
        elif any(k in topic_lower for k in ["cloud", "azure", "aws", "token", "service account"]):
            scenario_type = "A cloud security alert flags that an Azure service account token was exported from a developer's workstation and used from an unrecognized external IP 5 hours later. How do you investigate the blast radius, what do you revoke first, and how do you assess what data may have been accessed?"
        elif any(k in topic_lower for k in ["vulnerability", "patch", "cve"]):
            scenario_type = "Your vulnerability scanner flags a critical CVE with a CVSS score of 9.8 on a production-facing web server. A patch is available but requires a 3-hour maintenance window that operations won't approve for 72 hours. How do you document the risk, what compensating controls do you recommend, and who do you escalate to?"
        elif any(k in topic_lower for k in ["escalat", "ticket", "triage"]):
            scenario_type = "You receive a Tier 1 ticket: 'User getting strange emails.' After investigation you determine it's a targeted spear-phishing campaign aimed at your finance team. At what point in your investigation do you escalate? What specific information goes into your escalation note to Tier 2?"
        else:
            scenario_type = "A user reports clicking a link in what appeared to be an internal HR email. They entered their network credentials before realizing it was suspicious. Walk through your first 15 minutes: what you contain, what you investigate, and when you escalate."

        scenario_instruction = f"""
This is a cybersecurity challenge. Build it around this specific operational scenario:
{scenario_type}
Requirements:
- The scenario must present a real-world SOC or security operations situation the learner works through step by step
- Each task must be a single, concrete operational action an analyst would actually take
- Feedback must explain: (1) the correct operational reasoning, (2) what an analyst would realistically do, (3) why the sequence or decision matters in a real environment
"""
    prompt = f"""Create an engaging, educational gamified learning challenge for: {body.topic}
{scenario_instruction}
Requirements:
- Make it operationally realistic and educational
- Clear scenario setup if cybersecurity-related
- Clear learning objective tied to a real workflow outcome
- Time estimate: 5-15 minutes
- Rewards should motivate progress (100-500 XP range)

Return ONLY this JSON:
{{
  "title": "Specific, scenario-based challenge title",
  "description": "2-3 sentences describing the operational scenario the learner will work through and what they will learn by completing it",
  "type": "Scenario" or "Quiz" or "Challenge",
  "difficulty": "Easy" or "Medium" or "Hard",
  "xpReward": 100-500,
  "learning_objective": "Specific operational skill or workflow understanding the learner gains",
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
    cyber_keywords = ['cyber', 'soc', 'security', 'analyst', 'iam', 'incident', 'it support']
    is_cyber_path = body.career_path and any(kw in body.career_path.lower() for kw in cyber_keywords)
    operational_context = ""
    if is_cyber_path:
        operational_context = """
This is a cybersecurity career path. Assess operational readiness — not just course completion.
Consider: Has the learner demonstrated understanding of SOC workflows? Do they understand MFA/IAM alert triage? Can they describe an incident escalation process? Does their resume show operational relevance or only generic IT background?
Your feedback must reference specific operational skills and workflows, not just learning percentages.
"""
    prompt = f"""Analyze this learner's operational readiness for their target role:
- Target Career: {body.career_path or 'Not set'}
- Learning Progress: {body.roadmap_completion}% complete
- Resume Quality Score: {body.resume_score}/100
- Lessons Completed: {body.lessons_completed}
{operational_context}
Structure your feedback in this order:
1. **Current Strengths** — Start by naming 1-2 specific things they already have that are operationally relevant. Be concrete, not generic.
2. **Operational Readiness Level** — State their current level directly: Beginner / Developing / Operational. One sentence explaining why.
3. **Critical Gaps** — Name the 1-2 most specific operational gaps standing between them and job readiness. Be direct — not "improve security skills" but "no demonstrated SIEM triage experience" or "hasn't practiced incident ticket documentation".
4. **One Concrete Next Step** — Give a single, workflow-specific action (e.g. "Practice walking a suspicious login alert from SIEM detection through ticket creation and escalation decision").
5. **Realistic Timeline** — Based on their progress, give an honest estimate of when they could be job-ready with consistent effort.

Keep it 5-7 sentences total. Write in a direct, encouraging-but-honest tone. Plain text, no JSON."""
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
    cyber_keywords = ['phishing', 'mfa', 'iam', 'incident', 'soc', 'escalat', 'triage', 'malware', 'log', 'ticket', 'analyst', 'siem', 'security', 'cyber', 'threat']
    is_cyber_problem = any(kw in body.problem_title.lower() for kw in cyber_keywords)
    hint_framing = ""
    if is_cyber_problem:
        hint_framing = """This is a cybersecurity operational scenario. Your hint must:
- Reference real SOC analyst thinking (what evidence to look for, what to document, when to escalate)
- Point the learner toward the operational decision or workflow step they need to consider
- NOT give the answer, but guide them toward thinking like an analyst
"""
    prompt = f"""The learner is working on this problem: {body.problem_title}
{hint_framing}
Provide a helpful hint that:
1. Guides them toward the solution WITHOUT spoiling it
2. Teaches a relevant operational concept or decision framework
3. Encourages them to think critically about what an analyst would do in a real environment
4. Is 2-4 sentences max
5. Suggests what to consider or what step to think through next

Plain text, direct and practical tone."""
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

    profile = db.query(CareerProfile).filter(
        CareerProfile.user_id == current_user.id
    ).order_by(CareerProfile.created_at.desc()).first()

    if profile:
        parts = []
        if profile.career_path:
            parts.append(f"career goal: {profile.career_path}")
        if profile.skills:
            parts.append(f"existing skills: {', '.join(profile.skills[:6])}")
        if profile.interests:
            parts.append(f"interests: {', '.join(profile.interests[:5])}")
        profile_context = "; ".join(parts) if parts else "no profile set yet"
    else:
        profile_context = "new learner, no profile set yet"

    prompt = f"""Analyze this specific learner's profile and recommend their most effective learning style and study approach.

Learner profile: {profile_context}

Based on this profile:
1. Identify their most likely dominant learning style (visual, auditory, reading/writing, or kinesthetic) and explain why it fits their background
2. Describe 2-3 concrete study strategies tailored to this style AND their specific career goal
3. Name one common mistake learners with this profile make and how to avoid it

Keep the response to 3-4 sentences. Be specific to their actual career path and skills — not generic advice. Plain text, direct and practical tone."""
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
