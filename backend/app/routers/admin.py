from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.schemas.admin import SystemMetrics, QueuePatientItem, AuditLogItem
from app.schemas.hospital import HospitalCreate, HospitalResponse
from app.schemas.common import ApiResponse
from app.dependencies import require_role
from app.services.admin_service import admin_service
from app.services.medical_record_service import medical_record_service
from app.supabase import MOCK_DATA, supabase_service
from app.utils.permissions import log_audit_event
import uuid
from datetime import datetime, timezone

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Hospital & Administrative Management (Staff / Admin Only)"]
)


class AllotTimingRequest(BaseModel):
    appointment_date: str = Field(..., description="Confirmed date (YYYY-MM-DD)")
    appointment_time: str = Field(..., description="Confirmed time slot (e.g. 10:00:00)")
    doctor_id: Optional[str] = None
    queue_number: Optional[int] = None
    admin_notes: Optional[str] = None


@router.get("/analytics", response_model=ApiResponse[SystemMetrics])
async def get_analytics(current_user: dict = Depends(require_role(["admin", "staff"]))):
    metrics = admin_service.get_system_analytics(current_user)
    return ApiResponse(
        success=True,
        message="System analytics retrieved successfully",
        data=SystemMetrics(**metrics)
    )


@router.get("/queue", response_model=ApiResponse[List[QueuePatientItem]])
async def get_queue(
    hospital_id: Optional[str] = Query(None, description="Optional hospital ID filter"),
    current_user: dict = Depends(require_role(["admin", "staff"]))
):
    queue = admin_service.get_hospital_queue(hospital_id, current_user)
    return ApiResponse(
        success=True,
        message="Hospital queue retrieved successfully",
        data=[QueuePatientItem(**q) for q in queue]
    )


@router.get("/appointments", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_admin_appointments(
    status_filter: Optional[str] = Query(None, description="Filter by pending/confirmed"),
    current_user: dict = Depends(require_role(["admin", "staff"]))
):
    """
    Allows hospital administration to review all appointment requests.
    """
    appointments = MOCK_DATA["appointments"]
    if status_filter:
        appointments = [a for a in appointments if a.get("status") == status_filter]

    results = []
    for a in appointments:
        a_dict = dict(a)
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(a.get("doctor_id"))), None)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(a.get("hospital_id"))), None)
        patient = next((p for p in MOCK_DATA["profiles"] if str(p["id"]) == str(a.get("patient_id"))), None)
        a_dict["doctor_name"] = doc["name"] if doc else "Specialist"
        a_dict["hospital_name"] = hosp["name"] if hosp else "Hospital"
        a_dict["patient_name"] = a.get("patient_name") or (patient["full_name"] if patient else "Patient")
        a_dict["patient_phone"] = a.get("patient_phone") or (patient.get("phone") if patient else "")
        results.append(a_dict)

    results.sort(key=lambda x: (x.get("status") != "pending", x.get("appointment_date", "")))
    return ApiResponse(
        success=True,
        message="Admin appointment requests retrieved successfully",
        data=results
    )


@router.patch("/appointments/{appointment_id}/allot", response_model=ApiResponse[Dict[str, Any]])
async def allot_appointment_timing(
    appointment_id: str,
    req: AllotTimingRequest,
    current_user: dict = Depends(require_role(["admin", "staff"]))
):
    """
    Enables Admin to allot date and time for patient appointment requests.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment request not found.")

    appointment["appointment_date"] = req.appointment_date
    appointment["appointment_time"] = req.appointment_time
    if req.doctor_id:
        appointment["doctor_id"] = req.doctor_id
    appointment["status"] = "confirmed"

    # Assign queue number if not present
    if req.queue_number:
        appointment["queue_number"] = req.queue_number
    elif not appointment.get("queue_number"):
        day_apps = [a for a in MOCK_DATA["appointments"] if a.get("appointment_date") == req.appointment_date]
        appointment["queue_number"] = len(day_apps)

    if req.admin_notes:
        appointment["notes"] = f"Admin Allotted: {req.admin_notes}"

    # Notify patient
    doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
    hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(appointment.get("hospital_id"))), None)
    doc_name = doc["name"] if doc else "your specialist"
    hosp_name = hosp["name"] if hosp else "hospital"

    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(appointment["patient_id"]),
        "title": "Appointment Timing Allotted!",
        "message": f"Your appointment at {hosp_name} with {doc_name} is confirmed for {req.appointment_date} at {req.appointment_time[:5]} (Queue #{appointment['queue_number']}).",
        "type": "appointment_allotted",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    log_audit_event(
        action="admin_allot_appointment_timing",
        resource_type="appointment",
        resource_id=appointment_id,
        user_id=str(current_user.get("id")),
        details={"date": req.appointment_date, "time": req.appointment_time, "queue": appointment["queue_number"]}
    )

    return ApiResponse(
        success=True,
        message=f"Appointment confirmed and timing allotted successfully for {req.appointment_date} at {req.appointment_time[:5]}",
        data=appointment
    )


class AdminReferralRequest(BaseModel):
    target_doctor_id: str = Field(..., description="ID of doctor to whom patient is referred")
    reason: str = Field("High Patient Caseload / Doctor Overbooked", description="Reason for referral")
    notes: Optional[str] = Field(None, description="Handoff notes or clinical guidance")


@router.post("/appointments/{appointment_id}/refer", response_model=ApiResponse[Dict[str, Any]])
async def refer_patient_to_doctor(
    appointment_id: str,
    req: AdminReferralRequest,
    current_user: dict = Depends(require_role(["admin", "staff", "doctor"]))
):
    """
    Enables Admin/Staff to refer a patient from an overbooked doctor to another available doctor.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    target_doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(req.target_doctor_id)), None)
    if not target_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target doctor for referral not found.")

    orig_doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
    orig_doc_name = orig_doc["name"] if orig_doc else "Attending Doctor"

    prev_doctor_id = appointment.get("doctor_id")
    appointment["doctor_id"] = str(target_doc["id"])
    if target_doc.get("hospital_id"):
        appointment["hospital_id"] = str(target_doc["hospital_id"])
    if target_doc.get("department_id"):
        appointment["department_id"] = str(target_doc["department_id"])

    appt_date = appointment.get("appointment_date", "2026-09-28")
    new_doc_apps = [
        a for a in MOCK_DATA["appointments"]
        if str(a.get("doctor_id")) == str(target_doc["id"]) and a.get("appointment_date") == appt_date
    ]
    appointment["queue_number"] = len(new_doc_apps) + 1

    referral_note = f"[Referred from {orig_doc_name} to {target_doc['name']} - Reason: {req.reason}]"
    if req.notes:
        referral_note += f" Notes: {req.notes}"
    appointment["notes"] = f"{referral_note} | {appointment.get('notes', '')}".strip(" |")

    # Patient Notification
    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(appointment["patient_id"]),
        "title": "👨‍⚕️ Appointment Referred to New Specialist",
        "message": f"Your consultation has been referred from {orig_doc_name} to {target_doc['name']} ({target_doc['specialization']}) due to: {req.reason}. Your new token position is #{appointment['queue_number']}.",
        "type": "appointment_referred",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    log_audit_event(
        action="admin_refer_appointment",
        resource_type="appointment",
        resource_id=appointment_id,
        user_id=str(current_user.get("id")),
        details={"from_doctor": prev_doctor_id, "to_doctor": str(target_doc["id"]), "reason": req.reason}
    )

    return ApiResponse(
        success=True,
        message=f"Patient successfully referred from {orig_doc_name} to {target_doc['name']} (Token #{appointment['queue_number']})",
        data={
            "appointment": appointment,
            "referred_to": target_doc["name"],
            "new_queue_number": appointment["queue_number"]
        }
    )


@router.get("/audit-logs", response_model=ApiResponse[List[AuditLogItem]])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_role(["admin"]))
):
    logs = admin_service.get_audit_logs(limit=limit)
    return ApiResponse(
        success=True,
        message="Audit logs retrieved successfully",
        data=[AuditLogItem(**l) for l in logs]
    )


@router.post("/hospitals", response_model=ApiResponse[HospitalResponse], status_code=status.HTTP_201_CREATED)
async def create_hospital(
    req: HospitalCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    created = admin_service.add_hospital(req.model_dump(), current_user)
    return ApiResponse(
        success=True,
        message="Hospital registered successfully",
        data=HospitalResponse(**created)
    )


class HospitalBedsUpdate(BaseModel):
    available_icu_beds: Optional[int] = None
    total_beds: Optional[int] = None


@router.patch("/hospitals/{hospital_id}/beds", response_model=ApiResponse[Dict[str, Any]])
async def update_hospital_beds(
    hospital_id: str,
    req: HospitalBedsUpdate,
    current_user: dict = Depends(require_role(["admin", "staff"]))
):
    hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hospital_id)), None)
    if not hospital and hospital_id in ("hosp-1", "hosp-hoshiarpur-1"):
        hospital = MOCK_DATA["hospitals"][0]
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")
    
    if req.available_icu_beds is not None:
        hospital["available_icu_beds"] = max(0, req.available_icu_beds)
    if req.total_beds is not None:
        hospital["total_beds"] = max(0, req.total_beds)

    log_audit_event(
        action="admin_update_hospital_beds",
        resource_type="hospital",
        resource_id=hospital_id,
        user_id=str(current_user.get("id")),
        details={"icu_beds": hospital.get("available_icu_beds"), "total_beds": hospital.get("total_beds")}
    )

    return ApiResponse(
        success=True,
        message=f"Beds updated for {hospital['name']}",
        data=hospital
    )


class EmergencyStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


@router.patch("/emergency/{alert_id}/status", response_model=ApiResponse[Dict[str, Any]])
async def update_emergency_alert_status(
    alert_id: str,
    req: EmergencyStatusUpdate,
    current_user: dict = Depends(require_role(["admin", "staff"]))
):
    alerts = MOCK_DATA.get("emergency_alerts", [])
    alert = next((a for a in alerts if str(a["id"]) == str(alert_id)), None)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency alert not found.")
    
    alert["status"] = req.status
    if req.notes:
        alert["notes"] = req.notes
    
    return ApiResponse(
        success=True,
        message=f"Emergency status updated to {req.status}",
        data=alert
    )


class SettlePrescriptionRequest(BaseModel):
    appointment_id: str
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    hospital_id: Optional[str] = None
    disease_category: str = Field("General Health", description="Disease or Specialty Category")
    title: str = Field(..., description="Record Title e.g. Cardiology Regimen & Diet Plan")
    diagnosis: str = Field(..., description="Doctor's clinical diagnosis")
    medicines: List[Dict[str, Any]] = Field(default_factory=list, description="List of medicines with morning/evening schedule")
    diet_plan: Optional[Dict[str, Any]] = Field(None, description="Doctor prescribed diet plan")
    notes: Optional[str] = None


@router.post("/prescribe", response_model=ApiResponse[Dict[str, Any]])
async def settle_patient_prescription(
    req: SettlePrescriptionRequest,
    current_user: dict = Depends(require_role(["admin", "staff", "doctor"]))
):
    """
    Enables Doctor/Admin to prescribe and settle medicine regimen (morning, evening, etc.)
    and personalized diet plan categorized by appointment and disease.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(req.appointment_id)), None)
    if not appointment and supabase_service.is_live:
        appointment = supabase_service.get_appointment_by_id(str(req.appointment_id))
        if appointment:
            MOCK_DATA["appointments"].append(appointment)
    
    patient_id = req.patient_id or (appointment["patient_id"] if appointment else "11111111-1111-1111-1111-111111111111")
    doctor_id = req.doctor_id or (appointment.get("doctor_id") if appointment else "doc-hsp-1")
    hospital_id = req.hospital_id or (appointment.get("hospital_id") if appointment else "hosp-hoshiarpur-2")

    # 1. Create or enrich medical record
    record = medical_record_service.create_record(
        patient_id=patient_id,
        title=req.title,
        record_type="Prescription & Diet Plan",
        disease_category=req.disease_category,
        appointment_id=req.appointment_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        medicines=req.medicines,
        diet_plan=req.diet_plan,
        notes=f"Clinical Diagnosis: {req.diagnosis}. " + (req.notes or "")
    )

    # 2. Add to prescriptions table
    presc_id = f"presc-{uuid.uuid4().hex[:8]}"
    medication_items = []
    for m in req.medicines:
        medication_items.append({
            "medicine_name": m.get("name") or m.get("medicine_name") or "Medicine",
            "dosage": m.get("dosage", "1 tablet"),
            "frequency": m.get("timing_label") or "Morning & Evening",
            "duration": m.get("duration", "30 days"),
            "instructions": m.get("instructions", "Take after food")
        })

    presc_entry = {
        "id": presc_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_id": req.appointment_id,
        "diagnosis": req.diagnosis,
        "disease_category": req.disease_category,
        "medications": medication_items,
        "diet_plan": req.diet_plan,
        "instructions": (req.diet_plan.get("doctor_notes") if req.diet_plan else "") or req.notes or "Follow medicine schedule and dietary protocol.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    MOCK_DATA["prescriptions"].append(presc_entry)

    # 3. Update appointment if linked
    if appointment:
        appointment["prescription_id"] = presc_id
        appointment["status"] = "completed"
        appointment["completed_at"] = datetime.now(timezone.utc).isoformat()
        if not appointment.get("notes") or "Prescription" not in appointment.get("notes", ""):
            appointment["notes"] = (appointment.get("notes", "") + f" [Prescription & Diet Settled for {req.disease_category}]").strip()

        supabase_service.update_appointment(str(appointment["id"]), {
            "status": "completed",
            "prescription_id": presc_id,
            "completed_at": appointment["completed_at"],
            "notes": appointment.get("notes")
        })

    # 4. Notify patient
    doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
    doc_name = doc["name"] if doc else "Attending Specialist"
    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(patient_id),
        "title": f"Prescription & Diet Plan Settled ({req.disease_category})",
        "message": f"{doc_name} has prescribed your medicine regimen (morning/evening) and diet plan for appointment #{req.appointment_id}.",
        "type": "prescription_settled",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    log_audit_event(
        action="admin_settle_prescription_and_diet",
        resource_type="medical_record",
        resource_id=record["id"],
        user_id=str(current_user.get("id")),
        details={"appointment_id": req.appointment_id, "disease": req.disease_category, "medicines_count": len(req.medicines)}
    )

    return ApiResponse(
        success=True,
        message=f"Medicine regimen and diet plan settled successfully for {req.disease_category}",
        data={"record": record, "prescription": presc_entry}
    )


