from typing import Optional, List
from pydantic import BaseModel, Field


class MedicationItem(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    diagnosis: str
    medications: List[MedicationItem] = []
    instructions: Optional[str] = None
    file_url: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None
    doctor_name: Optional[str] = None
    diagnosis: str
    medications: List[MedicationItem] = []
    instructions: Optional[str] = None
    file_url: Optional[str] = None
    created_at: Optional[str] = None
