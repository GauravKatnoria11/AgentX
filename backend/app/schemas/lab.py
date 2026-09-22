from typing import Optional, List
from pydantic import BaseModel


class LabBase(BaseModel):
    hospital_id: Optional[str] = None
    name: str
    test_types: List[str] = []
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = None
    hours: Optional[str] = "8:00 AM - 8:00 PM"
    price_range: Optional[str] = "$$"
    is_available: bool = True


class LabCreate(LabBase):
    pass


class LabResponse(LabBase):
    id: str
    created_at: Optional[str] = None
    distance_km: Optional[float] = None
