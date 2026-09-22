from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.doctor import DoctorResponse, DoctorAvailabilityResponse
from app.schemas.common import ApiResponse
from app.services.doctor_service import doctor_service

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
