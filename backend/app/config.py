from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Supabase Credentials
    SUPABASE_URL: str = Field(default="", description="Supabase Project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase Anon/Public Key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase Service Role Key")

    # Authentication & Captcha
    HCAPTCHA_SECRET_KEY: str = Field(default="", description="hCaptcha secret verification key")
    HCAPTCHA_SITE_KEY: str = Field(default="", description="hCaptcha public site key")

    # External APIs
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GOOGLE_MAPS_API_KEY: str = Field(default="", description="Google Maps API Key")
    GOOGLE_MAP_API_KEY: str = Field(default="", description="Alternative alias for Google Maps API Key")

    # App Settings
    APP_ENV: str = Field(default="development", description="Application Environment (development, staging, production)")
    FRONTEND_URL: str = Field(default="http://localhost:5173", description="Frontend Origin for CORS")
    PORT: int = Field(default=8000, description="Server Port")
    JWT_SECRET: str = Field(default="dev-secret-key-tnhackathon-healthcare-321", description="JWT secret signing key")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 7, description="Access token expiration in minutes")

    @property
    def maps_api_key(self) -> str:
        return self.GOOGLE_MAPS_API_KEY or self.GOOGLE_MAP_API_KEY or ""

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:3000"]
        if self.APP_ENV != "production":
            origins.append("*")
        return list(set([o.rstrip("/") for o in origins if o]))


settings = Settings()
