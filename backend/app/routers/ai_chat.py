from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CareerProfile, Roadmap
from app.auth import get_current_user
from pydantic import BaseModel
import os
import openai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

from openai import OpenAI

# Initialize OpenAI client (Configured for OpenRouter)
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
)

class ChatMessage(BaseModel):
    message: str
    image: str | None = None

class ChatResponse(BaseModel):
    response: str

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_data: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Fetch user context
        profile = db.query(CareerProfile).filter(CareerProfile.user_id == current_user.id).order_by(CareerProfile.created_at.desc()).first()
        roadmap = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.created_at.desc()).first()
        
        context_parts = []
        context_parts.append(f"User: {current_user.full_name or 'Learner'}.")
        if profile:
            context_parts.append(f"Interested in: {profile.career_path}. Skills: {', '.join(profile.skills)}.")
        if roadmap:
            context_parts.append(f"Current Roadmap Step: {roadmap.current_step + 1}/{len(roadmap.steps) if roadmap.steps else '?'}.")

        context = " ".join(context_parts)
        system_prompt = f"""You are an AI Career Mentor for TrainPi. 
        Your goal is to help the user navigate their career path, answer questions about their roadmap, and provide guidance.
        Context: {context}
        Keep responses encouraging, concise, and actionable."""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if chat_data.image:
            # Vision Request (Using GPT-4o with new key)
            model = "openai/gpt-4o"
            messages.append({
                "role": "user", 
                "content": [
                    {"type": "text", "text": chat_data.message},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": chat_data.image
                        }
                    }
                ]
            })
        else:
            # Standard Text Request
            model = "openai/gpt-3.5-turbo"
            messages.append({"role": "user", "content": chat_data.message})

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "TrainPi"
            }
        )

        return {"response": response.choices[0].message.content}

    except openai.RateLimitError:
        return {"response": "You have exceeded your OpenAI API quota. Please check your billing details or provide a new API key."}
    except openai.AuthenticationError:
        return {"response": "Invalid OpenAI API Key. Please check your configuration."}
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"response": f"Connection Error: {str(e)}"}
