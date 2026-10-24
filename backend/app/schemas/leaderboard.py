from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    color: str
    category: str
    criteria_type: str
    criteria_value: int

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: int
    badge: BadgeResponse
    earned_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    full_name: str
    avatar_color: str
    total_points: int
    missions_completed: int
    current_streak: int
    badges_count: int
    is_demo: bool
    is_current_user: bool = False


class TeamLeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    team_name: str
    team_type: str
    avatar_color: str
    total_points: int
    missions_completed: int
    member_count: int
    is_demo: bool


class PassportResponse(BaseModel):
    user: dict
    total_missions: int
    current_streak: int
    longest_streak: int
    total_points: int
    badges: List[UserBadgeResponse]
    recent_activity: List[dict]
    weekly_progress: dict
    cumulative_metrics: dict
    milestones: List[dict]


class CampusLocationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    latitude: Optional[float]
    longitude: Optional[float]
    map_x: Optional[float]
    map_y: Optional[float]
    address: Optional[str]
    is_verified: bool
    is_demo: bool

    class Config:
        from_attributes = True
