from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.hospital import HospitalResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.services.hospital_service import hospital_service

router = APIRouter(prefix="/api/v1/hospitals", tags=["Hospitals"])


@router.get("", response_model=PaginatedResponse[HospitalResponse])
async def list_hospitals(
    city: Optional[str] = Query(None, description="Filter by city name"),
    hospital_type: Optional[str] = Query(None, description="Filter by hospital type (e.g. Clinic, Super-Specialty)"),
    service: Optional[str] = Query(None, description="Filter by available service"),
    disease: Optional[str] = Query(None, description="Filter by treated disease or condition (e.g. Heart Attack, Stroke, Bone Fracture)"),
    scheme: Optional[str] = Query(None, description="Filter by government healthcare scheme (e.g. PM-JAY, AB-SSBY, ECHS, CGHS)"),
    emergency_only: bool = Query(False, description="Show only facilities with 24/7 emergency care"),
    user_lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    user_lon: Optional[float] = Query(None, description="User longitude for distance calculation"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    result = hospital_service.get_hospitals(
        city=city,
        hospital_type=hospital_type,
        service=service,
        disease=disease,
        scheme=scheme,
        emergency_only=emergency_only,
        user_lat=user_lat,
        user_lon=user_lon,
        page=page,
        limit=limit
    )

    items = [HospitalResponse(**h) for h in result["items"]]
    pagination = PaginationMeta(page=result["page"], limit=result["limit"], total=result["total"])

    return PaginatedResponse(
        success=True,
        message="Hospitals fetched successfully",
        data=items,
        pagination=pagination
    )


@router.get("/search", response_model=ApiResponse[List[HospitalResponse]])
async def search_hospitals(
    q: str = Query(..., min_length=1, description="Search term for hospital name, city, or service"),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None)
):
    results = hospital_service.search_hospitals(query=q, user_lat=user_lat, user_lon=user_lon)
    return ApiResponse(
        success=True,
        message="Hospital search completed successfully",
        data=[HospitalResponse(**h) for h in results]
    )


@router.get("/{hospital_id}", response_model=ApiResponse[Dict[str, Any]])
async def get_hospital_details(hospital_id: str):
    hospital = hospital_service.get_hospital_by_id(hospital_id)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    return ApiResponse(
        success=True,
        message="Hospital fetched successfully",
        data=hospital
    )
