from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class MissionBase(BaseModel):
    title: str
    description: str
    category: str
    duration_minutes: int
    difficulty: str = "easy"
    instructions: List[str]
    points: int
    metrics: Optional[dict] = None
    icon: str = "leaf"
    color: str = "#26734D"
    tags: Optional[List[str]] = None


class MissionResponse(MissionBase):
    id: int
    is_active: bool
    completion_criteria: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MissionCompleteRequest(BaseModel):
    notes: Optional[str] = None
    metadata: Optional[dict] = None


class MissionCompletionResponse(BaseModel):
    id: int
    mission_id: int
    mission_title: str
    points_awarded: int
    new_total_points: Optional[int] = None
    completed_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


class CoachRequest(BaseModel):
    available_time: int = Field(..., ge=5, le=120, description="Minutes available")
    energy: str = Field(..., pattern="^(energetic|okay|tired)$")
    preferred_category: Optional[str] = Field(None)
    has_reusable_bottle: bool = False
    weekly_focus: Optional[str] = None


class CoachResponse(BaseModel):
    mission: MissionResponse
    reason: str
    engine: str
    recommendation_score: float
    inputs: dict
