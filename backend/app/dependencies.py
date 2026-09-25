from typing import List, Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.security import decode_access_token
from app.supabase import MOCK_DATA

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject the publicly exposed legacy demo patient token even if it was issued earlier.
    if str(payload.get("email", "")).lower() == "patient@example.com":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This demo account is no longer available. Please sign in with your account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Look up in profiles
    user = next((p for p in MOCK_DATA["profiles"] if str(p["id"]) == str(user_id)), None)
    if not user:
        # Create lightweight profile entry if verified from token
        user = {
            "id": str(user_id),
            "role": payload.get("role", "patient"),
            "full_name": payload.get("full_name", "Authenticated User"),
            "email": payload.get("email", f"{user_id}@platform.internal"),
            "phone": payload.get("phone", ""),
            "created_at": payload.get("created_at")
        }
        MOCK_DATA["profiles"].append(user)

    if user and user.get("email"):
        MOCK_DATA["last_active_user_email"] = user["email"]

    return user


async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_role(allowed_roles: List[str]):
    """
    Role verification dependency (Page 9/21/28):
    Verifies user has one of the allowed roles.
    Rejects unauthorized access with 403 Forbidden.
    """
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "patient")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of following roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
