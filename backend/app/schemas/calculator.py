from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class GenZFootprintRequest(BaseModel):
    inputs: Dict[str, float] = Field(default_factory=dict)


class GenZCategoryItem(BaseModel):
    id: str
    name: str
    subtext: str
    unit: str
    factor: float
    default: float


class GenZCategory(BaseModel):
    title: str
    icon: str
    description: str
    items: List[GenZCategoryItem]


class IndiaFootprintRequest(BaseModel):
    elecBill: float = 1800.0
    renewable: str = "No"
    region: str = "Delhi NCR"
    cookingFuel: str = "LPG"
    lpgCount: float = 1.0
    vehicleType: str = "Petrol"
    kmPerWeek: float = 70.0
    fuelEfficiency: float = 16.0
    publicTransport: str = "Weekly"
    domesticFlights: float = 2.0
    intlFlights: float = 0.0
    dietType: str = "Vegetarian"
    redMeat: str = "Never"
    foodWaste: float = 1.5
    householdSize: float = 3.0
    plasticWaste: float = 2.0
    segregateWaste: str = "No"
    stream4k: float = 2.0
    doomscroll: float = 1.5
    foodOrders: float = 6.0
    fastFashion: float = 1.0
    shortCabs: float = 5.0
    aiPrompts: float = 15.0


class SyncHabitsRequest(BaseModel):
    habits_logged: List[Dict[str, Any]]
    total_saved_co2_kg: float
    summary: str
