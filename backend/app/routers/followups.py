from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from app.schemas.followup import FollowupCreate, FollowupSubmission, FollowupResponse
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user, require_role
from app.services.followup_service import followup_service

router = APIRouter(prefix="/api/v1/followups", tags=["Follow-ups"])


@router.get("/my", response_model=ApiResponse[List[FollowupResponse]])
async def get_my_followups(current_user: dict = Depends(get_current_user)):
    patient_id = str(current_user["id"])
    plans = followup_service.get_patient_followups(patient_id)
    return ApiResponse(
        success=True,
        message="Follow-up plans retrieved successfully",
        data=[FollowupResponse(**p) for p in plans]
    )


@router.post("/plan", response_model=ApiResponse[Dict[str, Any]], status_code=status.HTTP_201_CREATED)
async def create_followup_plan(
    req: FollowupCreate,
    current_user: dict = Depends(require_role(["doctor", "staff", "admin"]))
):
    plan = followup_service.create_followup_plan(
        patient_id=req.patient_id,
        appointment_id=req.appointment_id,
        interval_type=req.interval_type,
        scheduled_at=req.scheduled_at,
        questions=[q.model_dump() for q in req.questions],
        doctor_id=str(current_user["id"]) if current_user.get("role") == "doctor" else req.doctor_id
    )
    return ApiResponse(
        success=True,
        message="Follow-up care plan initiated",
        data=plan
    )


@router.post("/{followup_id}/respond", response_model=ApiResponse[Dict[str, Any]])
async def submit_followup_response(
    followup_id: str,
    req: FollowupSubmission,
    current_user: dict = Depends(get_current_user)
):
    patient_id = str(current_user["id"])
    res = followup_service.submit_followup_response(
        followup_id=followup_id,
        patient_id=patient_id,
        responses=req.responses,
        severity_score=req.symptoms_severity_score
    )
    return ApiResponse(
        success=True,
        message="Follow-up check-in response submitted successfully",
        data=res
    )
