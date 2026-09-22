from fastapi import APIRouter, Depends
from app.schemas.ai import (
    AISearchRequest, AISearchResponse,
    SymptomIntakeRequest, SymptomIntakeResponse,
    MedicalRecordSummaryRequest, MedicalRecordSummaryResponse,
    HealthcareChatRequest, HealthcareChatResponse
)
from app.schemas.common import ApiResponse
from app.services.gemini_service import gemini_service
from app.dependencies import get_optional_user

router = APIRouter(prefix="/api/v1/ai", tags=["AI & Gemini Services"])


@router.post("/search", response_model=ApiResponse[AISearchResponse])
async def ai_natural_language_search(req: AISearchRequest):
    """
    AI Feature 1: Natural Language Search
    Maps patient description into structured search intent without inventing hospital data.
    """
    result = await gemini_service.natural_language_search(
        query=req.query,
        user_lat=req.user_latitude,
        user_lon=req.user_longitude
    )
    return ApiResponse(
        success=True,
        message="Natural language search completed successfully",
        data=AISearchResponse(**result)
    )


@router.post("/symptoms", response_model=ApiResponse[SymptomIntakeResponse])
async def ai_symptom_intake(req: SymptomIntakeRequest):
    """
    AI Feature 2: Symptom Intake
    Converts unstructured symptom narratives into structured clinical intake.
    Strictly prohibits independent diagnosis.
    """
    intake = await gemini_service.symptom_intake(
        symptoms_description=req.symptoms_description,
        duration=req.duration,
        severity=req.severity
    )
    return ApiResponse(
        success=True,
        message="Symptom intake profile organized successfully",
        data=SymptomIntakeResponse(**intake)
    )


@router.post("/summarize", response_model=ApiResponse[MedicalRecordSummaryResponse])
async def ai_summarize_medical_record(
    req: MedicalRecordSummaryRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    AI Feature 3: Medical Record Summary
    Summarizes patient record concisely without altering the source or prescribing.
    """
    summary = await gemini_service.summarize_medical_record(
        record_id=req.record_id,
        content=req.content
    )
    return ApiResponse(
        success=True,
        message="Medical record summarized safely",
        data=MedicalRecordSummaryResponse(**summary)
    )


@router.post("/chat", response_model=ApiResponse[HealthcareChatResponse])
async def ai_healthcare_chat(req: HealthcareChatRequest):
    """
    AI Feature 4: Healthcare & Platform FAQ Assistant
    Assists patient with hospital schedules, booking, and lab preparations.
    """
    chat_reply = await gemini_service.healthcare_faq_chat(
        message=req.message,
        context_hospital_id=req.context_hospital_id
    )
    return ApiResponse(
        success=True,
        message="Assistant response generated",
        data=HealthcareChatResponse(**chat_reply)
    )
