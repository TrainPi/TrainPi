from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
from app.auth import get_current_user
from app.models import User

router = APIRouter()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    context: Optional[str] = None

class ChatResponse(BaseModel):
    message: Message

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        if not openai.api_key:
             # Fallback for dev/testing without key
            return ChatResponse(
                message=Message(
                    role="assistant", 
                    content="I'm the TrainPi AI Coach! To enable my full brain, please add your OPENAI_API_KEY to the backend .env file. For now, I'm here to cheer you on! 🚀"
                )
            )

        # Prepare system message based on context
        system_content = """You are the TrainPi AI Career Coach. 
        Your goal is to help users navigate their career roadmap, provide learning resources, and offer encouragement.
        Be concise, helpful, and use a friendly, professional tone.
        """
        
        if request.context:
            system_content += f"\nUser Context: {request.context}"

        messages = [{"role": "system", "content": system_content}] + [msg.dict() for msg in request.messages]

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        ai_message = response.choices[0].message
        return ChatResponse(message=Message(role=ai_message.role, content=ai_message.content))

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
