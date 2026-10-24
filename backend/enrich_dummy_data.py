import sys
import os
from datetime import datetime, timezone, timedelta
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.mission import Mission, MissionCompletion
from app.models.activity import ActivityLog, Goal
from app.models.badge import Badge, UserBadge, Team, TeamMembership
from app.models.location import CampusLocation

def enrich():
    db = SessionLocal()
    try:
        print("🌱 Enriching EcoPulse database with rich dummy telemetry...")

        # 1. Get or create demo user
        demo_user = db.query(User).filter(User.is_demo == True, User.id == 1).first()
        if not demo_user:
            demo_user = User(
                id=1,
                email="demo@ecopulse.app",
                username="alex_green",
                full_name="Alex Green",
                hashed_password=get_password_hash("demo1234"),
                is_demo=True,
                total_points=840,
                current_streak=6,
                longest_streak=12,
                avatar_color="#15803D",
                bio="AI & Sustainability explorer at PW IOI Noida. Commuting clean & drinking zero-PET.",
                weekly_focus="Active Cycling & Zero-Waste Hydration",
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            demo_user.total_points = max(demo_user.total_points, 840)
            demo_user.current_streak = 6
            demo_user.bio = "AI & Sustainability explorer at PW IOI Noida. Commuting clean & drinking zero-PET."
            demo_user.weekly_focus = "Active Cycling & Zero-Waste Hydration"
            db.commit()

        # 2. Add realistic Activity Logs over the past 10 days for Alex
        now = datetime.now(timezone.utc)
        sample_activities = [
            {"activity_type": "travel", "sub_type": "bicycle", "distance_km": 3.2, "duration_minutes": 18, "days_ago": 1},
            {"activity_type": "hydration", "water_ml": 500, "reusable_bottle": True, "days_ago": 1},
            {"activity_type": "meal_swap", "notes": "Millets bowl at Green Cafe", "days_ago": 2},
            {"activity_type": "travel", "sub_type": "walk", "distance_km": 1.5, "duration_minutes": 15, "days_ago": 2},
            {"activity_type": "hydration", "water_ml": 750, "reusable_bottle": True, "days_ago": 2},
            {"activity_type": "movement", "duration_minutes": 15, "days_ago": 3},
            {"activity_type": "meal_swap", "notes": "Plant protein salad swap", "days_ago": 3},
            {"activity_type": "travel", "sub_type": "bicycle", "distance_km": 4.0, "duration_minutes": 22, "days_ago": 4},
            {"activity_type": "hydration", "water_ml": 500, "reusable_bottle": True, "days_ago": 4},
            {"activity_type": "travel", "sub_type": "walk", "distance_km": 2.0, "duration_minutes": 20, "days_ago": 5},
            {"activity_type": "meal_swap", "notes": "Oat milk chia bowl", "days_ago": 6},
            {"activity_type": "hydration", "water_ml": 1000, "reusable_bottle": True, "days_ago": 6},
            {"activity_type": "movement", "duration_minutes": 20, "days_ago": 7},
            {"activity_type": "travel", "sub_type": "bicycle", "distance_km": 3.5, "duration_minutes": 19, "days_ago": 8},
        ]

        existing_logs_count = db.query(ActivityLog).filter(ActivityLog.user_id == demo_user.id).count()
        if existing_logs_count < 12:
            for act in sample_activities:
                log_time = now - timedelta(days=act["days_ago"], hours=random.randint(1, 8))
                db.add(ActivityLog(
                    user_id=demo_user.id,
                    activity_type=act["activity_type"],
                    sub_type=act.get("sub_type"),
                    distance_km=act.get("distance_km"),
                    duration_minutes=act.get("duration_minutes"),
                    water_ml=act.get("water_ml"),
                    reusable_bottle=act.get("reusable_bottle", False),
                    notes=act.get("notes"),
                    logged_at=log_time,
                ))
            db.commit()
            print("  ✓ Added past activity logs for demo user")

        # 3. Add rich Leaderboard users (students of PW IOI)
        students = [
            {"email": "priya.sharma@demo.ecopulse.app", "username": "priya_s", "full_name": "Priya Sharma", "total_points": 980, "current_streak": 8, "avatar_color": "#2563EB"},
            {"email": "rohit.verma@demo.ecopulse.app", "username": "rohit_v", "full_name": "Rohit Verma", "total_points": 920, "current_streak": 7, "avatar_color": "#7C3AED"},
            {"email": "ananya.singh@demo.ecopulse.app", "username": "ananya_s", "full_name": "Ananya Singh", "total_points": 880, "current_streak": 6, "avatar_color": "#059669"},
            {"email": "arjun.patel@demo.ecopulse.app", "username": "arjun_p", "full_name": "Arjun Patel", "total_points": 790, "current_streak": 5, "avatar_color": "#D97706"},
            {"email": "sara.mehta@demo.ecopulse.app", "username": "sara_m", "full_name": "Sara Mehta", "total_points": 710, "current_streak": 4, "avatar_color": "#0891B2"},
            {"email": "dev.rao@demo.ecopulse.app", "username": "dev_r", "full_name": "Dev Rao", "total_points": 640, "current_streak": 3, "avatar_color": "#9D174D"},
            {"email": "zara.khan@demo.ecopulse.app", "username": "zara_k", "full_name": "Zara Khan", "total_points": 580, "current_streak": 9, "avatar_color": "#166534"},
            {"email": "kabir.nair@demo.ecopulse.app", "username": "kabir_n", "full_name": "Kabir Nair", "total_points": 520, "current_streak": 2, "avatar_color": "#C026D3"},
            {"email": "tanvi.joshi@demo.ecopulse.app", "username": "tanvi_j", "full_name": "Tanvi Joshi", "total_points": 460, "current_streak": 4, "avatar_color": "#EA580C"},
            {"email": "manav.gupta@demo.ecopulse.app", "username": "manav_g", "full_name": "Manav Gupta", "total_points": 410, "current_streak": 1, "avatar_color": "#0284C7"},
        ]

        for s in students:
            existing = db.query(User).filter((User.email == s["email"]) | (User.username == s["username"])).first()
            if not existing:
                u = User(
                    email=s["email"],
                    username=s["username"],
                    full_name=s["full_name"],
                    hashed_password=get_password_hash("demo1234"),
                    is_demo=True,
                    total_points=s["total_points"],
                    current_streak=s["current_streak"],
                    longest_streak=s["current_streak"] + random.randint(2, 6),
                    avatar_color=s["avatar_color"],
                )
                db.add(u)
            else:
                existing.total_points = s["total_points"]
                existing.current_streak = s["current_streak"]
        db.commit()
        print(f"  ✓ {len(students)} students seeded on PW IOI leaderboard")

        # 4. Teams & Hostels
        teams_data = [
            {"name": "Silver Springs Innovation Hostel", "description": "PW IOI Campus residence hub for AI & clean tech innovators.", "team_type": "hostel", "avatar_color": "#0A2518"},
            {"name": "Sector 126 Green Commuters", "description": "Active cyclists and walkers commuting via Noida expressway.", "team_type": "club", "avatar_color": "#15803D"},
            {"name": "PW IOI Zero-Waste Squad", "description": "Single-use plastic elimination & segregated e-waste champions.", "team_type": "club", "avatar_color": "#0284C7"},
            {"name": "Aryabhata Tech Wing", "description": "Computer Science & Robotics undergraduate team.", "team_type": "class", "avatar_color": "#7C3AED"},
        ]

        for td in teams_data:
            existing_t = db.query(Team).filter(Team.name == td["name"]).first()
            if not existing_t:
                db.add(Team(**td, is_demo=True))
        db.commit()

        # 5. Award badges to demo user
        from app.services.badge_service import check_and_award_badges
        check_and_award_badges(db, demo_user)
        db.commit()
        print("  ✓ Badges awarded to demo user")

        print("✅ Database enrichment complete!")
    finally:
        db.close()

if __name__ == "__main__":
    enrich()
