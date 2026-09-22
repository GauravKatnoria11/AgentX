from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.lab import LabResponse, LabTestBookingRequest, LabTestBookingResponse
from app.schemas.common import ApiResponse
from app.services.lab_service import lab_service
from app.supabase import MOCK_DATA
import uuid
from datetime import datetime, timezone

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


@router.get("/tests", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_lab_tests(
    category: Optional[str] = Query(None, description="Filter by test category (Hematology, Radiology, Ultrasound, etc.)"),
    q: Optional[str] = Query(None, description="Search term for test name or description")
):
    """
    Returns individual diagnostic tests across all Hoshiarpur laboratories with pricing and preparation info.
    """
    all_tests = []
    for lab in MOCK_DATA.get("labs", []):
        for t in lab.get("tests", []):
            item = dict(t)
            item["lab_id"] = lab["id"]
            item["lab_name"] = lab["name"]
            item["lab_address"] = lab["address"]
            item["home_collection"] = lab.get("home_collection", False)
            item["contact_phone"] = lab.get("contact_phone")

            if category and category.lower() not in item.get("category", "").lower():
                continue
            if q:
                q_lower = q.lower()
                if (q_lower not in item.get("name", "").lower() and 
                    q_lower not in item.get("category", "").lower() and 
                    q_lower not in item.get("description", "").lower()):
                    continue

            all_tests.append(item)

    return ApiResponse(
        success=True,
        message="Diagnostic tests retrieved successfully",
        data=all_tests
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


@router.post("/book", response_model=ApiResponse[LabTestBookingResponse], status_code=status.HTTP_201_CREATED)
async def book_lab_test(req: LabTestBookingRequest):
    """
    Book a diagnostic test with Home Sample Collection or Lab Visit.
    """
    lab = next((l for l in MOCK_DATA.get("labs", []) if str(l["id"]) == str(req.lab_id)), None)
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diagnostic laboratory not found.")

    matched_test = next((t for t in lab.get("tests", []) if t["name"].lower() == req.test_name.lower()), None)
    test_price = matched_test["price"] if matched_test else 450.0

    booking_id = "LAB-" + str(uuid.uuid4())[:8].upper()
    token_num = f"TK-{len(MOCK_DATA.get('lab_bookings', [])) + 101}"

    instructions = [
        f"Sample scheduled for {req.preferred_date} at {req.preferred_time} via {req.collection_type.replace('_', ' ').title()}.",
        "Carry valid government photo ID and doctor prescription if applicable."
    ]
    if matched_test and matched_test.get("fasting_required"):
        instructions.insert(0, "⚠️ 10-12 hours overnight fasting is strictly mandatory. Plain water is permitted.")

    booking_record = {
        "id": booking_id,
        "token_number": token_num,
        "lab_id": req.lab_id,
        "lab_name": lab["name"],
        "test_name": req.test_name,
        "patient_name": req.patient_name,
        "phone": req.phone,
        "collection_type": req.collection_type,
        "scheduled_date": req.preferred_date,
        "scheduled_time": req.preferred_time,
        "address": req.address,
        "total_price": test_price,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if "lab_bookings" not in MOCK_DATA:
        MOCK_DATA["lab_bookings"] = []
    MOCK_DATA["lab_bookings"].append(booking_record)

    return ApiResponse(
        success=True,
        message=f"Lab test booking confirmed! Token #{token_num}",
        data=LabTestBookingResponse(
            booking_id=booking_id,
            status="Confirmed & Scheduled",
            token_number=token_num,
            lab_name=lab["name"],
            test_name=req.test_name,
            scheduled_at=f"{req.preferred_date} at {req.preferred_time}",
            total_price=test_price,
            collection_type=req.collection_type,
            instructions=instructions
        )
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

