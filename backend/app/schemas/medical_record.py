from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class MedicalRecordCreate(BaseModel):
    title: str
    record_type: str
    disease_category: Optional[str] = "General Medicine"
    appointment_id: Optional[str] = None
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    medicines: Optional[List[Dict[str, Any]]] = []
    diet_plan: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MedicalRecordUpdate(BaseModel):
    title: Optional[str] = None
    record_type: Optional[str] = None
    disease_category: Optional[str] = None
    appointment_id: Optional[str] = None
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    medicines: Optional[List[Dict[str, Any]]] = None
    diet_plan: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MedicalRecordResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    appointment_id: Optional[str] = None
    disease_category: Optional[str] = "General Medicine"
    title: str
    record_type: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    medicines: Optional[List[Dict[str, Any]]] = []
    diet_plan: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None

