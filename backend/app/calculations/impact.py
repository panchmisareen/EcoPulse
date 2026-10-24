"""
Impact calculation module.
All emission factors and assumptions are documented here and configurable.

Assumptions (documented):
- Car emission factor: 0.21 kg CO2/km (UK DEFRA average passenger car)
- Bus emission factor: 0.089 kg CO2/km (UK DEFRA local bus)
- Cycling/walking: 0.0 kg CO2/km (no direct emissions)
- Single-use plastic bottle: ~0.083 kg CO2 per bottle (lifecycle analysis average)
- Plant-based meal swap: ~1.5 kg CO2 avoided per meal (vs avg UK mixed meal)
  NOTE: This is a rough estimate based on published lifecycle analyses.
  Actual savings vary significantly by specific foods and supply chain.

All estimates are clearly labeled as ESTIMATES in API responses.
"""

from app.core.config import settings
from typing import Optional


EMISSION_FACTOR_KG_PER_KM = {
    "car": settings.EMISSION_FACTOR_CAR,
    "bus": settings.EMISSION_FACTOR_BUS,
    "bike": settings.EMISSION_FACTOR_BIKE,
    "walk": settings.EMISSION_FACTOR_WALK,
    "cycle": settings.EMISSION_FACTOR_BIKE,
}

# kg CO2 per single-use bottle avoided (lifecycle)
PLASTIC_BOTTLE_CO2_KG = 0.083

# Estimated kg CO2 avoided per plant-based meal swap (rough estimate)
MEAL_SWAP_CO2_KG = 1.5

# Minimum data required for estimates
MIN_TRAVEL_KM_FOR_ESTIMATE = 0.1


def calculate_travel_co2_avoided(transport_mode: str, distance_km: float) -> Optional[float]:
    """
    Estimate kg CO2 avoided by choosing active/low-carbon travel vs. average car.
    Returns None if insufficient data or unknown mode.
    Assumes counterfactual: the same trip would have been taken by car.
    """
    if distance_km < MIN_TRAVEL_KM_FOR_ESTIMATE:
        return None

    mode = transport_mode.lower()
    if mode not in EMISSION_FACTOR_KG_PER_KM:
        return None

    car_emissions = distance_km * EMISSION_FACTOR_KG_PER_KM["car"]
    mode_emissions = distance_km * EMISSION_FACTOR_KG_PER_KM.get(mode, 0)
    avoided = car_emissions - mode_emissions
    return round(max(avoided, 0.0), 4)


def calculate_bottles_avoided(reusable_bottle_uses: int) -> int:
    """
    Count of single-use bottles avoided based on reported reusable bottle uses.
    1 reusable bottle use = 1 single-use bottle avoided.
    """
    return max(0, reusable_bottle_uses)


def calculate_bottles_co2_avoided(bottles_avoided: int) -> float:
    """Estimated kg CO2 avoided from single-use bottles."""
    return round(bottles_avoided * PLASTIC_BOTTLE_CO2_KG, 4)


def calculate_meal_swap_co2_avoided(meal_swaps: int) -> float:
    """
    Rough estimate of kg CO2 avoided from plant-based meal swaps.
    IMPORTANT: This is a high-level estimate only.
    """
    return round(meal_swaps * MEAL_SWAP_CO2_KG, 2)


def get_assumptions_doc() -> dict:
    """Return documented assumptions for display in the UI."""
    return {
        "travel": {
            "car_factor_kg_per_km": EMISSION_FACTOR_KG_PER_KM["car"],
            "bus_factor_kg_per_km": EMISSION_FACTOR_KG_PER_KM["bus"],
            "bike_factor_kg_per_km": EMISSION_FACTOR_KG_PER_KM["bike"],
            "walk_factor_kg_per_km": EMISSION_FACTOR_KG_PER_KM["walk"],
            "source": "UK DEFRA Greenhouse Gas Reporting Factors 2023",
            "note": "Assumes counterfactual: same trip would have been made by car",
        },
        "hydration": {
            "bottle_co2_kg": PLASTIC_BOTTLE_CO2_KG,
            "source": "Lifecycle analysis average (Gleick & Cooley, 2009)",
            "note": "1 reusable bottle use = 1 single-use bottle avoided",
        },
        "meals": {
            "meal_swap_co2_kg": MEAL_SWAP_CO2_KG,
            "source": "Published lifecycle analyses (rough estimate)",
            "note": "Actual savings vary significantly by specific foods and supply chain",
        },
        "disclaimer": (
            "All impact metrics are ESTIMATES based on publicly available "
            "lifecycle analyses and emission factors. They represent approximate "
            "orders of magnitude, not verified measurements."
        ),
    }
