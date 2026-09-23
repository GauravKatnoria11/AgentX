import re
import httpx
from datetime import date, time
from typing import Optional
from fastapi import HTTPException, status
from app.config import settings


def validate_email(email: str) -> str:
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format."
        )
    return email.lower().strip()


def validate_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    cleaned = re.sub(r"[^\d+]", "", phone)
    if len(cleaned) < 7 or len(cleaned) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format."
        )
    return cleaned


def validate_appointment_slot(appointment_date: date, appointment_time: time):
    today = date.today()
    if appointment_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book an appointment in the past."
        )


async def verify_hcaptcha_token(token: Optional[str] = None) -> bool:
    """
    Deprecated: hCaptcha has been removed from authentication flows.
    Always returns True for backwards compatibility.
    """
    return True
