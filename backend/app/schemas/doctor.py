from typing import Optional, List
from pydantic import BaseModel


class ScheduleSlot(BaseModel):
    day_of_week: int
    day_name: str
    start_time: str
    end_time: str
    slot_duration_minutes: int


class DoctorBase(BaseModel):
    hospital_id: str
    department_id: str
    name: str
    specialization: str
    qualification: str
    experience_years: int = 0
    consultation_fee: float = 0.0
    bio: Optional[str] = None
    rating: Optional[float] = 4.8
    is_available: bool = True


class DoctorCreate(DoctorBase):
    user_id: Optional[str] = None


class DoctorResponse(DoctorBase):
    id: str
    user_id: Optional[str] = None
    hospital_name: Optional[str] = None
    department_name: Optional[str] = None
    created_at: Optional[str] = None


class DoctorAvailabilityResponse(BaseModel):
    doctor_id: str
    doctor_name: str
    date: str
    available_slots: List[str]
    booked_slots: List[str]
