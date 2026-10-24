from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.mission import CoachRequest, CoachResponse, MissionResponse
from app.calculations.coach import recommend_mission
from app.services.gemini_service import generate_gemini_coach_insight, call_gemini

router = APIRouter(prefix="/coach", tags=["coach"])

class CoachChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class CoachChatResponse(BaseModel):
    response: str
    suggested_action: Optional[str] = None

@router.post("/recommend", response_model=CoachResponse)
def get_recommendation(
    payload: CoachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a personalized mission recommendation enhanced with Gemini AI.
    """
    result = recommend_mission(
        db=db,
        user_id=current_user.id,
        available_time=payload.available_time,
        energy=payload.energy,
        preferred_category=payload.preferred_category,
        has_reusable_bottle=payload.has_reusable_bottle,
        weekly_focus=payload.weekly_focus or current_user.weekly_focus,
    )

    if not result:
        raise HTTPException(status_code=404, detail="No suitable missions found. Please check that missions are seeded.")

    mission = result["mission"]
    
    # Generate Gemini AI personalized reasoning
    try:
        ai_reason = generate_gemini_coach_insight(
            student_name=current_user.full_name or "Explorer",
            time_min=payload.available_time,
            energy=payload.energy,
            mission_title=mission.title,
            category=mission.category,
        )
    except Exception:
        ai_reason = result["reason"]

    return CoachResponse(
        mission=MissionResponse.model_validate(mission),
        reason=ai_reason,
        engine="Gemini 2.5 Flash + Hybrid Telemetry Engine",
        recommendation_score=result["recommendation_score"],
        inputs=result["inputs"],
    )

@router.post("/chat", response_model=CoachChatResponse)
def chat_with_coach(
    payload: CoachChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Direct conversational AI coach powered by Gemini 2.5 Flash.
    """
    system_instruction = (
        "You are EcoCoach, the AI sustainability companion for students at PW Institute of Innovation (PW IOI) "
        "Noida campus located at First Floor, Silver Springs, Plot 13/14, Sector 126, Noida. "
        "You help students adopt low-carbon commuting, reusable water bottle habits, plant-forward meal swaps, "
        "and active micro-breaks. Be concise, encouraging, and highly specific to PW IOI Noida. Limit answer to 3-4 sentences."
    )
    prompt = f"Student {current_user.full_name} asks: {payload.message}"
    reply = call_gemini(prompt, system_instruction=system_instruction)
    if not reply:
        reply = "Keep up the momentum! You can refill your bottle at the First Floor Silver Springs station or log a quick active walking loop around Sector 126 to earn points."

    return CoachChatResponse(response=reply)
