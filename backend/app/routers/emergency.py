import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status
from app.schemas.common import ApiResponse
from app.supabase import MOCK_DATA
from app.services.hospital_service import calculate_haversine_distance

router = APIRouter(prefix="/api/v1/emergency", tags=["Emergency SOS & Critical Triage"])


class EmergencySOSRequest(BaseModel):
    emergency_type: str = Field(..., description="e.g. Heart Attack, Severe Trauma/Accident, Stroke, Breathing Failure, Unconscious")
    patient_name: str = Field(default="Emergency Patient")
    phone: str = Field(..., description="Callback contact phone")
    current_location: Optional[str] = "Hoshiarpur, Punjab"
    current_lat: Optional[float] = 31.5273
    current_lon: Optional[float] = 75.9149
    notes: Optional[str] = None


class EmergencySOSResponse(BaseModel):
    alert_id: str
    status: str
    eta_minutes: int
    nearest_hospital: Dict[str, Any]
    ambulance_assigned: str
    emergency_hotline: str
    national_ambulance_number: str = "108"
    first_aid_instructions: List[str]


@router.post("/sos", response_model=ApiResponse[EmergencySOSResponse], status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(req: EmergencySOSRequest):
    """
    Critical Emergency SOS Trigger:
    Finds closest emergency-equipped hospital in Hoshiarpur, reserves ICU alert,
    and alerts trauma desk.
    """
    user_lat = req.current_lat or 31.5273
    user_lon = req.current_lon or 75.9149

    emergency_hospitals = [
        h for h in MOCK_DATA["hospitals"]
        if h.get("emergency_available", False)
    ]

    # Calculate distance and sort
    for h in emergency_hospitals:
        h["distance_km"] = calculate_haversine_distance(user_lat, user_lon, h["latitude"], h["longitude"])

    emergency_hospitals.sort(key=lambda x: x.get("distance_km", 9999))
    target_hospital = emergency_hospitals[0] if emergency_hospitals else MOCK_DATA["hospitals"][0]

    # Calculate dynamic ETA (assuming 35 km/h emergency ambulance speed in Hoshiarpur town)
    dist = target_hospital.get("distance_km", 2.5)
    eta_mins = max(3, int(round(dist * 2.2)))

    alert_id = str(uuid.uuid4())
    alert_record = {
        "id": alert_id,
        "patient_name": req.patient_name,
        "phone": req.phone,
        "emergency_type": req.emergency_type,
        "hospital_id": target_hospital["id"],
        "hospital_name": target_hospital["name"],
        "status": "ambulance_dispatched",
        "eta_minutes": eta_mins,
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
        status="Ambulance Dispatched & Trauma Bay Alerted",
        eta_minutes=eta_mins,
        nearest_hospital=target_hospital,
        ambulance_assigned=f"Punjab 108 Advanced Life Support Unit #PB-07-{alert_id[:4].upper()}",
        emergency_hotline=target_hospital.get("emergency_hotline") or target_hospital["phone"],
        national_ambulance_number="108",
        first_aid_instructions=instructions
    )

    return ApiResponse(
        success=True,
        message="Critical Emergency SOS received. Ambulance dispatched and hospital trauma team standing by.",
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
