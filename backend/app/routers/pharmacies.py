from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.pharmacy import PharmacyResponse
from app.schemas.common import ApiResponse
from app.services.pharmacy_service import pharmacy_service

router = APIRouter(prefix="/api/v1/pharmacies", tags=["Pharmacies"])


@router.get("", response_model=ApiResponse[List[PharmacyResponse]])
async def list_pharmacies(
    city: Optional[str] = Query(None, description="Filter by city"),
    open_only: bool = Query(False, description="Show only currently open pharmacies"),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None)
):
    pharmacies = pharmacy_service.get_pharmacies(city=city, open_only=open_only, user_lat=user_lat, user_lon=user_lon)
    return ApiResponse(
        success=True,
        message="Pharmacies fetched successfully",
        data=[PharmacyResponse(**p) for p in pharmacies]
    )


@router.get("/search", response_model=ApiResponse[List[PharmacyResponse]])
async def search_pharmacies(
    q: str = Query(..., min_length=1, description="Search term for pharmacy name or location"),
    user_lat: Optional[float] = Query(None),
    user_lon: Optional[float] = Query(None)
):
    results = pharmacy_service.get_pharmacies(search=q, user_lat=user_lat, user_lon=user_lon)
    return ApiResponse(
        success=True,
        message="Pharmacy search completed successfully",
        data=[PharmacyResponse(**p) for p in results]
    )


@router.get("/{pharmacy_id}", response_model=ApiResponse[PharmacyResponse])
async def get_pharmacy(pharmacy_id: str):
    pharm = pharmacy_service.get_pharmacy_by_id(pharmacy_id)
    if not pharm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    return ApiResponse(
        success=True,
        message="Pharmacy fetched successfully",
        data=PharmacyResponse(**pharm)
    )
