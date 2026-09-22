from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class SystemMetrics(BaseModel):
    total_patients: int
    total_doctors: int
    total_hospitals: int
    total_appointments: int
    active_followups: int
    pending_reviews: int


class QueuePatientItem(BaseModel):
    appointment_id: str
    patient_id: str
    patient_name: str
    doctor_name: str
    department_name: str
    appointment_time: str
    queue_number: int
    status: str


class AuditLogItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Dict[str, Any] = {}
    created_at: str
