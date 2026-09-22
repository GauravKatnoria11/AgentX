from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.map import RouteResponse, DistanceMatrixResponse, ETAResponse
from app.schemas.common import ApiResponse
from app.services.map_service import map_service

router = APIRouter(prefix="/api/v1/maps", tags=["Google Maps & Navigation"])


@router.get("/route", response_model=ApiResponse[RouteResponse])
async def get_route(
    origin: str = Query(..., description="Starting point address or lat,lon"),
    destination: str = Query(..., description="Hospital or clinic address or lat,lon"),
    mode: str = Query("driving", description="Travel mode (driving, walking, transit, bicycling)")
):
    route_data = await map_service.get_route(origin=origin, destination=destination, mode=mode)
    return ApiResponse(
        success=True,
        message="Route calculated successfully",
        data=RouteResponse(**route_data)
    )


@router.get("/distance", response_model=ApiResponse[DistanceMatrixResponse])
async def get_distance(
    origin: str = Query(..., description="Starting location"),
    destination: str = Query(..., description="Destination hospital"),
    mode: str = Query("driving")
):
    matrix_data = await map_service.get_distance_matrix(origin=origin, destination=destination, mode=mode)
    return ApiResponse(
        success=True,
        message="Distance calculated successfully",
        data=DistanceMatrixResponse(**matrix_data)
    )


@router.get("/eta", response_model=ApiResponse[ETAResponse])
async def get_eta(
    origin: str = Query(..., description="Starting location"),
    destination: str = Query(..., description="Destination medical center"),
    mode: str = Query("driving")
):
    eta_data = await map_service.get_eta(origin=origin, destination=destination, mode=mode)
    return ApiResponse(
        success=True,
        message="Estimated arrival time and departure suggestion calculated",
        data=ETAResponse(**eta_data)
    )
