from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_calculator_metadata():
    res = client.get("/api/calculator/metadata")
    assert res.status_code == 200
    data = res.json()
    assert "genz_categories" in data
    assert "digital" in data["genz_categories"]
    assert "benchmarks" in data


def test_calculator_genz():
    res = client.post(
        "/api/calculator/genz",
        json={"inputs": {"stream_4k": 2, "doomscroll_reels": 1.5, "food_delivery_order": 1}},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_grams"] > 0
    assert "vibe_status" in data
    assert "equivalents" in data
    assert data["equivalents"]["smartphone_charges"] > 0


def test_calculator_india():
    res = client.post(
        "/api/calculator/india",
        json={
            "elecBill": 1500,
            "renewable": "No",
            "region": "Delhi NCR",
            "cookingFuel": "LPG",
            "lpgCount": 1,
            "vehicleType": "Petrol",
            "kmPerWeek": 50,
            "fuelEfficiency": 15,
            "publicTransport": "Weekly",
            "domesticFlights": 1,
            "intlFlights": 0,
            "dietType": "Vegetarian",
            "redMeat": "Never",
            "foodWaste": 1.0,
            "householdSize": 3,
            "plasticWaste": 2.0,
            "segregateWaste": "Yes",
            "stream4k": 2,
            "doomscroll": 1.5,
            "foodOrders": 4,
            "fastFashion": 1,
            "shortCabs": 3,
            "aiPrompts": 10,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_monthly_kg"] > 0
    assert data["total_annual_tonnes"] > 0
    assert "breakdown" in data
    assert "comparison" in data


def test_calculator_unified():
    res = client.post(
        "/api/calculator/unified",
        json={
            "elecBill": 1600,
            "renewable": "No",
            "acCoolingHours": 3,
            "vehicleType": "Petrol",
            "kmPerWeek": 50,
            "fuelEfficiency": 16,
            "publicTransport": "Weekly",
            "shortCabs": 4,
            "sharedEscooterKm": 5,
            "dietType": "Vegetarian",
            "foodOrders": 5,
            "dairyLattes": 6,
            "fastFashion": 1,
            "stream4kHours": 2,
            "doomscrollHours": 1.5,
            "aiPromptsDaily": 15,
            "plasticWasteKg": 2.0,
            "segregateWaste": "Yes",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_monthly_kg"] > 0
    assert data["total_annual_tonnes"] > 0
    assert "vibe_status" in data
    assert "breakdown" in data
    assert "recommendations" in data
