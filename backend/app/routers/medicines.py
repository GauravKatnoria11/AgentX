from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.medicine import MedicineResponse
from app.schemas.common import ApiResponse
from app.services.medicine_service import medicine_service

router = APIRouter(prefix="/api/v1/medicines", tags=["Medicines"])


@router.get("", response_model=ApiResponse[List[MedicineResponse]])
async def list_medicines(
    pharmacy_id: Optional[str] = Query(None, description="Filter by pharmacy ID"),
    in_stock_only: bool = Query(True, description="Show only medicines in stock")
):
    medicines = medicine_service.get_medicines(pharmacy_id=pharmacy_id, in_stock_only=in_stock_only)
    return ApiResponse(
        success=True,
        message="Medicines fetched successfully",
        data=[MedicineResponse(**m) for m in medicines]
    )


@router.get("/search", response_model=ApiResponse[List[MedicineResponse]])
async def search_medicines(
    q: str = Query(..., min_length=1, description="Search term for medicine brand or generic name"),
    pharmacy_id: Optional[str] = Query(None)
):
    results = medicine_service.get_medicines(pharmacy_id=pharmacy_id, search=q)
    return ApiResponse(
        success=True,
        message="Medicine search completed successfully",
        data=[MedicineResponse(**m) for m in results]
    )


@router.get("/{medicine_id}", response_model=ApiResponse[MedicineResponse])
async def get_medicine(medicine_id: str):
    med = medicine_service.get_medicine_by_id(medicine_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    return ApiResponse(
        success=True,
        message="Medicine fetched successfully",
        data=MedicineResponse(**med)
    )
