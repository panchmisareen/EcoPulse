from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.mission import Mission, MissionCompletion
from app.schemas.mission import MissionResponse, MissionCompleteRequest, MissionCompletionResponse, CoachRequest, CoachResponse
from app.calculations.coach import recommend_mission
from app.services.badge_service import check_and_award_badges
from datetime import datetime, timezone

router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("", response_model=List[MissionResponse])
def list_missions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    duration_max: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Mission).filter(Mission.is_active == True)
    if category:
        q = q.filter(Mission.category == category)
    if difficulty:
        q = q.filter(Mission.difficulty == difficulty)
    if duration_max:
        q = q.filter(Mission.duration_minutes <= duration_max)
    return q.order_by(Mission.category, Mission.difficulty, Mission.title).all()


@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(mission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission


@router.post("/{mission_id}/complete", response_model=MissionCompletionResponse, status_code=201)
def complete_mission(
    mission_id: int,
    payload: MissionCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mission = db.query(Mission).filter(Mission.id == mission_id, Mission.is_active == True).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Allow repeated testing for demo users; enforce cooldown only for standard users
    if not current_user.is_demo:
        from datetime import timedelta
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_completion = (
            db.query(MissionCompletion)
            .filter(
                MissionCompletion.user_id == current_user.id,
                MissionCompletion.mission_id == mission_id,
                MissionCompletion.completed_at >= one_hour_ago,
            )
            .first()
        )
        if recent_completion:
            raise HTTPException(
                status_code=409,
                detail="This mission was already completed recently. Wait at least 1 hour before completing it again.",
            )

    completion = MissionCompletion(
        user_id=current_user.id,
        mission_id=mission_id,
        points_awarded=mission.points,
        notes=payload.notes,
        metadata_=payload.metadata,
    )
    db.add(completion)

    # Automatically create associated ActivityLog entry so impact counters update
    try:
        from app.models.activity import ActivityLog
        activity_type = mission.category
        if activity_type == "travel":
            log = ActivityLog(
                user_id=current_user.id,
                activity_type="travel",
                distance_km=2.5,
                transport_mode="walking",
                duration_minutes=mission.duration_minutes,
                co2_avoided_kg=0.52,
                points_earned=mission.points,
            )
            db.add(log)
        elif activity_type == "meals":
            log = ActivityLog(
                user_id=current_user.id,
                activity_type="meal_swap",
                meal_type="lunch",
                co2_avoided_kg=1.5,
                points_earned=mission.points,
            )
            db.add(log)
        elif activity_type == "hydration":
            log = ActivityLog(
                user_id=current_user.id,
                activity_type="hydration",
                hydration_ml=500,
                reusable_bottle=True,
                points_earned=mission.points,
            )
            db.add(log)
        elif activity_type == "movement":
            log = ActivityLog(
                user_id=current_user.id,
                activity_type="movement",
                duration_minutes=mission.duration_minutes,
                points_earned=mission.points,
            )
            db.add(log)
    except Exception:
        pass

    # Award points to user (server-side only)
    current_user.total_points += mission.points

    # Update streak
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if current_user.last_activity_date == today:
        pass  # Already counted today
    elif current_user.last_activity_date:
        from datetime import date
        last = date.fromisoformat(current_user.last_activity_date)
        diff = (date.fromisoformat(today) - last).days
        if diff == 1:
            current_user.current_streak += 1
        elif diff > 1:
            current_user.current_streak = 1
    else:
        current_user.current_streak = 1

    current_user.last_activity_date = today
    if current_user.current_streak > current_user.longest_streak:
        current_user.longest_streak = current_user.current_streak

    db.commit()
    db.refresh(completion)
    db.refresh(current_user)

    # Check and award badges (non-blocking)
    try:
        check_and_award_badges(db, current_user)
        db.commit()
    except Exception:
        pass  # Badges are nice-to-have, don't fail the completion

    return MissionCompletionResponse(
        id=completion.id,
        mission_id=mission_id,
        mission_title=mission.title,
        points_awarded=completion.points_awarded,
        new_total_points=current_user.total_points,
        completed_at=completion.completed_at,
        notes=completion.notes,
    )


@router.get("/completions/history", response_model=List[MissionCompletionResponse])
def get_completion_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    completions = (
        db.query(MissionCompletion)
        .filter(MissionCompletion.user_id == current_user.id)
        .order_by(MissionCompletion.completed_at.desc())
        .limit(limit)
        .all()
    )
    return [
        MissionCompletionResponse(
            id=c.id,
            mission_id=c.mission_id,
            mission_title=c.mission.title,
            points_awarded=c.points_awarded,
            completed_at=c.completed_at,
            notes=c.notes,
        )
        for c in completions
    ]
