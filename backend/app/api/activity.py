from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.activity import ActivityLog, Goal
from app.schemas.activity import ActivityLogCreate, ActivityLogResponse, GoalCreate, GoalResponse, ImpactSummary
from app.calculations.impact import (
    calculate_travel_co2_avoided,
    calculate_bottles_avoided,
    calculate_bottles_co2_avoided,
    calculate_meal_swap_co2_avoided,
    get_assumptions_doc,
)
from sqlalchemy import func

router = APIRouter(tags=["activity"])


@router.post("/activity/log", response_model=ActivityLogResponse, status_code=201)
def log_activity(
    payload: ActivityLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    points_to_award = 15
    if payload.activity_type == "travel":
        points_to_award = max(10, int((payload.distance_km or 2.0) * 5))
    elif payload.activity_type == "hydration":
        points_to_award = 10
    elif payload.activity_type == "meal_swap":
        points_to_award = 15
    elif payload.activity_type == "movement":
        points_to_award = 10

    current_user.total_points += points_to_award
    log = ActivityLog(user_id=current_user.id, **payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    db.refresh(current_user)

    res = ActivityLogResponse.model_validate(log)
    res.points_earned = points_to_award
    res.new_total_points = current_user.total_points
    return res


@router.get("/activity/logs", response_model=List[ActivityLogResponse])
def get_activity_logs(
    limit: int = Query(50, ge=1, le=200),
    activity_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id)
    if activity_type:
        q = q.filter(ActivityLog.activity_type == activity_type)
    return q.order_by(ActivityLog.logged_at.desc()).limit(limit).all()


@router.get("/goals", response_model=List[GoalResponse])
def get_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Goal).filter(Goal.user_id == current_user.id, Goal.is_active == True).all()


@router.post("/goals", response_model=GoalResponse, status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Deactivate existing goal of same category
    existing = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.category == payload.category,
        Goal.is_active == True,
    ).first()
    if existing:
        existing.is_active = False

    goal = Goal(user_id=current_user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/impact/summary", response_model=ImpactSummary)
def get_impact_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).all()

    # Travel
    travel_logs = [l for l in logs if l.activity_type == "travel"]
    total_travel_km = sum(l.distance_km or 0 for l in travel_logs)
    total_travel_minutes = sum(l.duration_minutes or 0 for l in travel_logs)

    # Calculate CO2 avoided per log
    co2_values = []
    for l in travel_logs:
        if l.sub_type and l.distance_km:
            val = calculate_travel_co2_avoided(l.sub_type, l.distance_km)
            if val is not None:
                co2_values.append(val)

    co2_estimate_available = len(co2_values) > 0
    estimated_co2_avoided_kg = round(sum(co2_values), 3) if co2_estimate_available else None

    # Meals
    meal_logs = [l for l in logs if l.activity_type == "meal_swap"]
    total_meal_swaps = len(meal_logs)
    estimated_meal_co2_avoided_kg = calculate_meal_swap_co2_avoided(total_meal_swaps)

    # Movement
    movement_logs = [l for l in logs if l.activity_type == "movement"]
    total_movement_minutes = sum(l.duration_minutes or 0 for l in movement_logs)
    total_movement_sessions = len(movement_logs)

    # Hydration
    hydration_logs = [l for l in logs if l.activity_type == "hydration"]
    total_water_ml = sum(l.water_ml or 0 for l in hydration_logs)
    total_reusable_bottle_uses = sum(1 for l in hydration_logs if l.reusable_bottle)
    estimated_bottles_avoided = calculate_bottles_avoided(total_reusable_bottle_uses)
    estimated_bottle_co2_avoided_kg = calculate_bottles_co2_avoided(estimated_bottles_avoided)

    # Missions
    from app.models.mission import MissionCompletion
    total_missions = db.query(func.count(MissionCompletion.id)).filter(
        MissionCompletion.user_id == current_user.id
    ).scalar()

    return ImpactSummary(
        total_travel_km=round(total_travel_km, 2),
        total_travel_minutes=round(total_travel_minutes, 1),
        estimated_co2_avoided_kg=estimated_co2_avoided_kg,
        co2_estimate_available=co2_estimate_available,
        total_meal_swaps=total_meal_swaps,
        estimated_meal_co2_avoided_kg=estimated_meal_co2_avoided_kg,
        total_movement_minutes=round(total_movement_minutes, 1),
        total_movement_sessions=total_movement_sessions,
        total_water_ml=total_water_ml,
        total_reusable_bottle_uses=total_reusable_bottle_uses,
        estimated_bottles_avoided=estimated_bottles_avoided,
        estimated_bottle_co2_avoided_kg=estimated_bottle_co2_avoided_kg,
        total_missions_completed=total_missions or 0,
        total_points=current_user.total_points,
        estimate_disclaimer=(
            "All impact metrics are ESTIMATES based on documented emission factors. "
            "They are not verified measurements."
        ),
        assumptions=get_assumptions_doc(),
    )


@router.get("/impact/ai-insight")
def get_ai_impact_insight(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.gemini_service import generate_gemini_impact_analysis

    logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).all()
    travel_km = sum(l.distance_km or 0 for l in logs if l.activity_type == "travel")
    bottles = sum(1 for l in logs if l.activity_type == "hydration" and l.reusable_bottle)
    meal_swaps = sum(1 for l in logs if l.activity_type == "meal_swap")
    total_co2 = round((travel_km * 0.21) + (meal_swaps * 1.50) + (bottles * 0.083), 2)

    insight = generate_gemini_impact_analysis(
        total_co2=total_co2,
        travel_km=round(travel_km, 1),
        bottles=bottles,
        meal_swaps=meal_swaps,
        points=current_user.total_points,
    )
    return insight

