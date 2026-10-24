"""Badge service: check and award badges based on criteria."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.mission import MissionCompletion
from app.models.badge import Badge, UserBadge


def check_and_award_badges(db: Session, user: User) -> list:
    """Check all badge criteria and award any new badges. Returns list of newly earned badges."""
    all_badges = db.query(Badge).filter(Badge.is_active == True).all()
    existing_badge_ids = {ub.badge_id for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()}

    newly_earned = []

    total_missions = db.query(func.count(MissionCompletion.id)).filter(
        MissionCompletion.user_id == user.id
    ).scalar() or 0

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue

        earned = False
        if badge.criteria_type == "missions_count":
            earned = total_missions >= badge.criteria_value
        elif badge.criteria_type == "streak":
            earned = user.longest_streak >= badge.criteria_value
        elif badge.criteria_type == "points":
            earned = user.total_points >= badge.criteria_value
        elif badge.criteria_type == "travel_missions":
            travel_missions = db.query(func.count(MissionCompletion.id)).join(
                MissionCompletion.mission
            ).filter(
                MissionCompletion.user_id == user.id,
                MissionCompletion.mission.has(category="travel"),
            ).scalar() or 0
            earned = travel_missions >= badge.criteria_value
        elif badge.criteria_type == "meal_missions":
            meal_missions = db.query(func.count(MissionCompletion.id)).join(
                MissionCompletion.mission
            ).filter(
                MissionCompletion.user_id == user.id,
                MissionCompletion.mission.has(category="meals"),
            ).scalar() or 0
            earned = meal_missions >= badge.criteria_value
        elif badge.criteria_type == "hydration_missions":
            hydration_missions = db.query(func.count(MissionCompletion.id)).join(
                MissionCompletion.mission
            ).filter(
                MissionCompletion.user_id == user.id,
                MissionCompletion.mission.has(category="hydration"),
            ).scalar() or 0
            earned = hydration_missions >= badge.criteria_value
        elif badge.criteria_type == "movement_missions":
            movement_missions = db.query(func.count(MissionCompletion.id)).join(
                MissionCompletion.mission
            ).filter(
                MissionCompletion.user_id == user.id,
                MissionCompletion.mission.has(category="movement"),
            ).scalar() or 0
            earned = movement_missions >= badge.criteria_value

        if earned:
            user_badge = UserBadge(user_id=user.id, badge_id=badge.id)
            db.add(user_badge)
            newly_earned.append(badge)

    return newly_earned
