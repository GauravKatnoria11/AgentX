from typing import Optional
from pydantic import BaseModel


class PharmacyBase(BaseModel):
    hospital_id: Optional[str] = None
    name: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    hours: Optional[str] = "24/7"
    is_open: bool = True


class PharmacyCreate(PharmacyBase):
    pass


class PharmacyResponse(PharmacyBase):
    id: str
    created_at: Optional[str] = None
    distance_km: Optional[float] = None
