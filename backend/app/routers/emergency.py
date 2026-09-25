import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, status
from app.schemas.common import ApiResponse
from app.supabase import MOCK_DATA

router = APIRouter(prefix="/api/v1/emergency", tags=["Emergency SOS & Critical Triage"])


class EmergencySOSRequest(BaseModel):
    emergency_type: str = Field(..., description="e.g. Heart Attack, Severe Trauma/Accident, Stroke, Breathing Failure, Unconscious")
    patient_name: str = Field(default="Emergency Patient")
    phone: str = Field(..., description="Callback contact phone")
    current_location: Optional[str] = "Hoshiarpur, Punjab"
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    notes: Optional[str] = None


class EmergencySOSResponse(BaseModel):
    alert_id: str
    status: str
    eta_minutes: Optional[int] = None
    nearest_hospital: Optional[Dict[str, Any]] = None
    ambulance_assigned: Optional[str] = None
    emergency_hotline: str = "108"
    national_ambulance_number: str = "108"
    first_aid_instructions: List[str]


@router.post("/sos", response_model=ApiResponse[EmergencySOSResponse], status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(req: EmergencySOSRequest):
    """
    Record the request locally. This app has no connection to ambulance dispatch
    or a live hospital capacity service, so it must not claim to dispatch help.
    """
    alert_id = str(uuid.uuid4())
    alert_record = {
        "id": alert_id,
        "patient_name": req.patient_name,
        "phone": req.phone,
        "emergency_type": req.emergency_type,
        "status": "request_recorded",
        "current_location": req.current_location,
        "notes": req.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if "emergency_alerts" not in MOCK_DATA:
        MOCK_DATA["emergency_alerts"] = []
    MOCK_DATA["emergency_alerts"].insert(0, alert_record)

    # First aid protocols based on emergency type
    t_lower = req.emergency_type.lower()
    instructions = [
        "Keep the patient calm and seated upright with loose clothing.",
        "Do not offer solid foods or liquids until paramedics evaluate.",
        "Ensure emergency vehicle entry route is clear for rapid stretcher access."
    ]
    if "chest" in t_lower or "heart" in t_lower:
        instructions.insert(0, "If patient is conscious and not allergic, administer 300mg chewable Aspirin.")
        instructions.insert(1, "Place patient in semi-recumbent posture (supported 45 degree angle).")
    elif "stroke" in t_lower or "paralysis" in t_lower:
        instructions.insert(0, "Note exact time of first symptom onset (critical for clot-busting therapy window).")
        instructions.insert(1, "Turn patient onto side in recovery position if experiencing vomiting or nausea.")
    elif "trauma" in t_lower or "bleeding" in t_lower or "accident" in t_lower:
        instructions.insert(0, "Apply firm, direct pressure to wound using clean cloth or bandage.")
        instructions.insert(1, "Do not move patient if neck or spinal injury is suspected.")

    response_data = EmergencySOSResponse(
        alert_id=alert_id,
        status="Request recorded by this app. Call 108 to request emergency dispatch.",
        national_ambulance_number="108",
        first_aid_instructions=instructions
    )

    return ApiResponse(
        success=True,
        message="Request recorded by this app. No ambulance dispatch connection is available; call 108.",
        data=response_data
    )


@router.get("/alerts", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_emergency_alerts():
    alerts = MOCK_DATA.get("emergency_alerts", [])
    return ApiResponse(
        success=True,
        message="Active emergency triage alerts retrieved",
        data=alerts
    )
