from app.core.database import SessionLocal
from app.models.location import CampusLocation

# The PW Institute of Innovation (PW IOI) Noida Campus
# First Floor, Silver Springs, Plot 13/14, Sector 126, Noida, Uttar Pradesh 201313
# Building center: 28.54280, 77.33420

location_defs = [
    {
        "name": "PW IOI Main Reception & RO Refill",
        "description": "Chilled filtered RO & alkaline hydration dispenser at First Floor main reception lobby.",
        "category": "water_refill",
        "latitude": 28.54280,
        "longitude": 77.33420,
        "map_x": 50.0,
        "map_y": 50.0,
        "address": "First Floor, Silver Springs, Plot 13/14, Sector 126, Noida",
        "is_demo": True,
    },
    {
        "name": "Innovation Lounge Hydration Bay",
        "description": "Zero-plastic hydration counter next to study pods and AI workspace.",
        "category": "water_refill",
        "latitude": 28.54295,
        "longitude": 77.33405,
        "map_x": 42.0,
        "map_y": 38.0,
        "address": "First Floor West Wing, Silver Springs Plot 13",
        "is_demo": True,
    },
    {
        "name": "Tech Lab 3 Refill & E-Waste Hub",
        "description": "Safe drop point for retired electronics, lithium batteries and cables next to clean water point.",
        "category": "recycling",
        "latitude": 28.54270,
        "longitude": 77.33440,
        "map_x": 58.0,
        "map_y": 55.0,
        "address": "First Floor East Wing, Silver Springs Plot 14",
        "is_demo": True,
    },
    {
        "name": "Silver Springs Main Entry Cycle Dock",
        "description": "Covered bicycle parking with digital security locks for student commuters.",
        "category": "bike_parking",
        "latitude": 28.54310,
        "longitude": 77.33420,
        "map_x": 50.0,
        "map_y": 20.0,
        "address": "Silver Springs Main Gate, Plot 13/14, Sector 126",
        "is_demo": True,
    },
    {
        "name": "Basement Transit Bay & EV Dock",
        "description": "Underground cycle storage with EV charging points and puncture repair station.",
        "category": "bike_parking",
        "latitude": 28.54250,
        "longitude": 77.33405,
        "map_x": 40.0,
        "map_y": 75.0,
        "address": "Basement Parking Level, Silver Springs",
        "is_demo": True,
    },
    {
        "name": "Courtyard Zero-Waste Station",
        "description": "Colour-coded 4-stream recycling bins: compost, paper, clean plastic, metal.",
        "category": "recycling",
        "latitude": 28.54270,
        "longitude": 77.33415,
        "map_x": 48.0,
        "map_y": 58.0,
        "address": "Central Courtyard, Plot 13/14, Sector 126",
        "is_demo": True,
    },
    {
        "name": "PW IOI Green Kitchen & Millets Cafe",
        "description": "Certified plant-forward cafeteria featuring low-carbon millets and seasonal bowls.",
        "category": "food",
        "latitude": 28.54260,
        "longitude": 77.33435,
        "map_x": 56.0,
        "map_y": 68.0,
        "address": "Ground Floor Cafeteria, Silver Springs",
        "is_demo": True,
    },
    {
        "name": "Silver Springs Perimeter Walking Trail",
        "description": "Shaded tree-lined walking circuit directly around Silver Springs Plot 13/14 boundary — 400m circuit.",
        "category": "walking_route",
        "latitude": 28.54315,
        "longitude": 77.33435,
        "map_x": 55.0,
        "map_y": 25.0,
        "address": "Campus Boundary Promenade, Plot 13/14",
        "is_demo": True,
    },
]

def update_locations():
    db = SessionLocal()
    try:
        db.query(CampusLocation).delete()
        for loc in location_defs:
            db.add(CampusLocation(**loc))
        db.commit()
        count = db.query(CampusLocation).count()
        print(f"Updated {count} campus locations successfully for PW IOI Silver Springs Plot 13/14.")
    finally:
        db.close()

if __name__ == "__main__":
    update_locations()
