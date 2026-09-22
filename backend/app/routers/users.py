from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import ProfileResponse, ProfileUpdateRequest
from app.schemas.common import ApiResponse
from app.dependencies import get_current_user
from app.services.notification_service import notification_service
from app.supabase import MOCK_DATA

router = APIRouter(prefix="/api/v1/users", tags=["Users & Profiles"])


@router.get("/me", response_model=ApiResponse[ProfileResponse])
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return ApiResponse(
        success=True,
        message="User profile retrieved successfully",
        data=ProfileResponse(**current_user)
    )


@router.patch("/me", response_model=ApiResponse[ProfileResponse])
async def update_my_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    profile = next((p for p in MOCK_DATA["profiles"] if str(p["id"]) == user_id), None)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    update_dict = req.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        profile[k] = v
    profile["updated_at"] = datetime.now(timezone.utc).isoformat()

    return ApiResponse(
        success=True,
        message="Profile updated successfully",
        data=ProfileResponse(**profile)
    )


@router.get("/notifications", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifs = notification_service.get_user_notifications(str(current_user["id"]))
    return ApiResponse(
        success=True,
        message="Notifications retrieved successfully",
        data=notifs
    )


@router.patch("/notifications/{notif_id}/read", response_model=ApiResponse[bool])
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    success = notification_service.mark_as_read(notif_id, str(current_user["id"]))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return ApiResponse(
        success=True,
        message="Notification marked as read",
        data=True
    )
