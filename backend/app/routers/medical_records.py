from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user
from app.services.medical_record_service import medical_record_service

router = APIRouter(prefix="/api/v1/medical-records", tags=["Medical Records"])


@router.get("/my", response_model=ApiResponse[List[MedicalRecordResponse]])
async def get_my_medical_records(current_user: dict = Depends(get_current_user)):
    patient_id = str(current_user["id"])
    records = medical_record_service.get_patient_records(patient_id)
    return ApiResponse(
        success=True,
        message="Medical records retrieved successfully",
        data=[MedicalRecordResponse(**r) for r in records]
    )


@router.get("/{record_id}", response_model=ApiResponse[MedicalRecordResponse])
async def get_medical_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    record = medical_record_service.get_record_by_id(record_id, current_user)
    return ApiResponse(
        success=True,
        message="Medical record retrieved successfully",
        data=MedicalRecordResponse(**record)
    )


@router.post("/upload", response_model=ApiResponse[MedicalRecordResponse], status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    req: MedicalRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    patient_id = str(current_user["id"])
    record = medical_record_service.create_record(
        patient_id=patient_id,
        title=req.title,
        record_type=req.record_type,
        disease_category=req.disease_category,
        appointment_id=req.appointment_id,
        doctor_id=req.doctor_id,
        hospital_id=req.hospital_id,
        file_url=req.file_url,
        file_name=req.file_name,
        file_size_bytes=req.file_size_bytes,
        medicines=req.medicines,
        diet_plan=req.diet_plan,
        notes=req.notes,
        metadata=req.metadata
    )
    return ApiResponse(
        success=True,
        message="Medical record stored successfully",
        data=MedicalRecordResponse(**record)
    )
