from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ActivityLogCreate(BaseModel):
    activity_type: str
    sub_type: Optional[str] = None
    duration_minutes: Optional[float] = None
    distance_km: Optional[float] = None
    water_ml: Optional[int] = None
    reusable_bottle: bool = False
    notes: Optional[str] = None
    extra_data: Optional[dict] = None


class ActivityLogResponse(BaseModel):
    id: int
    activity_type: str
    sub_type: Optional[str]
    duration_minutes: Optional[float]
    distance_km: Optional[float]
    water_ml: Optional[int]
    reusable_bottle: bool
    notes: Optional[str]
    logged_at: datetime
    points_earned: Optional[int] = 15
    new_total_points: Optional[int] = None

    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    category: str
    target_value: float = Field(..., gt=0)
    unit: str
    period: str = "weekly"


class GoalResponse(BaseModel):
    id: int
    category: str
    target_value: float
    unit: str
    period: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ImpactSummary(BaseModel):
    # Travel
    total_travel_km: float
    total_travel_minutes: float
    estimated_co2_avoided_kg: Optional[float]
    co2_estimate_available: bool

    # Meals
    total_meal_swaps: int
    estimated_meal_co2_avoided_kg: float

    # Movement
    total_movement_minutes: float
    total_movement_sessions: int

    # Hydration
    total_water_ml: int
    total_reusable_bottle_uses: int
    estimated_bottles_avoided: int
    estimated_bottle_co2_avoided_kg: float

    # Missions
    total_missions_completed: int
    total_points: int

    # Meta
    estimate_disclaimer: str
    assumptions: dict


class DashboardResponse(BaseModel):
    user: dict
    today_recommended_mission: Optional[dict]
    weekly_stats: dict
    recent_completions: List[dict]
    impact_summary: dict
    streak: int
    total_points: int
    next_milestone: Optional[dict]
    leaderboard_preview: List[dict]
