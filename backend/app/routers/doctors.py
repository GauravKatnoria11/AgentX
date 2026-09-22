from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends, status
from app.schemas.doctor import (
    DoctorResponse,
    DoctorAvailabilityResponse,
    DoctorReviewCreate,
    DoctorReviewStatsResponse
)
from app.schemas.common import ApiResponse
from app.services.doctor_service import doctor_service
from app.dependencies import get_current_user, get_optional_user

router = APIRouter(prefix="/api/v1/doctors", tags=["Doctors"])


@router.get("", response_model=ApiResponse[List[DoctorResponse]])
async def list_doctors(
    hospital_id: Optional[str] = Query(None, description="Filter by hospital ID"),
    department_id: Optional[str] = Query(None, description="Filter by department ID"),
    specialization: Optional[str] = Query(None, description="Filter by medical specialization"),
    search: Optional[str] = Query(None, description="Search by doctor name or keywords"),
    available_only: bool = Query(False, description="Show only currently available doctors")
):
    doctors = doctor_service.get_doctors(
        hospital_id=hospital_id,
        department_id=department_id,
        specialization=specialization,
        search=search,
        available_only=available_only
    )
    return ApiResponse(
        success=True,
        message="Doctors fetched successfully",
        data=[DoctorResponse(**d) for d in doctors]
    )


@router.get("/{doctor_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_doctor(doctor_id: str):
    doc = doctor_service.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return ApiResponse(
        success=True,
        message="Doctor details fetched successfully",
        data=doc
    )


@router.get("/{doctor_id}/availability", response_model=ApiResponse[DoctorAvailabilityResponse])
async def get_doctor_availability(
    doctor_id: str,
    check_date: Optional[date] = Query(default_factory=date.today, description="Date to check available booking slots (YYYY-MM-DD)")
):
    avail = doctor_service.get_doctor_availability(doctor_id, check_date)
    return ApiResponse(
        success=True,
        message="Doctor availability slots fetched successfully",
        data=DoctorAvailabilityResponse(**avail)
    )


@router.get("/{doctor_id}/reviews", response_model=ApiResponse[DoctorReviewStatsResponse])
async def get_doctor_reviews(
    doctor_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Returns verified reviews, rating breakdown, and checks if current patient
    has completed an appointment qualifying them to rate this doctor.
    """
    user_id = str(current_user["id"]) if current_user else None
    stats = doctor_service.get_doctor_reviews(doctor_id=doctor_id, current_user_id=user_id)
    return ApiResponse(
        success=True,
        message=f"Reviews for {stats['doctor_name']} fetched successfully",
        data=DoctorReviewStatsResponse(**stats)
    )


@router.post("/{doctor_id}/ratings", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def submit_doctor_rating(
    doctor_id: str,
    req: DoctorReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits a rating and clinical review for a doctor.
    STRICT REQUIREMENT: Patient must have an appointment with this doctor AND
    the appointment status must be 'completed'.
    """
    patient_id = str(current_user["id"])
    result = doctor_service.submit_doctor_review(
        doctor_id=doctor_id,
        patient_id=patient_id,
        rating=req.rating,
        comment=req.comment,
        tags=req.tags,
        appointment_id=req.appointment_id
    )
    return ApiResponse(
        success=True,
        message=f"Thank you! Your verified rating of {req.rating}★ for {result['doctor']['name']} has been published.",
        data=result
    )
