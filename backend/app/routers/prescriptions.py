from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user
from app.services.prescription_service import prescription_service

router = APIRouter(prefix="/api/v1/prescriptions", tags=["Prescriptions"])


@router.get("/my", response_model=ApiResponse[List[PrescriptionResponse]])
async def get_my_prescriptions(current_user: dict = Depends(get_current_user)):
    patient_id = str(current_user["id"])
    prescriptions = prescription_service.get_my_prescriptions(patient_id)
    return ApiResponse(
        success=True,
        message="Prescriptions retrieved successfully",
        data=[PrescriptionResponse(**p) for p in prescriptions]
    )


@router.get("/{prescription_id}", response_model=ApiResponse[PrescriptionResponse])
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    presc = prescription_service.get_prescription_by_id(prescription_id, current_user)
    return ApiResponse(
        success=True,
        message="Prescription retrieved successfully",
        data=PrescriptionResponse(**presc)
    )


@router.post("/upload", response_model=ApiResponse[PrescriptionResponse], status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    req: PrescriptionCreate,
    current_user: dict = Depends(get_current_user)
):
    # Enforce patient ownership on upload
    patient_id = str(current_user["id"]) if current_user.get("role") == "patient" else req.patient_id
    doctor_id = str(current_user["id"]) if current_user.get("role") == "doctor" else req.doctor_id

    created = prescription_service.upload_prescription(
        patient_id=patient_id,
        diagnosis=req.diagnosis,
        medications=[m.model_dump() for m in req.medications],
        instructions=req.instructions,
        file_url=req.file_url,
        doctor_id=doctor_id,
        appointment_id=req.appointment_id,
        is_ai_caller=False
    )

    return ApiResponse(
        success=True,
        message="Prescription uploaded and recorded successfully",
        data=PrescriptionResponse(**created)
    )
