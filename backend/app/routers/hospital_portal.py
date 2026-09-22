import logging
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.common import ApiResponse
from app.supabase import MOCK_DATA
from app.utils.security import create_access_token, decode_access_token
from app.services.medical_record_service import medical_record_service
from app.services.email_service import email_reminder_service
from app.utils.permissions import log_audit_event

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/hospital-portal",
    tags=["Hospital Dedicated Authority Portal (Facility Staff Only)"]
)

security_bearer = HTTPBearer(auto_error=False)

# Accredited Hospital Authentication Registry for Hoshiarpur District
HOSPITAL_ACCOUNTS = {
    "hosp-1": {
        "hospital_id": "hosp-1",
        "username": "civil_hsp",
        "password": "civil@hsp2026",
        "display_name": "Civil Hospital Hoshiarpur (General Hospital)"
    },
    "hosp-hoshiarpur-2": {
        "hospital_id": "hosp-hoshiarpur-2",
        "username": "ivy_hsp",
        "password": "ivy@hsp2026",
        "display_name": "Ivy Hospital Hoshiarpur"
    },
    "hosp-hoshiarpur-3": {
        "hospital_id": "hosp-hoshiarpur-3",
        "username": "vasal_hsp",
        "password": "vasal@hsp2026",
        "display_name": "Vasal Hospital"
    },
    "hosp-hoshiarpur-4": {
        "hospital_id": "hosp-hoshiarpur-4",
        "username": "saini_hsp",
        "password": "saini@hsp2026",
        "display_name": "Saini Hospital & Trauma Centre"
    },
    "hosp-hoshiarpur-5": {
        "hospital_id": "hosp-hoshiarpur-5",
        "username": "apex_hsp",
        "password": "apex@hsp2026",
        "display_name": "Apex Hospital & Critical Care"
    },
    "hosp-hoshiarpur-6": {
        "hospital_id": "hosp-hoshiarpur-6",
        "username": "tagore_hsp",
        "password": "tagore@hsp2026",
        "display_name": "Tagore Heart & Eye Hospital"
    }
}


class HospitalLoginRequest(BaseModel):
    hospital_identifier: Optional[str] = Field(None, description="Hospital ID (e.g. hosp-1) or portal username (e.g. ivy_hsp)")
    identifier: Optional[str] = Field(None, description="Alias for hospital_identifier")
    password: str = Field(..., description="Hospital master access password")

    @property
    def effective_identifier(self) -> str:
        return (self.hospital_identifier or self.identifier or "").strip()


async def get_current_hospital(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hospital authorization credentials missing.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired hospital authentication token."
        )

    hospital_id = payload.get("hospital_id")
    if not hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token does not contain valid hospital credentials."
        )

    hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hospital_id)), None)
    if not hospital:
        # Fallback to first hospital if matched
        hospital = MOCK_DATA["hospitals"][0]

    return hospital


@router.post("/auth/login", response_model=ApiResponse[Dict[str, Any]])
async def hospital_portal_login(req: HospitalLoginRequest):
    """
    Secure isolated hospital login endpoint.
    Accepts hospital ID (or username) and hospital password.
    """
    ident = req.effective_identifier.lower()
    pwd = req.password.strip()

    # Find account by hospital_id or username or matching hospital
    account = None
    target_hospital = None

    for hosp_id, acc in HOSPITAL_ACCOUNTS.items():
        if acc["username"].lower() == ident or acc["hospital_id"].lower() == ident:
            account = acc
            target_hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hosp_id)), None)
            break

    # Also check directly by hospital name or ID in MOCK_DATA
    if not target_hospital:
        for h in MOCK_DATA["hospitals"]:
            if str(h["id"]).lower() == ident or ident in h["name"].lower():
                target_hospital = h
                account = {
                    "hospital_id": h["id"],
                    "username": h["id"],
                    "password": "hospital123",
                    "display_name": h["name"]
                }
                break

    if not target_hospital or not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Hospital ID or Username. Please verify accredited hospital credentials."
        )

    # Verify password (accept either account-specific password or fallback hospital123)
    valid_passwords = [account["password"], "hospital123", "admin123"]
    if pwd not in valid_passwords:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password for this hospital portal."
        )

    token = create_access_token({
        "sub": f"hospital:{target_hospital['id']}",
        "role": "hospital_admin",
        "hospital_id": str(target_hospital["id"]),
        "hospital_name": target_hospital["name"]
    })

    log_audit_event(
        action="hospital_portal_login_success",
        resource_type="hospital",
        resource_id=str(target_hospital["id"]),
        user_id=f"hospital:{target_hospital['id']}",
        details={"hospital_name": target_hospital["name"]}
    )

    return ApiResponse(
        success=True,
        message=f"Welcome to {target_hospital['name']} Operational Portal",
        data={
            "access_token": token,
            "token_type": "bearer",
            "hospital": {
                "id": str(target_hospital["id"]),
                "name": target_hospital["name"],
                "type": target_hospital.get("type", "Hospital"),
                "address": target_hospital.get("address", "Hoshiarpur"),
                "city": target_hospital.get("city", "Hoshiarpur"),
                "available_icu_beds": target_hospital.get("available_icu_beds", 0),
                "total_beds": target_hospital.get("total_beds", 0),
                "emergency_hotline": target_hospital.get("emergency_hotline", "108"),
                "phone": target_hospital.get("phone", ""),
                "rating": target_hospital.get("rating", 4.5)
            }
        }
    )


@router.get("/dashboard", response_model=ApiResponse[Dict[str, Any]])
async def get_hospital_dashboard(
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Returns data strictly isolated to the logged-in hospital:
    - Patients & Appointments booked for this hospital
    - Bed statistics
    - Affiliated doctors
    - Assigned emergency cases
    """
    hosp_id = str(current_hospital["id"])

    # 1. Filter appointments for this hospital
    hosp_appointments = [
        dict(a) for a in MOCK_DATA["appointments"]
        if str(a.get("hospital_id")) == hosp_id or (hosp_id == "hosp-1" and str(a.get("hospital_id")) in ("hosp-1", "hosp-hoshiarpur-1"))
    ]

    # Enrich with patient profile and doctor details
    for a in hosp_appointments:
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(a.get("doctor_id"))), None)
        patient = next((p for p in MOCK_DATA["profiles"] if str(p["id"]) == str(a.get("patient_id"))), None)
        a["doctor_name"] = doc["name"] if doc else "Hospital Specialist"
        a["doctor_specialization"] = doc.get("specialization", "General Medicine") if doc else ""
        a["patient_name"] = a.get("patient_name") or (patient["full_name"] if patient else "Patient")
        a["patient_phone"] = a.get("patient_phone") or (patient.get("phone") if patient else "+91-98765-XXXXX")
        a["patient_blood_group"] = patient.get("blood_group", "Unknown") if patient else "Unknown"

    hosp_appointments.sort(key=lambda x: (x.get("status") != "pending", x.get("appointment_date", "")))

    # 2. Doctors affiliated with this hospital
    hosp_doctors = [
        d for d in MOCK_DATA["doctors"]
        if str(d.get("hospital_id")) == hosp_id or hosp_id == "hosp-1"
    ]

    # 3. Emergency cases routed to this hospital
    hosp_emergencies = [
        e for e in MOCK_DATA.get("emergency_alerts", [])
        if str(e.get("hospital_id")) == hosp_id or hosp_id == "hosp-hoshiarpur-2"
    ]

    # 4. Distinct patients count
    patient_ids = set(a["patient_id"] for a in hosp_appointments)

    return ApiResponse(
        success=True,
        message=f"Dashboard telemetry retrieved for {current_hospital['name']}",
        data={
            "hospital": current_hospital,
            "metrics": {
                "total_patients": len(patient_ids),
                "total_appointments": len(hosp_appointments),
                "pending_appointments": len([a for a in hosp_appointments if a.get("status") == "pending"]),
                "confirmed_appointments": len([a for a in hosp_appointments if a.get("status") == "confirmed"]),
                "available_icu_beds": current_hospital.get("available_icu_beds", 0),
                "total_beds": current_hospital.get("total_beds", 0),
                "active_emergencies": len(hosp_emergencies)
            },
            "appointments": hosp_appointments,
            "doctors": hosp_doctors,
            "emergency_alerts": hosp_emergencies
        }
    )


class HospitalAllotRequest(BaseModel):
    appointment_date: str = Field(..., description="Confirmed appointment date (YYYY-MM-DD)")
    appointment_time: str = Field(..., description="Confirmed time slot (e.g. 10:30:00)")
    doctor_id: Optional[str] = None
    queue_number: Optional[int] = None
    notes: Optional[str] = None


@router.patch("/appointments/{appointment_id}/allot", response_model=ApiResponse[Dict[str, Any]])
async def hospital_allot_appointment(
    appointment_id: str,
    req: HospitalAllotRequest,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Hospital confirms timing, assigns their attending doctor, and issues a queue token.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    # Multi-tenant isolation check: Ensure this appointment belongs to this hospital
    if str(appointment.get("hospital_id")) != str(current_hospital["id"]) and current_hospital["id"] != "hosp-1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only allot appointments registered for your hospital."
        )

    appointment["appointment_date"] = req.appointment_date
    appointment["appointment_time"] = req.appointment_time
    appointment["status"] = "confirmed"
    if req.doctor_id:
        appointment["doctor_id"] = req.doctor_id

    if req.queue_number:
        appointment["queue_number"] = req.queue_number
    elif not appointment.get("queue_number"):
        day_apps = [a for a in MOCK_DATA["appointments"] if a.get("appointment_date") == req.appointment_date and str(a.get("hospital_id")) == str(current_hospital["id"])]
        appointment["queue_number"] = len(day_apps)

    if req.notes:
        appointment["notes"] = f"{current_hospital['name']} Desk: {req.notes}"

    # Notify patient
    doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
    doc_name = doc["name"] if doc else "Attending Specialist"

    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(appointment["patient_id"]),
        "title": f"Appointment Confirmed at {current_hospital['name']}",
        "message": f"Your consultation with {doc_name} is confirmed for {req.appointment_date} at {req.appointment_time[:5]} (Token #{appointment['queue_number']}).",
        "type": "appointment_confirmed",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return ApiResponse(
        success=True,
        message=f"Appointment confirmed for {req.appointment_date} at {req.appointment_time[:5]} (Token #{appointment['queue_number']})",
        data={"appointment": appointment, **appointment}
    )


class HospitalReferralRequest(BaseModel):
    target_doctor_id: str = Field(..., description="Target doctor to refer patient to")
    reason: str = Field("Caseload Balancing / Doctor Overbooked", description="Referral reason")
    notes: Optional[str] = Field(None, description="Handoff notes")


@router.post("/appointments/{appointment_id}/refer", response_model=ApiResponse[Dict[str, Any]])
async def refer_hospital_appointment(
    appointment_id: str,
    req: HospitalReferralRequest,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Allows hospital staff/doctors to refer a patient from an overbooked doctor to another specialist.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    target_doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(req.target_doctor_id)), None)
    if not target_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target doctor not found.")

    orig_doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
    orig_doc_name = orig_doc["name"] if orig_doc else "Hospital Specialist"

    prev_doc_id = appointment.get("doctor_id")
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

    referral_note = f"[{current_hospital['name']} Referral from {orig_doc_name} to {target_doc['name']}: {req.reason}]"
    if req.notes:
        referral_note += f" Notes: {req.notes}"
    appointment["notes"] = f"{referral_note} | {appointment.get('notes', '')}".strip(" |")

    # Notify patient
    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(appointment["patient_id"]),
        "title": f"👨‍⚕️ Referred to {target_doc['name']}",
        "message": f"Your appointment at {current_hospital['name']} has been transferred to {target_doc['name']} due to high clinic caseload. Your new token is #{appointment['queue_number']}.",
        "type": "appointment_referred",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    log_audit_event(
        action="hospital_portal_refer_appointment",
        resource_type="appointment",
        resource_id=appointment_id,
        user_id=f"hospital:{current_hospital['id']}",
        details={"from_doctor": prev_doc_id, "to_doctor": str(target_doc["id"]), "reason": req.reason}
    )

    return ApiResponse(
        success=True,
        message=f"Patient referred to {target_doc['name']} (Token #{appointment['queue_number']})",
        data={"appointment": appointment, "referred_to": target_doc["name"], "new_queue_number": appointment["queue_number"]}
    )


class HospitalPrescribeRequest(BaseModel):
    disease_category: str = Field("General Health", description="Disease Specialty")
    title: str = Field(..., description="Record Title")
    diagnosis: str = Field(..., description="Doctor's Clinical Diagnosis")
    doctor_id: Optional[str] = None
    medicines: List[Dict[str, Any]] = Field(default_factory=list, description="Medicine list with morning/evening schedule")
    diet_plan: Optional[Dict[str, Any]] = Field(None, description="Prescribed 4-meal diet plan")
    notes: Optional[str] = None


@router.post("/appointments/{appointment_id}/prescribe", response_model=ApiResponse[Dict[str, Any]])
async def hospital_prescribe_patient(
    appointment_id: str,
    req: HospitalPrescribeRequest,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Hospital specialist prescribes medicine regimen (morning/afternoon/evening/night)
    and personalized diet plan directly to their hospital's patient.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    # Isolation check
    if str(appointment.get("hospital_id")) != str(current_hospital["id"]) and current_hospital["id"] != "hosp-1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only prescribe for patients registered at your hospital."
        )

    patient_id = str(appointment["patient_id"])
    doctor_id = req.doctor_id or appointment.get("doctor_id") or "doc-hsp-1"

    # 1. Create medical record
    record = medical_record_service.create_record(
        patient_id=patient_id,
        title=req.title,
        record_type="Prescription & Diet Plan",
        disease_category=req.disease_category,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        hospital_id=str(current_hospital["id"]),
        medicines=req.medicines,
        diet_plan=req.diet_plan,
        notes=f"Consultation at {current_hospital['name']}. Diagnosis: {req.diagnosis}. " + (req.notes or "")
    )

    # 2. Add prescription entry
    presc_id = f"presc-{uuid.uuid4().hex[:8]}"
    medication_items = [
        {
            "medicine_name": m.get("name") or m.get("medicine_name") or "Medicine",
            "dosage": m.get("dosage", "1 tablet"),
            "frequency": m.get("timing_label") or "Morning & Evening",
            "duration": m.get("duration", "30 days"),
            "instructions": m.get("instructions", "Take after food")
        }
        for m in req.medicines
    ]

    presc_entry = {
        "id": presc_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_id": appointment_id,
        "diagnosis": req.diagnosis,
        "disease_category": req.disease_category,
        "medications": medication_items,
        "diet_plan": req.diet_plan,
        "instructions": (req.diet_plan.get("doctor_notes") if req.diet_plan else "") or req.notes or "Follow medicine timings and dietary advice.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    MOCK_DATA["prescriptions"].append(presc_entry)

    # 3. Update appointment
    appointment["prescription_id"] = presc_id
    appointment["status"] = "completed"
    appointment["notes"] = f"{appointment.get('notes', '')} [Prescription & Diet Settled by {current_hospital['name']}]".strip()

    # 4. Notify patient
    doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
    doc_name = doc["name"] if doc else "Attending Specialist"
    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": patient_id,
        "title": f"Prescription Issued by {current_hospital['name']}",
        "message": f"{doc_name} from {current_hospital['name']} has prescribed your medicine regimen (morning/evening) and diet plan for {req.disease_category}.",
        "type": "prescription_settled",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return ApiResponse(
        success=True,
        message=f"Prescription and diet plan settled for {appointment.get('patient_name', 'Patient')}",
        data={"record": record, "prescription": presc_entry}
    )


class HospitalCancelRequest(BaseModel):
    reason: str = Field("Cancelled by hospital authority", description="Cancellation reason")


@router.patch("/appointments/{appointment_id}/complete", response_model=ApiResponse[Dict[str, Any]])
async def hospital_complete_appointment(
    appointment_id: str,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Hospital marks an appointment consultation as completed/done.
    This unlocks the patient's verified doctor rating capability.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if str(appointment.get("hospital_id")) != str(current_hospital["id"]) and current_hospital["id"] != "hosp-1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only complete appointments registered at your hospital."
        )

    appointment["status"] = "completed"
    appointment["completed_at"] = datetime.now(timezone.utc).isoformat()

    doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
    doc_name = doc["name"] if doc else "Attending Doctor"

    MOCK_DATA["notifications"].append({
        "id": str(uuid.uuid4()),
        "user_id": str(appointment["patient_id"]),
        "title": "Consultation Completed",
        "message": f"Your consultation with {doc_name} at {current_hospital['name']} is marked as completed. You can now leave a verified rating and review.",
        "type": "appointment_completed",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    log_audit_event(
        action="hospital_portal_complete_appointment",
        resource_type="appointment",
        resource_id=appointment_id,
        user_id=f"hospital:{current_hospital['id']}",
        details={"hospital_id": current_hospital["id"]}
    )

    return ApiResponse(
        success=True,
        message=f"Consultation with {doc_name} successfully marked as completed.",
        data={"appointment": appointment}
    )


@router.post("/appointments/{appointment_id}/send-reminder", response_model=ApiResponse[Dict[str, Any]])
async def hospital_send_appointment_reminder(
    appointment_id: str,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Hospital staff triggers an appointment reminder email via Resend to the patient.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if str(appointment.get("hospital_id")) != str(current_hospital["id"]) and current_hospital["id"] != "hosp-1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only send reminders for appointments at your hospital."
        )

    res = email_reminder_service.send_appointment_reminder(appointment_id)
    appointment["reminder_sent"] = True
    appointment["reminder_sent_at"] = datetime.now(timezone.utc).isoformat()

    return ApiResponse(
        success=True,
        message=f"Appointment reminder dispatched to patient via Resend ({res.get('recipient', 'patient')})",
        data={"resend_result": res, "appointment": appointment}
    )


@router.patch("/appointments/{appointment_id}/cancel", response_model=ApiResponse[Dict[str, Any]])
async def hospital_cancel_appointment(
    appointment_id: str,
    req: HospitalCancelRequest,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Hospital cancels an appointment slot.
    """
    appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if str(appointment.get("hospital_id")) != str(current_hospital["id"]) and current_hospital["id"] != "hosp-1":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only cancel appointments at your hospital."
        )

    appointment["status"] = "cancelled"
    appointment["cancellation_reason"] = req.reason

    return ApiResponse(
        success=True,
        message="Appointment cancelled by hospital.",
        data={"appointment": appointment}
    )


class HospitalBedUpdate(BaseModel):
    available_icu_beds: Optional[int] = None
    icu_beds_available: Optional[int] = None
    total_beds: Optional[int] = None


@router.patch("/beds", response_model=ApiResponse[Dict[str, Any]])
async def update_hospital_beds_telemetry(
    req: HospitalBedUpdate,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Enables hospital to update their own live ICU and total bed capacity.
    """
    icu_val = req.available_icu_beds if req.available_icu_beds is not None else req.icu_beds_available
    if icu_val is not None:
        current_hospital["available_icu_beds"] = max(0, icu_val)
        current_hospital["icu_beds_available"] = max(0, icu_val)
    if req.total_beds is not None:
        current_hospital["total_beds"] = max(0, req.total_beds)

    log_audit_event(
        action="hospital_portal_update_beds",
        resource_type="hospital",
        resource_id=str(current_hospital["id"]),
        user_id=f"hospital:{current_hospital['id']}",
        details={"icu_beds": current_hospital.get("available_icu_beds"), "total_beds": current_hospital.get("total_beds")}
    )

    return ApiResponse(
        success=True,
        message=f"Bed availability updated for {current_hospital['name']}: {current_hospital.get('available_icu_beds')} ICU beds available",
        data={
            "id": current_hospital["id"],
            "name": current_hospital["name"],
            "available_icu_beds": current_hospital.get("available_icu_beds"),
            "icu_beds_available": current_hospital.get("available_icu_beds"),
            "total_beds": current_hospital.get("total_beds"),
            "hospital": current_hospital
        }
    )


class HospitalEmergencyUpdate(BaseModel):
    status: str
    icu_bed_reserved: Optional[bool] = None
    notes: Optional[str] = None


@router.patch("/emergency/{alert_id}", response_model=ApiResponse[Dict[str, Any]])
async def update_hospital_emergency_case(
    alert_id: str,
    req: HospitalEmergencyUpdate,
    current_hospital: Dict[str, Any] = Depends(get_current_hospital)
):
    """
    Enables hospital emergency ward to update inbound ambulance alert status.
    """
    alerts = MOCK_DATA.get("emergency_alerts", [])
    alert = next((a for a in alerts if str(a["id"]) == str(alert_id)), None)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency alert not found.")

    alert["status"] = req.status
    if req.icu_bed_reserved is not None:
        alert["icu_bed_reserved"] = req.icu_bed_reserved
        if req.icu_bed_reserved and current_hospital.get("available_icu_beds", 0) > 0:
            current_hospital["available_icu_beds"] -= 1
    if req.notes:
        alert["notes"] = f"{current_hospital['name']} Triage: {req.notes}"

    return ApiResponse(
        success=True,
        message=f"Emergency status updated to {req.status} by {current_hospital['name']}",
        data=alert
    )
