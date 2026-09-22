from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from app.schemas.admin import SystemMetrics, QueuePatientItem, AuditLogItem
from app.schemas.hospital import HospitalCreate, HospitalResponse
from app.schemas.common import ApiResponse
from app.dependencies import require_role
from app.services.admin_service import admin_service

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Hospital & Administrative Management (Staff / Admin Only)"]
)


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
