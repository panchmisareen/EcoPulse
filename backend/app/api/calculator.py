from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.user import User
from app.models.activity import ActivityLog
from app.schemas.calculator import (
    GenZFootprintRequest,
    IndiaFootprintRequest,
    SyncHabitsRequest,
)
from app.calculations.footprint_engine import (
    GENZ_CATEGORIES,
    EQUIVALENCIES,
    INDIAN_EMISSION_FACTORS,
    BENCHMARKS,
    TRACKER_CRITERIA,
    calculate_genz_footprint,
    calculate_india_footprint,
    calculate_unified_footprint,
)

router = APIRouter(prefix="/calculator", tags=["calculator"])


@router.get("/metadata")
def get_calculator_metadata():
    """Returns all factors, benchmarks, and category structures."""
    return {
        "genz_categories": GENZ_CATEGORIES,
        "equivalencies": EQUIVALENCIES,
        "indian_factors": INDIAN_EMISSION_FACTORS,
        "benchmarks": BENCHMARKS,
        "criteria": TRACKER_CRITERIA,
    }


@router.get("/criteria")
def get_tracker_criteria():
    """Returns methodology on what to include vs. delete/exclude in modern trackers."""
    return TRACKER_CRITERIA


@router.post("/genz")
def calculate_genz(payload: GenZFootprintRequest):
    """Calculates Gen Z daily footprint based on activity inputs."""
    result = calculate_genz_footprint(payload.inputs)
    return result


@router.post("/india")
def calculate_india(payload: IndiaFootprintRequest):
    """Calculates comprehensive India + Gen Z carbon footprint."""
    result = calculate_india_footprint(payload.model_dump())
    return result


@router.post("/unified")
def calculate_unified(payload: Dict[str, Any]):
    """Calculates all-in-one unified carbon footprint combining Indian utilities + Gen Z habits."""
    result = calculate_unified_footprint(payload)
    return result


@router.post("/sync-habits", status_code=status.HTTP_201_CREATED)
def sync_calculator_habits(
    payload: SyncHabitsRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Awards EcoPulse points and logs activity when user commits
    to daily low-carbon habits tracked in the calculator.
    """
    points_awarded = 25
    new_points = None

    if current_user:
        current_user.total_points += points_awarded
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="movement",
            sub_type="carbon_reduction_habits",
            duration_minutes=15.0,
            notes=f"Calculator Habit Log: {payload.summary} (Saved ~{payload.total_saved_co2_kg:.2f} kg CO2e)",
            extra_data={"habits": payload.habits_logged, "saved_co2_kg": payload.total_saved_co2_kg},
        )
        db.add(log)
        db.commit()
        db.refresh(current_user)
        new_points = current_user.total_points

    return {
        "status": "success",
        "points_awarded": points_awarded,
        "new_total_points": new_points,
        "message": f"Recorded habits! +{points_awarded} points added to your score.",
    }
