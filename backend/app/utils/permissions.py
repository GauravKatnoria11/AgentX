import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA


def ensure_patient_ownership(current_user: Dict[str, Any], target_patient_id: str):
    """
    Enforces Patient Isolation Rule (Page 15/22):
    Patient A cannot access Patient B's records, appointments, or prescriptions.
    Admins and authorized medical staff can access.
    """
    role = current_user.get("role")
    user_id = str(current_user.get("id"))

    if role == "patient" and user_id != str(target_patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot view or modify another patient's records."
        )


def ensure_hospital_access(current_user: Dict[str, Any], hospital_id: str):
    """
    Enforces Hospital Isolation Rule (Page 21):
    Hospital A staff cannot modify Hospital B private resources.
    """
    role = current_user.get("role")
    if role == "admin":
        return

    user_hospital_id = (current_user.get("metadata") or {}).get("hospital_id")
    if role == "staff" and str(user_hospital_id) != str(hospital_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Staff can only access their assigned hospital resources."
        )


def log_audit_event(
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """
    Enforces Audit Logging Rule (Page 23):
    Audit sensitive operations without duplicating highly sensitive data.
    """
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "ip_address": ip_address,
        "details": details or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    MOCK_DATA["audit_logs"].append(entry)
