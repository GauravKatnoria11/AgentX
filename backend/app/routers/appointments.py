from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.schemas.appointment import AppointmentCreate, AppointmentCancel, AppointmentResponse
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user
from app.services.appointment_service import appointment_service
from app.services.email_service import email_reminder_service
from app.supabase import MOCK_DATA

router = APIRouter(prefix="/api/v1/appointments", tags=["Appointments"])


class ManualReminderRequest(BaseModel):
    recipient_email: Optional[str] = None


@router.post("", response_model=ApiResponse[AppointmentResponse], status_code=status.HTTP_201_CREATED)
async def create_appointment(
    req: AppointmentCreate,
    current_user: dict = Depends(get_current_user)
):
    patient_id = str(current_user["id"])
    new_app = appointment_service.book_appointment(
        patient_id=patient_id,
        doctor_id=req.doctor_id,
        hospital_id=req.hospital_id,
        department_id=req.department_id,
        appointment_date=req.appointment_date,
        appointment_time=req.appointment_time,
        reason=req.reason,
        notes=req.notes,
        patient_phone=req.patient_phone,
        blood_group=req.blood_group
    )
    return ApiResponse(
        success=True,
        message="Appointment booked successfully",
        data=AppointmentResponse(**new_app)
    )


@router.get("/my", response_model=ApiResponse[List[AppointmentResponse]])
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    patient_id = str(current_user["id"])
    patient_email = current_user.get("email")
    appointments = appointment_service.get_patient_appointments(patient_id, patient_email=patient_email)
    return ApiResponse(
        success=True,
        message="Appointments retrieved successfully",
        data=[AppointmentResponse(**a) for a in appointments]
    )


@router.get("/{appointment_id}", response_model=ApiResponse[AppointmentResponse])
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    appointment = appointment_service.get_appointment_by_id(appointment_id, current_user)
    return ApiResponse(
        success=True,
        message="Appointment fetched successfully",
        data=AppointmentResponse(**appointment)
    )


@router.patch("/{appointment_id}/cancel", response_model=ApiResponse[AppointmentResponse])
async def cancel_appointment(
    appointment_id: str,
    req: AppointmentCancel,
    current_user: dict = Depends(get_current_user)
):
    cancelled = appointment_service.cancel_appointment(
        appointment_id=appointment_id,
        current_user=current_user,
        cancellation_reason=req.cancellation_reason
    )
    return ApiResponse(
        success=True,
        message="Appointment cancelled successfully",
        data=AppointmentResponse(**cancelled)
    )


@router.patch("/{appointment_id}/complete", response_model=ApiResponse[AppointmentResponse])
async def complete_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marks consultation appointment as completed, enabling the patient to rate the doctor.
    """
    completed = appointment_service.complete_appointment(
        appointment_id=appointment_id,
        current_user=current_user
    )
    return ApiResponse(
        success=True,
        message="Consultation marked as completed. Patient can now submit verified rating.",
        data=AppointmentResponse(**completed)
    )


@router.post("/{appointment_id}/send-reminder", response_model=ApiResponse[Dict[str, Any]])
async def send_appointment_reminder_email(
    appointment_id: str,
    req: Optional[ManualReminderRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Triggers an appointment reminder email via Resend for a specific appointment.
    """
    appt = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    recipient = req.recipient_email if req and req.recipient_email else current_user.get("email")
    res = email_reminder_service.send_appointment_reminder(appt, override_recipient=recipient)

    appt["reminder_sent"] = True
    appt["reminder_delivery"] = res

    return ApiResponse(
        success=True,
        message=f"Reminder email dispatched via Resend to {res.get('recipient', 'patient')}",
        data=res
    )


@router.post("/reminders/trigger-today", response_model=ApiResponse[Dict[str, Any]])
async def trigger_today_reminders():
    """
    Automatic trigger job: Scans and sends Resend reminders for all appointments
    scheduled for today that have not been reminded yet.
    """
    summary = email_reminder_service.trigger_auto_reminders_for_today()
    return ApiResponse(
        success=True,
        message=f"Automatic reminder job completed: {summary['total_reminders_triggered']} reminders dispatched via Resend.",
        data=summary
    )
