import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "EcoPulse"


def test_demo_login():
    response = client.post("/api/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "demo@ecopulse.app"


def test_regular_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@ecopulse.app", "password": "demo1234"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_dashboard_authenticated():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert "weekly_stats" in data
    assert "streak" in data
    assert "total_points" in data
    assert data["total_points"] >= 0


def test_missions_list():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/missions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "title" in first
    assert "points" in first
    assert "category" in first


def test_coach_recommendation():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/coach/recommend",
        headers=headers,
        json={"available_time": 25, "energy": "energetic", "has_reusable_bottle": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert "mission" in data
    assert "reason" in data
    assert "engine" in data


def test_campus_locations():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/campus/locations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "category" in data[0]


def test_league_leaderboard():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/leaderboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "username" in data[0]
    assert "total_points" in data[0]

    teams_res = client.get("/api/leaderboard/teams", headers=headers)
    assert teams_res.status_code == 200
    teams_data = teams_res.json()
    assert isinstance(teams_data, list)


def test_passport():
    login_res = client.post("/api/auth/demo-login")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/passport", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert "badges" in data
    assert "recent_activity" in data
