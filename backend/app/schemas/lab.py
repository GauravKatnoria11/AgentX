from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LabTestItem(BaseModel):
    id: str
    name: str
    category: str = "Pathology"
    price: float = 350.0
    turnaround_hours: int = 12
    fasting_required: bool = False
    description: Optional[str] = None
    sample_type: Optional[str] = "Blood"


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
    price_range: Optional[str] = "₹₹"
    is_available: bool = True
    accreditation: Optional[str] = "NABL & ICMR Accredited"
    home_collection: bool = True
    rating: Optional[float] = 4.8
    tests: List[Dict[str, Any]] = []


class LabCreate(LabBase):
    pass


class LabResponse(LabBase):
    id: str
    created_at: Optional[str] = None
    distance_km: Optional[float] = None


class LabTestBookingRequest(BaseModel):
    lab_id: str
    test_name: str
    patient_name: str
    phone: str
    collection_type: str = Field(default="home_collection", description="'home_collection' or 'lab_visit'")
    preferred_date: str
    preferred_time: Optional[str] = "08:30 AM"
    address: Optional[str] = "Hoshiarpur, Punjab"
    notes: Optional[str] = None


class LabTestBookingResponse(BaseModel):
    booking_id: str
    status: str
    token_number: str
    lab_name: str
    test_name: str
    scheduled_at: str
    total_price: float
    collection_type: str
    instructions: List[str]

