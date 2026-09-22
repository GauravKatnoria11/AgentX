from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password at least 6 characters")
    full_name: str = Field(min_length=2, max_length=255)
    role: Literal["patient", "doctor", "staff", "admin"] = "patient"
    phone: Optional[str] = None
    captcha_token: Optional[str] = Field(default=None, description="hCaptcha client response token")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: Optional[str] = Field(default=None, description="hCaptcha client response token")


class OAuthCallbackRequest(BaseModel):
    provider: Literal["google", "facebook"]
    access_token: str = Field(description="OAuth / Supabase session access token")
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileSummary(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileSummary
