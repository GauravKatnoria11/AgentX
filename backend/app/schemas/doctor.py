from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


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
    review_count: Optional[int] = 0
    room_number: Optional[str] = "Room 101, Main OPD"
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


class DoctorReviewCreate(BaseModel):
    appointment_id: Optional[str] = Field(None, description="Completed appointment ID that qualifies this review")
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Detailed review of consultation")
    tags: Optional[List[str]] = Field(default_factory=list, description="Quality tags, e.g. 'Accurate Diagnosis'")


class DoctorReviewResponse(BaseModel):
    id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    patient_id: str
    patient_name: str
    appointment_id: str
    hospital_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    tags: List[str] = []
    verified_consultation: bool = True
    created_at: str


class DoctorReviewStatsResponse(BaseModel):
    doctor_id: str
    doctor_name: str
    average_rating: float
    total_reviews: int
    breakdown: Dict[str, int] = {}
    can_rate: bool = False
    eligible_appointments: List[Dict[str, Any]] = []
    user_review: Optional[DoctorReviewResponse] = None
    reviews: List[DoctorReviewResponse] = []


class DoctorReferralRequest(BaseModel):
    target_doctor_id: str = Field(..., description="ID of the doctor to whom patient is being referred")
    reason: str = Field("Doctor Overbooked / High Patient Load", description="Clinical or administrative reason for referral")
    notes: Optional[str] = Field(None, description="Handoff notes or clinical advice for the target doctor")
