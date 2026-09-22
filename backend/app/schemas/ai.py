from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class AISearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500, description="Natural language search query e.g. 'Find a nearby hospital for heart treatment'")
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None


class StructuredSearchIntent(BaseModel):
    department: Optional[str] = None
    specialization: Optional[str] = None
    hospital_type: Optional[str] = None
    city: Optional[str] = None
    urgency: str = "normal"
    location_required: bool = True
    keywords: List[str] = []


class AISearchResponse(BaseModel):
    intent: StructuredSearchIntent
    hospitals: List[Dict[str, Any]] = []
    doctors: List[Dict[str, Any]] = []
    suggested_departments: List[str] = []
    ai_guidance: str


class SymptomIntakeRequest(BaseModel):
    symptoms_description: str = Field(min_length=3, max_length=1500, description="User description of symptoms in natural language")
    duration: Optional[str] = None
    severity: Optional[str] = None


class SymptomIntakeResponse(BaseModel):
    structured_symptoms: List[str]
    suggested_departments: List[str]
    suggested_specializations: List[str]
    urgency_level: str  # low, medium, high, emergency
    prepared_intake_summary: str
    warning_notice: str = "This analysis is for intake organization and triage assistance only. It is NOT a clinical diagnosis. In case of medical emergency, immediately call local emergency services."


class MedicalRecordSummaryRequest(BaseModel):
    record_id: Optional[str] = None
    content: Optional[str] = None


class MedicalRecordSummaryResponse(BaseModel):
    record_id: Optional[str] = None
    concise_summary: str
    key_findings: List[str]
    suggested_questions_for_doctor: List[str]
    disclaimer: str = "This summary is AI-generated for informational clarity only and does not alter original medical records."


class HealthcareChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    context_hospital_id: Optional[str] = None


class HealthcareChatResponse(BaseModel):
    reply: str
    suggested_links: List[Dict[str, str]] = []
    is_emergency_detected: bool = False
