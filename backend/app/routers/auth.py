import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import SignUpRequest, LoginRequest, OAuthCallbackRequest, TokenResponse, UserProfileSummary
from app.schemas.common import ApiResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.validators import validate_email, validate_phone, verify_hcaptcha_token
from app.dependencies import get_current_user
from app.supabase import MOCK_DATA
from app.utils.permissions import log_audit_event

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
async def signup(req: SignUpRequest):
    # 1. Verify hCaptcha token
    await verify_hcaptcha_token(req.captcha_token)

    # 2. Validate email and phone
    clean_email = validate_email(req.email)
    clean_phone = validate_phone(req.phone)

    # 3. Check existing user
    existing = next((p for p in MOCK_DATA["profiles"] if p["email"].lower() == clean_email), None)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    # 4. Create user profile
    user_id = str(uuid.uuid4())
    profile = {
        "id": user_id,
        "role": req.role,
        "full_name": req.full_name,
        "email": clean_email,
        "phone": clean_phone,
        "password_hash": hash_password(req.password),
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    MOCK_DATA["profiles"].append(profile)

    # 5. Issue JWT
    token = create_access_token({"sub": user_id, "role": req.role, "email": clean_email, "full_name": req.full_name})

    log_audit_event(
        action="user_signup",
        resource_type="auth",
        resource_id=user_id,
        user_id=user_id,
        details={"role": req.role}
    )

    user_summary = UserProfileSummary(
        id=user_id,
        email=clean_email,
        full_name=req.full_name,
        role=req.role,
        phone=clean_phone
    )

    return ApiResponse(
        success=True,
        message="Account created successfully",
        data=TokenResponse(access_token=token, token_type="bearer", user=user_summary)
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(req: LoginRequest):
    # 1. Verify hCaptcha token
    await verify_hcaptcha_token(req.captcha_token)

    # 2. Check credentials
    clean_email = validate_email(req.email)
    user = next((p for p in MOCK_DATA["profiles"] if p["email"].lower() == clean_email), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Verify password if hashed password exists
    if "password_hash" in user:
        if not verify_password(req.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

    token = create_access_token({
        "sub": str(user["id"]),
        "role": user.get("role", "patient"),
        "email": user["email"],
        "full_name": user.get("full_name", "")
    })

    log_audit_event(
        action="user_login",
        resource_type="auth",
        resource_id=str(user["id"]),
        user_id=str(user["id"])
    )

    user_summary = UserProfileSummary(
        id=str(user["id"]),
        email=user["email"],
        full_name=user.get("full_name", "User"),
        role=user.get("role", "patient"),
        phone=user.get("phone")
    )

    return ApiResponse(
        success=True,
        message="Login successful",
        data=TokenResponse(access_token=token, token_type="bearer", user=user_summary)
    )


@router.post("/oauth-callback", response_model=ApiResponse[TokenResponse])
async def oauth_callback(req: OAuthCallbackRequest):
    """
    Handles Google and Facebook OAuth authenticated sessions originating from Supabase Auth.
    """
    email = req.email or f"{req.provider}_user@oauth.internal"
    user = next((p for p in MOCK_DATA["profiles"] if p["email"].lower() == email.lower()), None)

    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "role": "patient",
            "full_name": req.full_name or f"{req.provider.capitalize()} User",
            "email": email,
            "avatar_url": req.avatar_url,
            "metadata": {"provider": req.provider},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["profiles"].append(user)

    token = create_access_token({
        "sub": str(user["id"]),
        "role": user.get("role", "patient"),
        "email": user["email"],
        "full_name": user.get("full_name", "")
    })

    log_audit_event(
        action=f"oauth_login_{req.provider}",
        resource_type="auth",
        resource_id=str(user["id"]),
        user_id=str(user["id"])
    )

    user_summary = UserProfileSummary(
        id=str(user["id"]),
        email=user["email"],
        full_name=user.get("full_name", "User"),
        role=user.get("role", "patient"),
        avatar_url=user.get("avatar_url")
    )

    return ApiResponse(
        success=True,
        message=f"Authenticated successfully with {req.provider.capitalize()}",
        data=TokenResponse(access_token=token, token_type="bearer", user=user_summary)
    )


@router.get("/me", response_model=ApiResponse[UserProfileSummary])
async def get_me(current_user: dict = Depends(get_current_user)):
    user_summary = UserProfileSummary(
        id=str(current_user["id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name", "User"),
        role=current_user.get("role", "patient"),
        phone=current_user.get("phone"),
        avatar_url=current_user.get("avatar_url")
    )
    return ApiResponse(success=True, message="Profile fetched successfully", data=user_summary)
