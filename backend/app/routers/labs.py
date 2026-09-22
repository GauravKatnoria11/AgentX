from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.lab import LabResponse
from app.schemas.common import ApiResponse
from app.services.lab_service import lab_service

router = APIRouter(prefix="/api/v1/labs", tags=["Labs & Diagnostics"])


@router.get("", response_model=ApiResponse[List[LabResponse]])
async def list_labs(
    city: Optional[str] = Query(None, description="Filter by city"),
    test_type: Optional[str] = Query(None, description="Filter by test type e.g. MRI, Blood Test, ECG"),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None)
):
    labs = lab_service.get_labs(city=city, test_type=test_type, user_lat=user_lat, user_lon=user_lon)
    return ApiResponse(
        success=True,
        message="Diagnostic labs fetched successfully",
        data=[LabResponse(**l) for l in labs]
    )


@router.get("/search", response_model=ApiResponse[List[LabResponse]])
async def search_labs(
    q: str = Query(..., min_length=1, description="Search term for lab or test"),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None)
):
    results = lab_service.get_labs(search=q, user_lat=user_lat, user_lon=user_lon)
    return ApiResponse(
        success=True,
        message="Lab search completed successfully",
        data=[LabResponse(**l) for l in results]
    )


@router.get("/{lab_id}", response_model=ApiResponse[LabResponse])
async def get_lab(lab_id: str):
    lab = lab_service.get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab not found")
    return ApiResponse(
        success=True,
        message="Lab fetched successfully",
        data=LabResponse(**lab)
    )
