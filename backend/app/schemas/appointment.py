from datetime import date, time
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    doctor_id: str
    hospital_id: str
    department_id: Optional[str] = None
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None


class AppointmentCancel(BaseModel):
    cancellation_reason: Optional[str] = "Cancelled by patient"


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    hospital_id: str
    department_id: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    department_name: Optional[str] = None
    appointment_date: str
    appointment_time: str
    status: Literal["pending", "confirmed", "completed", "cancelled"]
    reason: Optional[str] = None
    queue_number: Optional[int] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: Optional[str] = None
