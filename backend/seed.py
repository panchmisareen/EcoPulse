"""
Seed script for EcoPulse database.
Run: python seed.py

Creates:
- Demo user and additional demo users for leaderboard
- 20+ missions across all 4 categories
- Sample badges
- Sample campus locations
- Sample mission completions and activity logs for demo user
- Teams and memberships
"""

import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.mission import Mission, MissionCompletion
from app.models.activity import ActivityLog, Goal
from app.models.badge import Badge, UserBadge, Team, TeamMembership
from app.models.location import CampusLocation
from datetime import datetime, timezone, timedelta, date
import random

random.seed(42)


def seed():
    init_db()
    db = SessionLocal()

    try:
        print("🌱 Seeding EcoPulse database...")

        # ─── Badges ──────────────────────────────────────────────────────────────
        badge_defs = [
            {"name": "First Step", "description": "Complete your first mission", "icon": "footprints", "color": "#D9F99D", "category": "general", "criteria_type": "missions_count", "criteria_value": 1},
            {"name": "Habit Builder", "description": "Complete 5 missions", "icon": "layers", "color": "#86EFAC", "category": "general", "criteria_type": "missions_count", "criteria_value": 5},
            {"name": "Mission Champion", "description": "Complete 25 missions", "icon": "trophy", "color": "#FCD34D", "category": "general", "criteria_type": "missions_count", "criteria_value": 25},
            {"name": "Century Club", "description": "Earn 100 points", "icon": "star", "color": "#FCD34D", "category": "points", "criteria_type": "points", "criteria_value": 100},
            {"name": "Point Legend", "description": "Earn 1000 points", "icon": "zap", "color": "#F97316", "category": "points", "criteria_type": "points", "criteria_value": 1000},
            {"name": "3-Day Streak", "description": "Maintain a 3-day activity streak", "icon": "flame", "color": "#F97316", "category": "streak", "criteria_type": "streak", "criteria_value": 3},
            {"name": "Week Warrior", "description": "Maintain a 7-day activity streak", "icon": "flame", "color": "#EF4444", "category": "streak", "criteria_type": "streak", "criteria_value": 7},
            {"name": "Green Commuter", "description": "Complete 5 active travel missions", "icon": "bike", "color": "#34D399", "category": "travel", "criteria_type": "travel_missions", "criteria_value": 5},
            {"name": "Plant Powered", "description": "Complete 5 meal swap missions", "icon": "salad", "color": "#A3E635", "category": "meals", "criteria_type": "meal_missions", "criteria_value": 5},
            {"name": "Hydration Hero", "description": "Complete 5 hydration missions", "icon": "droplets", "color": "#60A5FA", "category": "hydration", "criteria_type": "hydration_missions", "criteria_value": 5},
            {"name": "Move More", "description": "Complete 5 movement missions", "icon": "activity", "color": "#C084FC", "category": "movement", "criteria_type": "movement_missions", "criteria_value": 5},
        ]

        existing_badges = {b.name for b in db.query(Badge).all()}
        badges_map = {}
        for b in badge_defs:
            if b["name"] not in existing_badges:
                badge = Badge(**b)
                db.add(badge)
                db.flush()
            else:
                badge = db.query(Badge).filter(Badge.name == b["name"]).first()
            badges_map[b["name"]] = badge
        db.commit()
        print(f"  ✓ {len(badge_defs)} badges ready")

        # ─── Missions ────────────────────────────────────────────────────────────
        missions_data = [
            # ACTIVE TRAVEL
            {
                "title": "Morning Walk to Campus",
                "description": "Start your day with an energising walk instead of taking a vehicle.",
                "category": "travel",
                "duration_minutes": 20,
                "difficulty": "easy",
                "instructions": [
                    "Pack your bag and leave 20 minutes earlier than usual.",
                    "Choose a pleasant route with greenery if possible.",
                    "Walk at a comfortable, brisk pace.",
                    "Notice 3 things in your environment you usually miss.",
                    "Log your distance and mark mission complete.",
                ],
                "points": 15,
                "metrics": {"distance_km": 1.5, "mode": "walk"},
                "icon": "footprints",
                "color": "#26734D",
                "tags": ["beginner", "outdoor", "morning"],
            },
            {
                "title": "Cycle to Class",
                "description": "Take your bike for your next trip to campus — zero emissions, great exercise.",
                "category": "travel",
                "duration_minutes": 20,
                "difficulty": "easy",
                "instructions": [
                    "Check your bike tyres and brakes before setting off.",
                    "Plan your route using cycle paths where available.",
                    "Lock your bike at a designated rack on campus.",
                    "Note your distance and time.",
                    "Log your trip and claim your points!",
                ],
                "points": 20,
                "metrics": {"distance_km": 3, "mode": "cycle"},
                "icon": "bike",
                "color": "#26734D",
                "tags": ["outdoor", "zero-emission"],
            },
            {
                "title": "Bus Instead of Rideshare",
                "description": "Choose the bus over a cab or rideshare for your next journey.",
                "category": "travel",
                "duration_minutes": 30,
                "difficulty": "easy",
                "instructions": [
                    "Check the bus schedule and route on your transit app.",
                    "Plan to leave slightly earlier to allow for bus timing.",
                    "Use the journey time to read, listen to a podcast, or relax.",
                    "Log the trip distance and mark complete.",
                ],
                "points": 12,
                "metrics": {"distance_km": 5, "mode": "bus"},
                "icon": "bus",
                "color": "#12372A",
                "tags": ["transit", "low-carbon"],
            },
            {
                "title": "Weekend Nature Walk",
                "description": "Explore a local park or nature trail on foot — good for you and zero emissions.",
                "category": "travel",
                "duration_minutes": 45,
                "difficulty": "medium",
                "instructions": [
                    "Choose a park, trail, or green space near you.",
                    "Walk for at least 30 minutes at a relaxed pace.",
                    "Take photos of 3 natural things that catch your eye.",
                    "Reflect briefly on your surroundings.",
                    "Log your walk.",
                ],
                "points": 25,
                "metrics": {"distance_km": 3, "mode": "walk"},
                "icon": "tree-pine",
                "color": "#12372A",
                "tags": ["weekend", "mindful", "outdoor"],
            },
            # PLANT-BASED MEALS
            {
                "title": "Swap Lunch for a Plant-Based Option",
                "description": "Choose a plant-based lunch today — it's easier than you think and genuinely delicious.",
                "category": "meals",
                "duration_minutes": 10,
                "difficulty": "easy",
                "instructions": [
                    "Browse the campus canteen or local options for plant-based choices.",
                    "Look for dishes with legumes, vegetables, grains, or tofu.",
                    "Order or prepare your meal mindfully.",
                    "Enjoy it! Take a moment to appreciate the food.",
                    "Log your meal swap.",
                ],
                "points": 15,
                "metrics": {"meal_type": "lunch", "plant_based": True},
                "icon": "salad",
                "color": "#4ADE80",
                "tags": ["food", "easy", "daily"],
            },
            {
                "title": "Homemade Veggie Meal",
                "description": "Cook a plant-based meal from scratch — a great skill and a greener choice.",
                "category": "meals",
                "duration_minutes": 30,
                "difficulty": "medium",
                "instructions": [
                    "Choose a simple recipe: veggie curry, pasta primavera, lentil soup, or stir-fry.",
                    "Shop for fresh ingredients or use what's in your kitchen.",
                    "Cook without any meat or fish.",
                    "Eat and enjoy your creation!",
                    "Log your meal swap — extra points for cooking from scratch.",
                ],
                "points": 20,
                "metrics": {"meal_type": "dinner", "plant_based": True, "home_cooked": True},
                "icon": "chef-hat",
                "color": "#4ADE80",
                "tags": ["cooking", "skills", "savings"],
            },
            {
                "title": "Plant-Based Snack Swap",
                "description": "Replace a processed snack with a plant-based whole-food alternative.",
                "category": "meals",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Skip the crisps or chocolate bar for today's snack.",
                    "Choose fruit, nuts, hummus with veggies, or similar.",
                    "Notice how you feel after eating it.",
                    "Log your snack swap.",
                ],
                "points": 10,
                "metrics": {"meal_type": "snack", "plant_based": True},
                "icon": "apple",
                "color": "#86EFAC",
                "tags": ["snack", "quick", "easy"],
            },
            {
                "title": "Reduce Food Waste",
                "description": "Use up leftover ingredients creatively — saving food is saving resources.",
                "category": "meals",
                "duration_minutes": 20,
                "difficulty": "easy",
                "instructions": [
                    "Check your fridge for ingredients close to their use-by date.",
                    "Plan a simple meal using those ingredients.",
                    "Cook and eat your meal.",
                    "Log this as a meal swap (plant-based waste-reduction meal).",
                ],
                "points": 15,
                "metrics": {"waste_reduction": True},
                "icon": "recycle",
                "color": "#86EFAC",
                "tags": ["food-waste", "creative"],
            },
            # ADAPTIVE MOVEMENT
            {
                "title": "5-Minute Desk Stretch",
                "description": "Quick stretching routine to release tension — perfect between lectures.",
                "category": "movement",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Stand up from your desk or chair.",
                    "Neck rolls: slowly roll your head in a circle 5 times each side.",
                    "Shoulder shrugs: raise and drop shoulders 10 times.",
                    "Torso twist: hands on hips, twist left and right 10 times.",
                    "Calf raises: rise on toes 15 times.",
                    "Take 3 slow, deep breaths. Log and you're done!",
                ],
                "points": 10,
                "metrics": {"duration_minutes": 5, "type": "stretching"},
                "icon": "activity",
                "color": "#A78BFA",
                "tags": ["quick", "desk", "beginner"],
            },
            {
                "title": "10-Minute Bodyweight Break",
                "description": "A short bodyweight circuit to re-energise your mind and body.",
                "category": "movement",
                "duration_minutes": 10,
                "difficulty": "easy",
                "instructions": [
                    "Find a small clear space.",
                    "10 squats — feet shoulder-width apart, back straight.",
                    "10 push-ups (or modified on knees).",
                    "20-second plank hold.",
                    "10 lunges (each leg).",
                    "Rest 1 minute and repeat once.",
                    "Log your session!",
                ],
                "points": 15,
                "metrics": {"duration_minutes": 10, "type": "bodyweight"},
                "icon": "dumbbell",
                "color": "#A78BFA",
                "tags": ["circuit", "no-equipment"],
            },
            {
                "title": "20-Minute Mindful Walk",
                "description": "A slow, mindful walk with no earphones — just you and your thoughts.",
                "category": "movement",
                "duration_minutes": 20,
                "difficulty": "easy",
                "instructions": [
                    "Leave your phone in your pocket — no music or podcasts.",
                    "Walk at a relaxed pace for 20 minutes.",
                    "Focus on your breathing and your surroundings.",
                    "Notice sounds, smells, and the sensation of movement.",
                    "Return feeling refreshed. Log your walk.",
                ],
                "points": 20,
                "metrics": {"duration_minutes": 20, "type": "mindful_walk"},
                "icon": "wind",
                "color": "#C084FC",
                "tags": ["mindfulness", "outdoor", "low-intensity"],
            },
            {
                "title": "Staircase Challenge",
                "description": "Take the stairs wherever you go today — skip the lifts and escalators.",
                "category": "movement",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Commit to using stairs only for the next 2 hours.",
                    "Each time you need to go up or down, find the staircase.",
                    "Track how many flights you climb.",
                    "Log your staircase challenge with total flights.",
                ],
                "points": 12,
                "metrics": {"type": "stairs"},
                "icon": "trending-up",
                "color": "#A78BFA",
                "tags": ["building", "easy", "daily"],
            },
            {
                "title": "20-Minute Yoga Flow",
                "description": "A beginner-friendly yoga sequence for flexibility and calm.",
                "category": "movement",
                "duration_minutes": 20,
                "difficulty": "medium",
                "instructions": [
                    "Find a quiet space with a mat or soft floor.",
                    "Start with 2 minutes of deep breathing.",
                    "Cat-Cow stretch: 10 slow reps.",
                    "Child's Pose: hold for 1 minute.",
                    "Downward Dog: hold for 30 seconds, 3 times.",
                    "Warrior I and II: 30 seconds each side.",
                    "Finish with Savasana (lying still) for 2 minutes.",
                    "Log your yoga session.",
                ],
                "points": 20,
                "metrics": {"duration_minutes": 20, "type": "yoga"},
                "icon": "heart",
                "color": "#C084FC",
                "tags": ["yoga", "flexibility", "calm"],
            },
            # HYDRATION
            {
                "title": "Morning Hydration Ritual",
                "description": "Start your day with two glasses of water before anything else.",
                "category": "hydration",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Place a glass of water by your bed before sleeping.",
                    "Drink it immediately when you wake up.",
                    "Have a second glass within 30 minutes.",
                    "Log 500 ml of water consumed.",
                ],
                "points": 10,
                "metrics": {"water_ml": 500},
                "icon": "droplets",
                "color": "#60A5FA",
                "tags": ["morning", "habit", "quick"],
            },
            {
                "title": "Reusable Bottle Refill Mission",
                "description": "Refill your reusable bottle at a campus water station — skip the single-use plastic.",
                "category": "hydration",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Bring your reusable water bottle with you today.",
                    "Locate a water refill station on campus (check the Campus Green Map!).",
                    "Refill your bottle at least once.",
                    "Drink the full bottle during your day.",
                    "Log your refill — you've avoided a single-use bottle!",
                ],
                "points": 15,
                "metrics": {"water_ml": 500, "reusable_bottle": True, "bottles_avoided": 1},
                "icon": "bottle-water",
                "color": "#3B82F6",
                "tags": ["plastic-free", "campus", "refill"],
            },
            {
                "title": "Daily Hydration Goal",
                "description": "Meet your personal daily hydration target using your reusable bottle.",
                "category": "hydration",
                "duration_minutes": 5,
                "difficulty": "easy",
                "instructions": [
                    "Set a hydration reminder on your phone for every 2 hours.",
                    "Each time the reminder fires, drink a glass of water.",
                    "Aim for your personal daily target (set in your profile).",
                    "Use a reusable bottle throughout the day.",
                    "Log your total water intake at the end of the day.",
                ],
                "points": 15,
                "metrics": {"water_ml": 2000, "reusable_bottle": True},
                "icon": "droplets",
                "color": "#60A5FA",
                "tags": ["daily", "habit", "goal"],
            },
            {
                "title": "Herbal Tea Swap",
                "description": "Swap a sugary drink for herbal tea today — hydrating and zero waste.",
                "category": "hydration",
                "duration_minutes": 10,
                "difficulty": "easy",
                "instructions": [
                    "Skip the fizzy drink, energy drink, or packaged juice for one drink today.",
                    "Brew a cup of herbal tea (peppermint, chamomile, ginger — whatever you enjoy).",
                    "Use a reusable cup or mug.",
                    "Sip slowly and enjoy the warmth.",
                    "Log 250 ml of hydration.",
                ],
                "points": 10,
                "metrics": {"water_ml": 250, "reusable_bottle": True},
                "icon": "coffee",
                "color": "#60A5FA",
                "tags": ["swap", "wellness", "easy"],
            },
        ]

        existing_missions = {m.title for m in db.query(Mission).all()}
        mission_objs = []
        for m in missions_data:
            if m["title"] not in existing_missions:
                mission = Mission(**m)
                db.add(mission)
                mission_objs.append(mission)
        db.commit()
        db.flush()
        all_missions = db.query(Mission).all()
        print(f"  ✓ {len(all_missions)} missions ready")

        # ─── Demo User ────────────────────────────────────────────────────────────
        demo_user = db.query(User).filter(User.id == 1).first()
        if not demo_user:
            demo_user = User(
                email="demo@ecopulse.app",
                username="eco_demo",
                full_name="Alex Green",
                hashed_password=get_password_hash("demo1234"),
                avatar_color="#26734D",
                bio="Passionate about sustainable living and student wellness. Demo account for EcoPulse.",
                is_demo=True,
                total_points=520,
                current_streak=5,
                longest_streak=12,
                last_activity_date=date.today().isoformat(),
                daily_hydration_goal_ml=2000,
                weekly_active_travel_goal_km=20,
                weekly_movement_goal_minutes=150,
                weekly_meal_swap_goal=5,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"  ✓ Demo user created (id={demo_user.id})")
        else:
            print(f"  ✓ Demo user exists (id={demo_user.id})")

        # ─── Additional Demo Users for Leaderboard ────────────────────────────────
        demo_users_data = [
            {"email": "priya@demo.ecopulse.app", "username": "priya_s", "full_name": "Priya Sharma", "total_points": 780, "current_streak": 8, "avatar_color": "#7C3AED"},
            {"email": "rahul@demo.ecopulse.app", "username": "rahul_k", "full_name": "Rahul Kumar", "total_points": 640, "current_streak": 3, "avatar_color": "#2563EB"},
            {"email": "meera@demo.ecopulse.app", "username": "meera_v", "full_name": "Meera Verma", "total_points": 590, "current_streak": 6, "avatar_color": "#DC2626"},
            {"email": "arjun@demo.ecopulse.app", "username": "arjun_p", "full_name": "Arjun Patel", "total_points": 460, "current_streak": 2, "avatar_color": "#D97706"},
            {"email": "sara@demo.ecopulse.app", "username": "sara_m", "full_name": "Sara Mehta", "total_points": 390, "current_streak": 4, "avatar_color": "#059669"},
            {"email": "dev@demo.ecopulse.app", "username": "dev_r", "full_name": "Dev Rao", "total_points": 310, "current_streak": 1, "avatar_color": "#0891B2"},
            {"email": "zara@demo.ecopulse.app", "username": "zara_k", "full_name": "Zara Khan", "total_points": 280, "current_streak": 7, "avatar_color": "#9D174D"},
        ]

        created_demo_users = [demo_user]
        for ud in demo_users_data:
            existing = db.query(User).filter(User.email == ud["email"]).first()
            if not existing:
                u = User(
                    **ud,
                    hashed_password=get_password_hash("demo1234"),
                    is_demo=True,
                    longest_streak=ud["current_streak"] + random.randint(0, 5),
                )
                db.add(u)
                created_demo_users.append(u)
        db.commit()
        print(f"  ✓ {len(demo_users_data)} additional demo users ready")

        # ─── Teams ────────────────────────────────────────────────────────────────
        team_defs = [
            {"name": "Green Hostel A", "description": "Residents of Hostel A united for sustainability.", "team_type": "hostel", "avatar_color": "#26734D", "is_demo": True},
            {"name": "CS & Engineering", "description": "Department team for Computer Science & Engineering.", "team_type": "class", "avatar_color": "#2563EB", "is_demo": True},
            {"name": "Eco Warriors", "description": "Cross-campus sustainability champions.", "team_type": "hostel", "avatar_color": "#7C3AED", "is_demo": True},
        ]
        existing_teams = {t.name for t in db.query(Team).all()}
        team_objs = []
        for t in team_defs:
            if t["name"] not in existing_teams:
                team = Team(**t)
                db.add(team)
                team_objs.append(team)
        db.commit()
        all_teams = db.query(Team).all()

        # Assign demo users to teams
        all_users = db.query(User).filter(User.is_demo == True).all()
        for i, user in enumerate(all_users):
            team = all_teams[i % len(all_teams)]
            existing_mem = db.query(TeamMembership).filter(
                TeamMembership.user_id == user.id, TeamMembership.team_id == team.id
            ).first()
            if not existing_mem:
                db.add(TeamMembership(user_id=user.id, team_id=team.id))
        db.commit()
        print(f"  ✓ {len(all_teams)} teams ready")

        # ─── Goals for Demo User ──────────────────────────────────────────────────
        existing_goals = db.query(Goal).filter(Goal.user_id == demo_user.id).first()
        if not existing_goals:
            goals_data = [
                {"category": "travel", "target_value": 20, "unit": "km", "period": "weekly"},
                {"category": "movement", "target_value": 150, "unit": "minutes", "period": "weekly"},
                {"category": "meals", "target_value": 5, "unit": "swaps", "period": "weekly"},
                {"category": "hydration", "target_value": 2000, "unit": "ml", "period": "daily"},
            ]
            for g in goals_data:
                db.add(Goal(user_id=demo_user.id, **g))
            db.commit()
            print("  ✓ Goals created for demo user")

        # ─── Mission Completions and Activity Logs for Demo User ─────────────────
        existing_completions = db.query(MissionCompletion).filter(
            MissionCompletion.user_id == demo_user.id
        ).count()

        if existing_completions == 0:
            missions_list = db.query(Mission).all()
            now = datetime.now(timezone.utc)

            for i, mission in enumerate(missions_list[:10]):
                days_ago = random.randint(0, 14)
                completed_at = now - timedelta(days=days_ago, hours=random.randint(0, 12))
                completion = MissionCompletion(
                    user_id=demo_user.id,
                    mission_id=mission.id,
                    points_awarded=mission.points,
                    completed_at=completed_at,
                    notes="Great mission!" if i % 3 == 0 else None,
                )
                db.add(completion)

                # Corresponding activity logs
                if mission.category == "travel":
                    db.add(ActivityLog(
                        user_id=demo_user.id,
                        activity_type="travel",
                        sub_type=mission.metrics.get("mode", "walk") if mission.metrics else "walk",
                        distance_km=mission.metrics.get("distance_km", 2) if mission.metrics else 2,
                        duration_minutes=mission.duration_minutes,
                        logged_at=completed_at,
                    ))
                elif mission.category == "meals":
                    db.add(ActivityLog(
                        user_id=demo_user.id,
                        activity_type="meal_swap",
                        notes="Plant-based meal swap",
                        logged_at=completed_at,
                    ))
                elif mission.category == "movement":
                    db.add(ActivityLog(
                        user_id=demo_user.id,
                        activity_type="movement",
                        duration_minutes=mission.duration_minutes,
                        logged_at=completed_at,
                    ))
                elif mission.category == "hydration":
                    db.add(ActivityLog(
                        user_id=demo_user.id,
                        activity_type="hydration",
                        water_ml=mission.metrics.get("water_ml", 500) if mission.metrics else 500,
                        reusable_bottle=mission.metrics.get("reusable_bottle", False) if mission.metrics else False,
                        logged_at=completed_at,
                    ))

            db.commit()
            print("  ✓ Demo mission completions and activity logs created")

        # Award earned badges to demo user
        from app.services.badge_service import check_and_award_badges
        check_and_award_badges(db, demo_user)
        db.commit()
        print("  ✓ Demo badges awarded")

        # ─── Campus Locations (PW IOI, Sector 126, Noida) ────────────────────────
        location_defs = [
            {"name": "PW IOI Main Lobby Water Refill", "description": "Filtered RO water refill station at the main reception lobby entrance.", "category": "water_refill", "latitude": 28.5341, "longitude": 77.3922, "map_x": 50.0, "map_y": 50.0, "address": "Silver Springs, Ground Floor, Sector 126", "is_demo": True},
            {"name": "First Floor Hydration Station", "description": "Chilled water dispenser near the co-working pods and study lounge.", "category": "water_refill", "latitude": 28.5343, "longitude": 77.3925, "map_x": 55.0, "map_y": 40.0, "address": "First Floor, Study Zone, Silver Springs", "is_demo": True},
            {"name": "Innovation Hub Water Point", "description": "Zero-plastic bottle refill station inside the innovation lab corridor.", "category": "water_refill", "latitude": 28.5338, "longitude": 77.3919, "map_x": 45.0, "map_y": 60.0, "address": "Innovation Hub, Level 1, PW IOI", "is_demo": True},
            {"name": "Sector 126 Metro Cycle Dock", "description": "Covered bicycle parking for 30 cycles near Noida Sector 128 Metro.", "category": "bike_parking", "latitude": 28.5350, "longitude": 77.3935, "map_x": 65.0, "map_y": 30.0, "address": "Near Sector 126 Metro Station Exit", "is_demo": True},
            {"name": "PW IOI Cycle Hub", "description": "Campus cycle docking bay with air pump and repair tools.", "category": "bike_parking", "latitude": 28.5335, "longitude": 77.3915, "map_x": 35.0, "map_y": 65.0, "address": "Basement Level, Silver Springs Plot 13", "is_demo": True},
            {"name": "E-Waste Drop — Tech Lab", "description": "Responsibly dispose old electronics, cables, batteries and boards.", "category": "recycling", "latitude": 28.5344, "longitude": 77.3918, "map_x": 42.0, "map_y": 35.0, "address": "Tech Lab, First Floor, PW IOI", "is_demo": True},
            {"name": "Segregated Waste Hub", "description": "Colour-coded bins: paper, plastic, glass, organic. Zero-waste initiative.", "category": "recycling", "latitude": 28.5337, "longitude": 77.3928, "map_x": 58.0, "map_y": 70.0, "address": "Student Commons Area, Ground Floor", "is_demo": True},
            {"name": "Sector 126 Greenway Walk", "description": "Shaded footpath loop around the Silver Springs campus boundary — 1.2 km.", "category": "walking_route", "latitude": 28.5345, "longitude": 77.3930, "map_x": 60.0, "map_y": 25.0, "address": "Campus Perimeter, Sector 126 Noida", "is_demo": True},
            {"name": "PW IOI Green Cafe", "description": "Plant-forward menu: millets, oat milk, seasonal bowls. Low carbon certified.", "category": "food", "latitude": 28.5340, "longitude": 77.3923, "map_x": 52.0, "map_y": 52.0, "address": "Ground Floor Cafeteria, Silver Springs", "is_demo": True},
            {"name": "Noida Sector 126 Farmers Stall", "description": "Weekly organic produce market — locally grown, zero packaging.", "category": "food", "latitude": 28.5333, "longitude": 77.3920, "map_x": 48.0, "map_y": 75.0, "address": "Near Main Gate, Silver Springs Plot 14", "is_demo": True},
        ]

        existing_locations = {l.name for l in db.query(CampusLocation).all()}
        for loc in location_defs:
            if loc["name"] not in existing_locations:
                db.add(CampusLocation(**loc))
        db.commit()
        print(f"  ✓ {len(location_defs)} campus locations ready")

        print("\n✅ Seeding complete!")
        print("   Demo login: email=demo@ecopulse.app, password=demo1234")
        print("   Or use POST /api/auth/demo-login for instant access")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
