"""
Smart Missions Coach - Rule-based recommendation engine.

This engine selects the most appropriate mission based on:
1. User's available time
2. Energy level
3. Preferred category
4. Recent completion history (avoids repeating same mission)
5. Mission suitability scores

This is a transparent, deterministic engine - NOT AI/ML.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.mission import Mission, MissionCompletion
from app.models.user import User
import random


ENERGY_CATEGORY_MAP = {
    "energetic": ["travel", "movement"],
    "okay": ["travel", "movement", "meals", "hydration"],
    "tired": ["hydration", "meals", "movement"],
}

DURATION_TOLERANCE = 5  # minutes


def score_mission(
    mission: Mission,
    available_time: int,
    energy: str,
    preferred_category: Optional[str],
    recent_mission_ids: List[int],
    has_reusable_bottle: bool,
) -> float:
    """
    Score a mission from 0.0 to 1.0 for recommendation suitability.
    Higher = better match.
    """
    score = 0.5  # base score

    # Time fit: prefer missions that fit within available time
    time_diff = available_time - mission.duration_minutes
    if time_diff < 0:
        # Mission takes longer than available time - significant penalty
        score -= 0.4
    elif time_diff <= DURATION_TOLERANCE:
        score += 0.3  # perfect fit
    elif time_diff <= 10:
        score += 0.15
    else:
        score += 0.05  # too short for available time

    # Energy fit
    suitable_categories = ENERGY_CATEGORY_MAP.get(energy, ["hydration", "meals"])
    if mission.category in suitable_categories:
        score += 0.2

    # Category preference
    if preferred_category and mission.category == preferred_category:
        score += 0.25
    elif preferred_category and mission.category != preferred_category:
        score -= 0.1

    # Avoid repetition
    if mission.id in recent_mission_ids[-3:]:  # avoid last 3 missions
        score -= 0.35
    elif mission.id in recent_mission_ids[-6:]:
        score -= 0.15

    # Hydration bonus if bottle available
    if mission.category == "hydration" and has_reusable_bottle:
        score += 0.1

    # Difficulty adjustment based on energy
    if energy == "tired" and mission.difficulty == "hard":
        score -= 0.2
    if energy == "energetic" and mission.difficulty == "hard":
        score += 0.1

    return max(0.0, min(1.0, score))


def get_recommendation_reason(
    mission: Mission,
    available_time: int,
    energy: str,
    preferred_category: Optional[str],
) -> str:
    """Generate a human-readable explanation for the recommendation."""
    reasons = []

    if mission.duration_minutes <= available_time:
        reasons.append(f"fits within your {available_time}-minute window")
    
    if energy == "tired" and mission.category in ["hydration", "meals"]:
        reasons.append("suitable for when you need a gentler activity")
    elif energy == "energetic" and mission.category in ["travel", "movement"]:
        reasons.append("a great match for your current energy level")
    
    if preferred_category and mission.category == preferred_category:
        reasons.append(f"matches your preferred focus: {preferred_category}")
    
    if mission.difficulty == "easy":
        reasons.append("beginner-friendly")

    if not reasons:
        reasons.append("a well-rounded activity for your current check-in")

    return "Selected because it " + " and ".join(reasons) + "."


def recommend_mission(
    db: Session,
    user_id: int,
    available_time: int,
    energy: str,
    preferred_category: Optional[str],
    has_reusable_bottle: bool,
    weekly_focus: Optional[str] = None,
) -> Optional[dict]:
    """
    Main recommendation function.
    Returns a dict with mission data and recommendation metadata.
    """
    # Fetch recent completion IDs to avoid repetition
    recent_completions = (
        db.query(MissionCompletion.mission_id)
        .filter(MissionCompletion.user_id == user_id)
        .order_by(MissionCompletion.completed_at.desc())
        .limit(10)
        .all()
    )
    recent_ids = [r.mission_id for r in recent_completions]

    # Fetch all active missions
    missions = db.query(Mission).filter(Mission.is_active == True).all()

    if not missions:
        return None

    # Score all missions
    scored = [
        (m, score_mission(m, available_time, energy, preferred_category, recent_ids, has_reusable_bottle))
        for m in missions
    ]

    # Sort by score descending, add small random tie-breaker for variety
    scored.sort(key=lambda x: x[1] + random.uniform(0, 0.05), reverse=True)

    best_mission, best_score = scored[0]

    reason = get_recommendation_reason(best_mission, available_time, energy, preferred_category)

    return {
        "mission": best_mission,
        "recommendation_score": round(best_score, 3),
        "reason": reason,
        "engine": "rule-based",  # Always transparent about engine type
        "inputs": {
            "available_time_minutes": available_time,
            "energy": energy,
            "preferred_category": preferred_category,
            "has_reusable_bottle": has_reusable_bottle,
        },
    }
