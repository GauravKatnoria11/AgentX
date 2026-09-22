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
    email: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = 4.5
    services: List[str] = []
    emergency_available: bool = True
    operational_hours: Optional[str] = "24/7"
    image_url: Optional[str] = None


class HospitalCreate(HospitalBase):
    pass


class HospitalResponse(HospitalBase):
    id: str
    created_at: Optional[str] = None
    distance_km: Optional[float] = None
