from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.department import DepartmentResponse
from app.schemas.common import ApiResponse
from app.services.department_service import department_service

router = APIRouter(prefix="/api/v1/departments", tags=["Departments"])


@router.get("", response_model=ApiResponse[List[DepartmentResponse]])
async def list_departments(hospital_id: Optional[str] = Query(None, description="Filter by hospital ID")):
    depts = department_service.get_departments(hospital_id=hospital_id)
    return ApiResponse(
        success=True,
        message="Departments fetched successfully",
        data=[DepartmentResponse(**d) for d in depts]
    )


@router.get("/{department_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_department(department_id: str):
    dept = department_service.get_department_by_id(department_id)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    return ApiResponse(
        success=True,
        message="Department fetched successfully",
        data=dept
    )
