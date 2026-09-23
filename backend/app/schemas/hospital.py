from typing import Optional, List
from pydantic import BaseModel, Field


class HospitalBase(BaseModel):
    name: str
    type: Optional[str] = "General Hospital"
    address: str
    city: str
    state: str
    postal_code: Optional[str] = None
    latitude: float
    longitude: float
    phone: str
    emergency_hotline: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = 4.5
    services: List[str] = []
    diseases_treated: List[str] = []
    emergency_available: bool = True
    available_icu_beds: Optional[int] = None
    total_beds: Optional[int] = None
    operational_hours: Optional[str] = "24/7"
    image_url: Optional[str] = None
    consultation_fee: Optional[float] = 100.0
    min_fee: Optional[float] = None
    max_fee: Optional[float] = None
    fee_tier: Optional[str] = None
    government_schemes: List[str] = []


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: str
    created_at: Optional[str] = None
    distance_km: Optional[float] = None
    best_score: Optional[float] = None
    score_breakdown: Optional[dict] = None
    best_badge: Optional[str] = None

