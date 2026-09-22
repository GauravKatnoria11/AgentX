from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class FollowupQuestion(BaseModel):
    id: int
    text: str
    type: Literal["yes_no", "scale", "text", "number"] = "text"
    options: Optional[List[str]] = None


class FollowupCreate(BaseModel):
    patient_id: str
    appointment_id: str
    doctor_id: Optional[str] = None
    interval_type: Literal["24h", "3d", "7d", "custom"]
    scheduled_at: str
    questions: List[FollowupQuestion] = []


class FollowupSubmission(BaseModel):
    responses: Dict[str, Any] = Field(description="Dictionary mapping question ID or name to patient response")
    symptoms_severity_score: Optional[int] = Field(default=None, ge=1, le=10, description="Patient reported severity (1-10)")


class FollowupResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: str
    interval_type: str
    scheduled_at: str
    questions: List[Dict[str, Any]]
    status: str
    created_at: Optional[str] = None
    responses: Optional[List[Dict[str, Any]]] = None
    flagged_for_review: bool = False
