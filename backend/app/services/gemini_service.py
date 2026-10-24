import json
import urllib.request
import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"

def call_gemini(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"

    contents = []
    if system_instruction:
        contents.append({
            "role": "user",
            "parts": [{"text": f"SYSTEM INSTRUCTIONS: {system_instruction}\n\nUSER PROMPT: {prompt}"}]
        })
    else:
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 800,
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")
        return None
    return None


def generate_gemini_coach_insight(
    student_name: str,
    time_min: int,
    energy: str,
    mission_title: str,
    category: str
) -> str:
    prompt = f"""You are the AI Sustainability Coach for students at PW Institute of Innovation (PW IOI) Noida campus (Sector 126, Noida).
Student Name: {student_name}
Available Time: {time_min} minutes
Energy Level: {energy}
Recommended Action: "{mission_title}" ({category})

Write a concise, inspiring 2-sentence coaching insight explaining why this micro-habit is optimal right now for the student at the PW IOI Noida campus and how it conserves resources. Keep it warm, motivating, and specific to PW IOI."""

    result = call_gemini(prompt)
    if result:
        return result
    return f"Matched based on your {time_min}m window and {energy} energy at PW IOI Sector 126 campus. Completing this keeps your daily streak active!"


def generate_gemini_impact_analysis(
    total_co2: float,
    travel_km: float,
    bottles: int,
    meal_swaps: int,
    points: int
) -> Dict[str, Any]:
    prompt = f"""You are the environmental data analyst for PW Institute of Innovation (PW IOI), Sector 126 Noida.
Analyze this student's verified telemetry:
- Net Avoided CO2: {total_co2} kg
- Clean Pedaling/Walking: {travel_km} km on Sector 126 transit paths
- Single-use PET Bottles Diverted: {bottles} bottles
- Plant-based Meal Swaps: {meal_swaps} swaps
- Total EcoPulse Points: {points} pts

Provide a structured JSON output with:
1. "headline": Short 5-8 word executive title.
2. "campus_insight": 2 punchy sentences about their environmental contribution compared to standard student footprint in NCR Noida.
3. "next_priority": One specific recommended micro-step to hit their next milestone at PW IOI campus.
Only return valid JSON."""

    result = call_gemini(prompt)
    if result:
        try:
            cleaned = result.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            return parsed
        except Exception:
            pass

    return {
        "headline": "High-Efficiency Carbon Mitigation Profile",
        "campus_insight": f"Your {total_co2} kg of avoided CO₂ and {bottles} plastic bottles diverted directly support PW IOI's Sector 126 zero-waste goal. You are tracking above the Noida student average.",
        "next_priority": "Log your next reusable bottle refill at the First Floor Silver Springs station to unlock your next milestone."
    }
