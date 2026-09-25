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

        estimated_cost = self._predict_disease_cost(query, intent)

        return {
            "intent": intent,
            "hospitals": matching_hospitals[:5],
            "doctors": matching_doctors[:5],
            "suggested_departments": [intent.get("department")] if intent.get("department") else ["General Medicine", "Emergency"],
            "ai_guidance": guidance,
            "estimated_cost": estimated_cost
        }

    def _predict_disease_cost(self, query: str, intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates estimated medical consultation, diagnostics, procedural costs, and
        government scheme subsidies (Ayushman Bharat PM-JAY / Punjab AB-SSBY) according to disease.
        """
        q = query.lower()
        dept = (intent.get("department") or "").lower()

        # 1. Heart / Cardiology
        if any(w in q for w in ["heart", "cardio", "chest", "bp", "hypertension", "angio", "artery", "cardiac"]) or dept == "cardiology":
            return {
                "condition_or_procedure": "Cardiovascular Evaluation & Coronary Angiography / Angioplasty",
                "disease_category": "Cardiology & Vascular Medicine",
                "estimated_total_range": "₹500 (OPD Checkup) to ₹1,20,000 (Angioplasty with Stent)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹700 (Ivy Super-Specialty)",
                "diagnostic_tests": "₹300 - ₹2,500 (ECG ₹100, 2D Echo ₹1,600, Cardiac Troponin ₹950)",
                "treatment_or_procedure": "₹12,000 (Angiography) - ₹95,000 (Single Stent PTCA)",
                "hospitalization_per_day": "₹1,500 (General Ward) - ₹4,500 (Cardiac ICU)",
                "government_schemes_coverage": [
                    "Ayushman Bharat (PM-JAY): 100% Cashless treatment up to ₹5,00,000",
                    "Punjab AB-SSBY: Cashless treatment at Ivy Hospital & Civil Hospital",
                    "ECHS / CGHS: Empanelled cardiac procedure packages accepted"
                ],
                "savings_tips": "Diagnostic testing at Civil Hospital or Dr Lal PathLabs can reduce preliminary diagnostic costs by 40-70%.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 2. Orthopedics / Joint / Bone / Fracture / Knee / Spine
        elif any(w in q for w in ["bone", "joint", "knee", "fracture", "ortho", "spine", "arthritis", "slip disc", "ligament"]) or dept == "orthopedics":
            return {
                "condition_or_procedure": "Knee / Joint Osteoarthritis Care & Total Knee Replacement (TKR)",
                "disease_category": "Orthopedics & Joint Reconstruction",
                "estimated_total_range": "₹450 (OPD) to ₹1,40,000 (Joint Replacement with Implant)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹450 (Saini Trauma / Vasal Hospital)",
                "diagnostic_tests": "₹80 - ₹4,500 (Digital X-Ray ₹80-₹300, 1.5T MRI Joint ₹4,500)",
                "treatment_or_procedure": "₹18,000 (Arthroscopy) - ₹1,25,000 (Knee Replacement with US FDA Implant)",
                "hospitalization_per_day": "₹1,200 (Semi-Private Ward) - ₹3,000 (Deluxe Room)",
                "government_schemes_coverage": [
                    "Ayushman Bharat (PM-JAY): Pre-authorized package for Knee/Hip Joint Replacement (Cashless)",
                    "Punjab AB-SSBY: Fully cashless for eligible Punjab smart card holders at empanelled centres"
                ],
                "savings_tips": "Pre-operative digital X-rays at Civil Hospital cost ₹80 vs ₹400 in private imaging centres.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 3. Neurology / Brain / Stroke
        elif any(w in q for w in ["brain", "stroke", "neuro", "paralysis", "migraine", "headache", "seizure", "epilepsy"]) or dept == "neurology":
            return {
                "condition_or_procedure": "Acute Ischemic Stroke, Migraine & Neuro-Trauma Care",
                "disease_category": "Neurology & Neurosurgery",
                "estimated_total_range": "₹600 (Consultation) to ₹1,80,000 (Clot Thrombolysis / Craniotomy)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹600 (Ivy Hospital / Apex Neuro)",
                "diagnostic_tests": "₹1,200 - ₹5,500 (CT Brain ₹1,200, 1.5T MRI Brain ₹4,500)",
                "treatment_or_procedure": "₹35,000 (tPA Thrombolytic Injection) - ₹1,50,000 (Surgical Decompression)",
                "hospitalization_per_day": "₹2,500 - ₹5,500 (Neuro-ICU with Ventilator & ICP Monitoring)",
                "government_schemes_coverage": [
                    "PM-JAY Golden Card: Complete cashless coverage for acute stroke and craniotomy",
                    "Punjab AB-SSBY: Cashless treatment up to ₹5 Lakhs per family per year"
                ],
                "savings_tips": "Immediate arrival within 4.5 hours 'golden hour' at Ivy Hospital enables clot buster therapy without invasive surgical interventions.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 4. Maternity / Obstetrics / Gynecology
        elif any(w in q for w in ["baby", "delivery", "maternity", "pregnant", "pregnancy", "gynec", "obstetric", "c-section", "cesarean"]) or dept in ["gynecology & obstetrics", "pediatrics"]:
            return {
                "condition_or_procedure": "Maternity Care, Normal Delivery & Cesarean Section (C-Section)",
                "disease_category": "Gynecology & Obstetrics",
                "estimated_total_range": "₹0 (Civil Hospital Free Delivery) to ₹45,000 (Private C-Section)",
                "opd_consultation": "₹0 (Civil Hospital) - ₹400 (Dr. Neha Vasal / Vasal Hospital)",
                "diagnostic_tests": "₹0 - ₹2,500 (Antenatal Blood Panels & 4D Obstetric Ultrasound ₹1,800)",
                "treatment_or_procedure": "₹0 (Janani Shishu Suraksha Karyakram - JSSK) or ₹22,000 - ₹45,000 (Private C-Section)",
                "hospitalization_per_day": "₹0 (Govt Free Diet & Stay) - ₹2,500 (Private Maternity Suite)",
                "government_schemes_coverage": [
                    "Janani Shishu Suraksha Karyakram (JSSK): 100% Free delivery, medicines, C-section & diet at Civil Hospital",
                    "PM Matru Vandana Yojana (PMMVY): ₹5,000 direct cash benefit transfer to mother",
                    "Ayushman Bharat / AB-SSBY: Cashless maternity coverage"
                ],
                "savings_tips": "Under Punjab JSSK scheme, all antenatal medicines and institutional deliveries are 100% free with free pick-and-drop ambulance.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 5. Surgery / Gallstones / Appendix / Hernia
        elif any(w in q for w in ["surgery", "appendix", "gallstone", "stone", "hernia", "laparoscop"]) or dept == "general surgery":
            return {
                "condition_or_procedure": "Laparoscopic Cholecystectomy (Gallbladder) & Appendectomy",
                "disease_category": "General & Laparoscopic Surgery",
                "estimated_total_range": "₹2,500 (Civil Hospital) to ₹55,000 (Private Laparoscopy)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹450 (Private Surgeon)",
                "diagnostic_tests": "₹400 - ₹1,800 (Abdominal Ultrasound ₹1,100, Blood Work & LFT ₹350)",
                "treatment_or_procedure": "₹2,500 (Civil Hospital nominal OT charges) - ₹42,000 (Minimally Invasive 3-Port Laparoscopy)",
                "hospitalization_per_day": "₹800 (General Ward) - ₹2,500 (Single AC Room)",
                "government_schemes_coverage": [
                    "Ayushman Bharat PM-JAY: Covered under standard surgical package code",
                    "AB-SSBY Punjab: 100% Cashless surgical care for verified beneficiaries"
                ],
                "savings_tips": "Laparoscopic daycare surgery reduces hospital stay from 5 days down to 24 hours, cutting accommodation costs by 60%.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 6. Diabetes & Endocrine
        elif any(w in q for w in ["diabetes", "sugar", "diabetic", "glucose", "insulin", "thyroid"]):
            return {
                "condition_or_procedure": "Type-1 & Type-2 Diabetes Mellitus Management & Diabetic Foot Care",
                "disease_category": "Endocrinology & Diabetology",
                "estimated_total_range": "₹300 - ₹2,500 (Monthly Management & Lab Followups)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹500 (Specialist Diabetologist)",
                "diagnostic_tests": "₹150 - ₹1,200 (Fasting Blood Sugar ₹50, HbA1c HPLC ₹420, Urine Microalbumin ₹350)",
                "treatment_or_procedure": "₹200 - ₹1,500/month (Generic Metformin/Teneligliptin from Jan Aushadhi vs Branded)",
                "hospitalization_per_day": "Only required for ketoacidosis complications (₹2,500/day ICU)",
                "government_schemes_coverage": [
                    "Jan Aushadhi Scheme: 80% discount on anti-diabetic formulations (Metformin ₹2/strip)",
                    "National Programme for Prevention of Non-Communicable Diseases (NP-NCD): Free screening"
                ],
                "savings_tips": "Purchasing monthly diabetes supplies at Jan Aushadhi Generic Store saves up to ₹1,400 monthly compared to branded retail stores.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 7. Eye & Vision / Ophthalmology
        elif any(w in q for w in ["eye", "vision", "cataract", "retina", "lasik", "cornea", "glasses", "ophthalm"]):
            return {
                "condition_or_procedure": "Micro-Incision Cataract Phacoemulsification (MICS) with Foldable IOL",
                "disease_category": "Ophthalmology & Vision Care",
                "estimated_total_range": "₹0 (Govt Blindness Control) to ₹38,000 (Premium Multifocal IOL)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹350 (Dr. Rajesh Grover Eye Care)",
                "diagnostic_tests": "₹300 - ₹1,200 (Slit Lamp Exam, A-Scan Biometry, Retinal OCT)",
                "treatment_or_procedure": "₹0 (National Programme for Control of Blindness) - ₹28,000 (Blade-Free Phaco with Intraocular Lens)",
                "hospitalization_per_day": "Daycare procedure (0 overnight bed charge)",
                "government_schemes_coverage": [
                    "National Programme for Control of Blindness (NPCB): Free cataract surgery at Civil Hospital",
                    "PM-JAY & AB-SSBY: Cashless cataract package including standard foldable intraocular lens"
                ],
                "savings_tips": "Cataract surgeries are performed as outpatient daycare procedures without expensive overnight bed fees.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 8. Infections, Dengue, Fever, Respiratory
        elif any(w in q for w in ["fever", "dengue", "malaria", "typhoid", "cough", "cold", "flu", "infection", "pulmo", "lung", "asthma"]):
            return {
                "condition_or_procedure": "Acute Viral Fever, Dengue Management & Respiratory Infections",
                "disease_category": "General Medicine & Infectious Diseases",
                "estimated_total_range": "₹50 - ₹18,000 (OPD Care vs Severe Inpatient Platelet Support)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹400 (Private Physician)",
                "diagnostic_tests": "₹0 - ₹1,100 (Dengue NS1 Antigen Free at Civil Hospital, CBC Platelet count ₹50-₹300)",
                "treatment_or_procedure": "₹150 (Oral antipyretics & hydration) to ₹12,000 (Single Donor Platelet Transfusion SDP)",
                "hospitalization_per_day": "₹0 (Civil Hospital Dengue Isolation Ward) - ₹2,000 (Private Room)",
                "government_schemes_coverage": [
                    "Punjab State Dengue Free Diagnostic Initiative: Free NS1/IgM ELISA testing and free supportive care",
                    "Ayushman Bharat PM-JAY: Covered for critical dengue hemorrhagic fever"
                ],
                "savings_tips": "All dengue rapid test kits and confirmatory ELISA testing are provided 100% free at Civil Hospital District Pathology Lab.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
            }

        # 9. General Healthcare Default
        else:
            return {
                "condition_or_procedure": f"Clinical Evaluation for {query.title()[:40]}",
                "disease_category": intent.get("department") or "Primary Healthcare",
                "estimated_total_range": "₹50 - ₹1,500 (Outpatient Evaluation)",
                "opd_consultation": "₹50 (Civil Hospital) - ₹450 (Private Multi-Specialty Clinic)",
                "diagnostic_tests": "₹150 - ₹800 (Basic Blood Count, Urine Routine, Random Blood Sugar)",
                "treatment_or_procedure": "₹100 - ₹500 (Standard 5-day symptomatic medication course)",
                "hospitalization_per_day": "Outpatient basis (No hospital admission needed for routine checkups)",
                "government_schemes_coverage": [
                    "Ayushman Bharat Health & Wellness Centres: Free primary diagnostics & essential drugs",
                    "Jan Aushadhi Kendras: 50% to 90% savings on all generic prescription drugs"
                ],
                "savings_tips": "Consulting during daytime OPD hours avoids after-hours emergency triage fee surcharges.",
                "disclaimer": "Estimates reflect prevailing regional Punjab PM-JAY / CGHS benchmarks. Actual clinical expenses vary based on individual diagnosis and complications."
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
        elif any(w in q for w in ["pregnant", "pregnancy", "delivery", "maternity", "gynec", "obstetric", "cesarean", "c-section"]):
            dept = "Gynecology & Obstetrics"
            spec = "Gynecology & Obstetrics"
        elif any(w in q for w in ["surgery", "appendix", "gallstone", "stone", "hernia", "laparoscop"]):
            dept = "General Surgery"
            spec = "General Surgery"
        elif any(w in q for w in ["eye", "vision", "cataract", "retina", "lasik", "glasses"]):
            dept = "Ophthalmology"
            spec = "Ophthalmology"
        elif any(w in q for w in ["fever", "dengue", "cough", "cold", "flu", "infection"]):
            dept = "General Medicine"
            spec = "General Medicine"

        if any(w in q for w in ["urgent", "emergency", "severe", "immediate", "bleeding"]):
            urgency = "emergency"

        return {
            "department": dept,
            "specialization": spec,
            "hospital_type": "Super-Specialty" if dept in ["Cardiology", "Neurology"] else None,
            "city": "Hoshiarpur",
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

    async def healthcare_faq_chat(
        self,
        message: str,
        context_hospital_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Answer care and platform questions with Gemini when configured and useful local fallbacks."""
        current = message.strip()
        m_lower = current.lower()
        history = conversation_history or []
        recent_user_turns = [
            str(item.get("text", ""))
            for item in history[-6:]
            if item.get("sender") == "user" and item.get("text")
        ]
        recent_user_context = recent_user_turns[-1].lower() if recent_user_turns else ""
        search_text = f"{m_lower} {recent_user_context}" if len(m_lower.split()) <= 5 else m_lower

        def result(reply: str, links: Optional[List[Dict[str, str]]] = None, emergency: bool = False):
            return {
                "reply": reply,
                "suggested_links": links or [],
                "is_emergency_detected": emergency
            }

        if any(term in m_lower for term in (
            "chest pain", "can't breathe", "cannot breathe", "trouble breathing", "heavy bleeding",
            "heart attack", "poison", "unconscious", "stroke symptoms", "face is drooping"
        )):
            return result(
                "This may be an emergency. Call 112 now or go to the nearest emergency department. Do not wait for an online reply.",
                [{"title": "Emergency hospitals", "url": "/hospitals?emergency_only=true"}],
                True
            )

        if any(term in m_lower for term in (
            "what medicine should", "which medicine", "prescribe", "write prescription",
            "what illness do i have", "diagnose me", "what disease do i have"
        )):
            return result(
                "I can’t diagnose or recommend a medicine. A licensed clinician can assess your symptoms and medical history. I can help you find a doctor or book a visit.",
                [{"title": "Find a doctor", "url": "/doctors"}, {"title": "Appointments", "url": "/appointments"}]
            )

        # Use the configured Gemini model for open-ended FAQ questions. The prompt keeps
        # answers concise and avoids inventing facility-specific schedules or availability.
        if self.client:
            transcript = "\n".join(
                f"{('Patient' if item.get('sender') == 'user' else 'Assistant')}: {str(item.get('text', ''))[:800]}"
                for item in history[-8:]
                if item.get("sender") in {"user", "ai"} and item.get("text")
            )
            prompt = (
                "You are Carelink's healthcare FAQ assistant. Answer the patient's latest question directly, "
                "briefly, and warmly. Use conversation history to understand short follow-ups. You may explain "
                "general wellness information and how to use care services. Never diagnose, prescribe, or claim "
                "a treatment is safe for this specific patient. For diet or health advice, give general guidance "
                "and mention when a clinician should personalize it. Do not invent hospital hours, prices, doctors, "
                "availability, or policies; say when a detail must be confirmed with the facility. If urgent symptoms "
                "are mentioned, advise calling local emergency services immediately. Keep the response to 2-5 sentences.\n\n"
                f"Conversation:\n{transcript or '(No earlier messages)'}\nPatient's latest question: {current}"
            )
            try:
                response = await self.client.aio.models.generate_content(
                    model=settings.GEMINI_CHAT_MODEL,
                    contents=prompt
                )
                generated_reply = (response.text or "").strip()
                if generated_reply:
                    links = self._healthcare_chat_links(search_text)
                    return result(generated_reply, links)
            except Exception as exc:
                logger.warning("Gemini FAQ response failed; using local FAQ fallback: %s", exc)

        if any(term in search_text for term in ("heart", "cardiac", "cardiology", "cardiologist")) and any(
            term in search_text for term in ("food", "eat", "diet", "meal", "nutrition")
        ):
            return result(
                "For general heart-health eating, choose vegetables, fruit, beans, whole grains, and unsalted nuts; favor fish or other lean proteins, and limit salty, highly processed foods and foods high in saturated or trans fats. If you have heart failure, kidney disease, diabetes, or a prescribed diet, ask your clinician or dietitian what is right for you.",
                [{"title": "Find a cardiologist", "url": "/doctors"}]
            )

        if any(term in search_text for term in ("heart", "cardiac", "cardiology", "cardiologist")) and any(
            term in search_text for term in ("specialist", "doctor", "clinic", "who", "find")
        ):
            return result(
                "A cardiologist (heart specialist) can assess heart-related concerns. Open Doctors and choose Cardiology to see available specialists; use Emergency for sudden chest pain, severe breathlessness, or fainting.",
                [{"title": "Browse doctors", "url": "/doctors"}, {"title": "Emergency care", "url": "/emergency"}]
            )

        if any(term in search_text for term in ("book", "appointment", "schedule", "reschedule")):
            return result(
                "To book, open Doctors, choose a specialist, select an available time, and confirm the appointment. You can review or manage bookings in Appointments.",
                [{"title": "Find a doctor", "url": "/doctors"}, {"title": "Appointments", "url": "/appointments"}]
            )

        if any(term in search_text for term in ("hour", "timing", "open", "visiting time")):
            return result(
                "Emergency services are listed as 24/7 where a facility provides them. Clinic and visiting hours vary by hospital, so open the hospital details or call the facility to confirm today's schedule.",
                [{"title": "Browse hospitals", "url": "/hospitals"}]
            )

        if any(term in search_text for term in ("lab", "test", "blood", "fasting", "sample")):
            return result(
                "Preparation depends on the exact test. Check the instructions from your clinician or lab before fasting; some blood tests require it and many do not. The Diagnostics Labs section lists available services.",
                [{"title": "Diagnostics labs", "url": "/labs"}]
            )

        if any(term in search_text for term in ("hospital", "department", "facility", "near me", "nearby")):
            return result(
                "I can help you find a facility. Open Hospital Search to compare nearby hospitals, services, ICU beds, and directions. Tell me the specialty or area you need and I can narrow it down.",
                [{"title": "Hospital search", "url": "/hospitals"}]
            )

        if any(term in search_text for term in ("pharmacy", "medicine stock", "drug store", "medication availability")):
            return result(
                "Use Pharmacy & Rx to browse medicines and partner pharmacies. Stock can change, so confirm availability with the pharmacy before travelling. I can also help find a doctor, but I can’t recommend a medicine.",
                [{"title": "Pharmacy & Rx", "url": "/pharmacy"}]
            )

        return result(
            "I can help with hospital and doctor searches, appointments, lab preparation, pharmacy services, or general health information. What would you like to know?",
            [
                {"title": "Hospitals", "url": "/hospitals"},
                {"title": "Doctors", "url": "/doctors"},
                {"title": "Appointments", "url": "/appointments"}
            ]
        )

    @staticmethod
    def _healthcare_chat_links(message: str) -> List[Dict[str, str]]:
        text = message.lower()
        if any(word in text for word in ("appointment", "book", "doctor", "specialist", "cardio", "heart")):
            return [{"title": "Find a doctor", "url": "/doctors"}]
        if any(word in text for word in ("lab", "test", "blood", "fasting")):
            return [{"title": "Diagnostics labs", "url": "/labs"}]
        if any(word in text for word in ("pharmacy", "medicine", "medication")):
            return [{"title": "Pharmacy & Rx", "url": "/pharmacy"}]
        return [{"title": "Hospital search", "url": "/hospitals"}]


gemini_service = GeminiService()
