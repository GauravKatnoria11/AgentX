from typing import Optional, Dict, Any
from pydantic import BaseModel


class MedicalRecordCreate(BaseModel):
    title: str
    record_type: str
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class MedicalRecordResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    title: str
    record_type: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
