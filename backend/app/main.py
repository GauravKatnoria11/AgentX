import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.routers import (
    auth,
    users,
    hospitals,
    departments,
    doctors,
    appointments,
    labs,
    pharmacies,
    medicines,
    prescriptions,
    medical_records,
    followups,
    maps,
    ai,
    admin,
    emergency,
    hospital_portal
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("healthcare-api")

app = FastAPI(
    title="AI Healthcare & Hospital Management Platform API",
    description=(
        "Modular FastAPI Monolith connecting the full patient care continuum "
        "with hospital administration, powered by Supabase, Google Maps, and Gemini AI."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. CORS Configuration (Section 34)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Standardized Global Error Handlers (Section 32)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    error_code_mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "RESOURCE_NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR"
    }
    code = error_code_mapping.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "error_code": code
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Invalid request parameters")
    loc = " -> ".join([str(l) for l in first_error.get("loc", [])])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": f"{msg} at ({loc})",
            "error_code": "VALIDATION_ERROR"
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error occurred: {exc}", exc_info=True)
    # Never expose stack traces or internal secrets (Section 25/33)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )


# 3. Health Check (Section 35)
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "AI Healthcare Platform API is running",
        "documentation": "/docs",
        "version": "1.0.0"
    }


# 4. Mount Modular Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hospitals.router)
app.include_router(departments.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(labs.router)
app.include_router(pharmacies.router)
app.include_router(medicines.router)
app.include_router(prescriptions.router)
app.include_router(medical_records.router)
app.include_router(followups.router)
app.include_router(maps.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(emergency.router)
app.include_router(hospital_portal.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)