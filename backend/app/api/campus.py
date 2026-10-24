from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.location import CampusLocation
from app.models.activity import ActivityLog
from app.schemas.leaderboard import CampusLocationResponse
from app.services.badge_service import check_and_award_badges
from pydantic import BaseModel

router = APIRouter(prefix="/campus", tags=["campus"])


class CampusCheckinResponse(BaseModel):
    success: bool
    message: str
    points_earned: int
    new_total_points: int
    location_name: str


@router.get("/locations", response_model=List[CampusLocationResponse])
def get_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CampusLocation).filter(CampusLocation.is_active == True).all()


@router.post("/locations/{location_id}/checkin", response_model=CampusCheckinResponse)
def checkin_at_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loc = db.query(CampusLocation).filter(CampusLocation.id == location_id, CampusLocation.is_active == True).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Campus location not found")

    points_to_award = 15
    current_user.total_points = (current_user.total_points or 0) + points_to_award

    # Log corresponding activity based on location category
    if loc.category == "water_refill":
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="hydration",
            sub_type="water_station_refill",
            water_ml=500,
            reusable_bottle=True,
            notes=f"Refilled reusable bottle at {loc.name}",
        )
        db.add(log)
    elif loc.category == "bike_parking":
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="travel",
            sub_type="cycle",
            distance_km=2.5,
            duration_minutes=12,
            notes=f"Parked eco-friendly bike at {loc.name}",
        )
        db.add(log)
    elif loc.category == "walking_route":
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="movement",
            sub_type="canopy_walk",
            distance_km=1.4,
            duration_minutes=15,
            notes=f"Walked scenic trail at {loc.name}",
        )
        db.add(log)
    elif loc.category == "food":
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="meals",
            sub_type="plant_bowl",
            notes=f"Ordered low-carbon food at {loc.name}",
        )
        db.add(log)
    else:
        log = ActivityLog(
            user_id=current_user.id,
            activity_type="movement",
            sub_type="eco_hub",
            notes=f"Eco action checked in at {loc.name}",
        )
        db.add(log)

    check_and_award_badges(db, current_user)
    db.commit()
    db.refresh(current_user)

    return CampusCheckinResponse(
        success=True,
        message=f"Awesome! Checked in at {loc.name}. Earned +{points_to_award} pts!",
        points_earned=points_to_award,
        new_total_points=current_user.total_points,
        location_name=loc.name,
    )
