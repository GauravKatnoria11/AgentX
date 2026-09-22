from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.appointment import AppointmentCreate, AppointmentCancel, AppointmentResponse
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user
from app.services.appointment_service import appointment_service

router = APIRouter(prefix="/api/v1/appointments", tags=["Appointments"])


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
        notes=req.notes
    )
    return ApiResponse(
        success=True,
        message="Appointment booked successfully",
        data=AppointmentResponse(**new_app)
    )


@router.get("/my", response_model=ApiResponse[List[AppointmentResponse]])
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    patient_id = str(current_user["id"])
    appointments = appointment_service.get_patient_appointments(patient_id)
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
