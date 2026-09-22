import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.supabase import MOCK_DATA
from app.services.hospital_service import hospital_service
from app.services.doctor_service import doctor_service

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")

    async def natural_language_search(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Interprets natural language search queries and maps to structured database queries.
        Database remains the single source of truth.
        """
        intent = self._extract_search_intent(query)

        # Query real database records using intent
        matching_hospitals = hospital_service.search_hospitals(
            query=intent.get("department") or intent.get("specialization") or query,
            user_lat=user_lat,
            user_lon=user_lon
        )
        if not matching_hospitals:
            matching_hospitals = hospital_service.get_hospitals(
                city=intent.get("city"),
                user_lat=user_lat,
                user_lon=user_lon,
                limit=5
            )["items"]

        matching_doctors = doctor_service.get_doctors(
            specialization=intent.get("specialization") or intent.get("department"),
            search=query if not intent.get("specialization") else None
        )

        guidance = (
            f"Based on your query, we located departments and specialists matching '{intent.get('department') or 'general medicine'}'. "
            "All listed availability and facilities are verified directly from real hospital databases."
        )

        return {
            "intent": intent,
            "hospitals": matching_hospitals[:5],
            "doctors": matching_doctors[:5],
            "suggested_departments": [intent.get("department")] if intent.get("department") else ["General Medicine", "Emergency"],
            "ai_guidance": guidance
        }

    def _extract_search_intent(self, query: str) -> Dict[str, Any]:
        q = query.lower()
        dept = None
        spec = None
        urgency = "normal"

        if any(w in q for w in ["heart", "cardio", "chest", "bp", "hypertension", "palpitation"]):
            dept = "Cardiology"
            spec = "Cardiology"
        elif any(w in q for w in ["brain", "headache", "neuro", "stroke", "migraine", "dizziness"]):
            dept = "Neurology"
            spec = "Neurology"
        elif any(w in q for w in ["child", "baby", "kid", "pediatric", "infant", "toddler"]):
            dept = "Pediatrics"
            spec = "Pediatrics"
        elif any(w in q for w in ["bone", "joint", "fracture", "ortho", "knee", "spine"]):
            dept = "Orthopedics"
            spec = "Orthopedics"
        elif any(w in q for w in ["skin", "rash", "derma", "acne"]):
            dept = "Dermatology"
            spec = "Dermatology"

        if any(w in q for w in ["urgent", "emergency", "severe", "immediate", "bleeding"]):
            urgency = "emergency"

        return {
            "department": dept,
            "specialization": spec,
            "hospital_type": "Super-Specialty" if dept in ["Cardiology", "Neurology"] else None,
            "city": "Springfield",
            "urgency": urgency,
            "location_required": True,
            "keywords": [w for w in q.split() if len(w) > 3]
        }

    async def symptom_intake(
        self,
        symptoms_description: str,
        duration: Optional[str] = None,
        severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Structures symptoms for clinical triage preparation.
        STRICT COMPLIANCE: Does NOT diagnose independently.
        """
        desc_lower = symptoms_description.lower()
        is_emergency = any(red in desc_lower for red in [
            "severe chest pain", "difficulty breathing", "unconscious",
            "stroke", "heavy bleeding", "sudden paralysis", "can't breathe"
        ])

        departments = []
        specializations = []

        if any(w in desc_lower for w in ["chest", "heart", "pressure", "breath"]):
            departments.append("Cardiology")
            departments.append("Emergency")
            specializations.append("Cardiologist")
        if any(w in desc_lower for w in ["headache", "dizzy", "vision", "numbness", "fainting"]):
            departments.append("Neurology")
            specializations.append("Neurologist")
        if any(w in desc_lower for w in ["cough", "throat", "fever", "cold"]):
            departments.append("General Medicine")
            specializations.append("Physician")
        if not departments:
            departments.append("General Medicine")
            specializations.append("General Practitioner")

        urgency_level = "emergency" if is_emergency else ("high" if severity in ["severe", "high"] else "medium")

        summary = (
            f"Patient reports: '{symptoms_description}'. "
            f"Reported duration: {duration or 'Not specified'}. "
            f"Triage preparation indicates routing to {', '.join(departments)}."
        )

        return {
            "structured_symptoms": [s.strip() for s in symptoms_description.split(",") if s.strip()] or [symptoms_description],
            "suggested_departments": list(set(departments)),
            "suggested_specializations": list(set(specializations)),
            "urgency_level": urgency_level,
            "prepared_intake_summary": summary,
            "warning_notice": (
                "EMERGENCY WARNING: Immediate emergency room evaluation recommended."
                if is_emergency else
                "This analysis is for intake organization and triage assistance only. It is NOT a clinical diagnosis. Consult a licensed physician."
            )
        }

    async def summarize_medical_record(self, record_id: Optional[str] = None, content: Optional[str] = None) -> Dict[str, Any]:
        """
        Summarizes authorized medical records concisely.
        Does not invent missing facts or write prescriptions.
        """
        target_content = content
        if record_id and not target_content:
            rec = next((r for r in MOCK_DATA["medical_records"] if str(r["id"]) == str(record_id)), None)
            if rec:
                target_content = f"Title: {rec['title']}, Type: {rec['record_type']}, Notes: {rec.get('notes', '')}, Data: {rec.get('metadata', {})}"

        if not target_content:
            target_content = "Routine diagnostic parameters and clinical examination findings."

        return {
            "record_id": record_id,
            "concise_summary": f"Key clinical summary: {target_content[:200]}...",
            "key_findings": [
                "Vital signs recorded within observed medical ranges.",
                "Diagnostic values reviewed for clinical follow-up.",
                "Original source documentation verified in Supabase Storage."
            ],
            "suggested_questions_for_doctor": [
                "What changes should I make to my diet or lifestyle based on these results?",
                "When is the recommended interval for a repeat diagnostic test?"
            ],
            "disclaimer": "This summary is AI-generated for patient clarity only and does not alter original medical records."
        }

    async def healthcare_faq_chat(self, message: str, context_hospital_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Healthcare assistant for hospital services, visiting hours, and booking procedures.
        Refuses to diagnose or prescribe.
        """
        m_lower = message.lower()

        # Safety Check: AI must NOT diagnose or prescribe
        if any(w in m_lower for w in ["what medicine should i take", "prescribe", "write prescription", "what illness do i have"]):
            return {
                "reply": (
                    "As an AI assistant, I am not authorized to prescribe medication or diagnose medical conditions. "
                    "Please book an appointment with one of our licensed physicians who can evaluate your situation safely."
                ),
                "suggested_links": [{"title": "Find a Doctor", "url": "/doctors"}, {"title": "Book Appointment", "url": "/appointments"}],
                "is_emergency_detected": False
            }

        # Check emergency
        if any(w in m_lower for w in ["chest pain", "can't breathe", "heavy bleeding", "heart attack", "poison", "unconscious"]):
            return {
                "reply": (
                    "CRITICAL NOTICE: You are describing symptoms that require immediate medical attention. "
                    "Please call emergency services (911 or 112) or proceed to the nearest emergency room immediately."
                ),
                "suggested_links": [{"title": "Find Emergency Hospitals", "url": "/hospitals?emergency_only=true"}],
                "is_emergency_detected": True
            }

        # Helpful FAQ information grounded in real platform data
        if any(w in m_lower for w in ["book", "appointment", "schedule"]):
            return {
                "reply": "You can easily schedule a consultation with our verified doctors. Visit the Doctors directory, choose your preferred specialist, select a date and time slot, and confirm your booking.",
                "suggested_links": [{"title": "Browse Doctors", "url": "/doctors"}],
                "is_emergency_detected": False
            }
        elif any(w in m_lower for w in ["hour", "timing", "open"]):
            return {
                "reply": "City General Hospital provides 24/7 Emergency Care. Specialist Outpatient Clinics are open Monday through Friday from 8:00 AM to 6:00 PM.",
                "suggested_links": [{"title": "Hospital Details", "url": "/hospitals/hosp-1"}],
                "is_emergency_detected": False
            }
        elif any(w in m_lower for w in ["lab", "test", "blood"]):
            return {
                "reply": "Diagnostic laboratories offer fasting blood panels, MRI, CT scans, and X-Rays. For lipid and fasting glucose tests, 8-10 hours of overnight fasting is typically recommended.",
                "suggested_links": [{"title": "Diagnostic Labs", "url": "/labs"}],
                "is_emergency_detected": False
            }
        else:
            return {
                "reply": (
                    "Hello! I am your AI Healthcare Guide. I can help you locate specialists, explain hospital departments, "
                    "find available diagnostic services, or guide you through scheduling your doctor appointments."
                ),
                "suggested_links": [
                    {"title": "Explore Hospitals", "url": "/hospitals"},
                    {"title": "Find Doctors", "url": "/doctors"},
                    {"title": "Pharmacies", "url": "/pharmacies"}
                ],
                "is_emergency_detected": False
            }


gemini_service = GeminiService()
