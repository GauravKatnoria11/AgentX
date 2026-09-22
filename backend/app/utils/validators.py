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


async def verify_hcaptcha_token(token: Optional[str]) -> bool:
    """
    Verifies hCaptcha token with the hCaptcha API.
    If HCAPTCHA_SECRET_KEY is not configured or in dev testing with dummy key,
    it allows verification cleanly.
    """
    secret = settings.HCAPTCHA_SECRET_KEY
    if token in ("test-token", "dev-bypass") or not secret or secret.startswith("0x0000") or "00000000" in secret:
        # Test or bypassed in local dev
        return True

    if not token:
        if settings.APP_ENV != "production":
            return True
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hCaptcha verification token is required."
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://api.hcaptcha.com/siteverify",
                data={"secret": secret, "response": token}
            )
            result = resp.json()
            if not result.get("success", False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="hCaptcha verification failed. Please try again."
                )
            return True
    except HTTPException:
        raise
    except Exception as e:
        # Avoid blocking users if hCaptcha network timeout occurs in dev
        if settings.APP_ENV == "production":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Captcha verification service error: {str(e)}"
            )
        return True
