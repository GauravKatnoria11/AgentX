from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


class RouteStep(BaseModel):
    instruction: str
    distance_text: str
    duration_text: str


class RouteResponse(BaseModel):
    origin: str
    destination: str
    mode: str
    distance_km: float
    distance_text: str
    duration_minutes: int
    duration_text: str
    steps: List[RouteStep] = []
    polyline: Optional[str] = None


class DistanceMatrixResponse(BaseModel):
    origin: str
    destination: str
    distance_km: float
    distance_text: str
    duration_minutes: int
    duration_text: str


class ETAResponse(BaseModel):
    origin: str
    destination: str
    travel_mode: str
    current_time: str
    duration_minutes: int
    eta_timestamp: str
    suggested_departure_time: str
    traffic_condition: str


class LocationSearchResult(BaseModel):
    name: str
    formatted_address: str
    latitude: float
    longitude: float
    locality: Optional[str] = None

