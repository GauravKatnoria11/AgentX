import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import ensure_patient_ownership


class FollowupService:
    def create_followup_plan(
        self,
        patient_id: str,
        appointment_id: str,
        interval_type: str,
        scheduled_at: str,
        questions: List[Dict[str, Any]],
        doctor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        followup_id = str(uuid.uuid4())
        plan = {
            "id": followup_id,
            "patient_id": str(patient_id),
            "doctor_id": str(doctor_id) if doctor_id else None,
            "appointment_id": str(appointment_id),
            "interval_type": interval_type,
            "scheduled_at": scheduled_at,
            "questions": questions,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["followups"].append(plan)

        # Notify patient of follow-up plan
        MOCK_DATA["notifications"].append({
            "id": str(uuid.uuid4()),
            "user_id": str(patient_id),
            "title": "Follow-Up Care Plan Scheduled",
            "message": f"A {interval_type} post-consultation health check-in has been scheduled for your recovery.",
            "type": "followup",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return plan

    def get_patient_followups(self, patient_id: str) -> List[Dict[str, Any]]:
        plans = [f for f in MOCK_DATA["followups"] if str(f["patient_id"]) == str(patient_id)]
        results = []
        for p in plans:
            p_dict = dict(p)
            responses = [r for r in MOCK_DATA["followup_responses"] if str(r["followup_id"]) == str(p["id"])]
            p_dict["responses"] = responses
            p_dict["flagged_for_review"] = any(r.get("flagged_for_review", False) for r in responses)
            results.append(p_dict)
        return results

    def submit_followup_response(
        self,
        followup_id: str,
        patient_id: str,
        responses: Dict[str, Any],
        severity_score: Optional[int] = None
    ) -> Dict[str, Any]:
        plan = next((f for f in MOCK_DATA["followups"] if str(f["id"]) == str(followup_id)), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Follow-up plan not found."
            )

        if str(plan["patient_id"]) != str(patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot submit response for another patient."
            )

        # Flagging threshold rule (Page 16):
        # "If configured responses cross a threshold, flag them for human review. Do NOT automatically diagnose."
        flagged = False
        review_reason = None

        if severity_score and severity_score >= 7:
            flagged = True
            review_reason = f"Patient self-reported high symptom severity score ({severity_score}/10)."

        # Check answers for red flags (e.g. chest pain, severe shortness of breath)
        for q, ans in responses.items():
            if isinstance(ans, str) and any(red in ans.lower() for red in ["worse", "severe", "dizzy", "bleeding", "high fever", "pain 8", "pain 9", "pain 10"]):
                flagged = True
                review_reason = f"Response indicated acute discomfort in: {q}"
                break
            if ans is True and any(red in str(q).lower() for red in ["chest", "breathing", "pain", "fever", "discomfort"]):
                flagged = True
                review_reason = f"Affirmative acute indicator for: {q}"
                break

        response_id = str(uuid.uuid4())
        response_record = {
            "id": response_id,
            "followup_id": str(followup_id),
            "patient_id": str(patient_id),
            "responses": responses,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "flagged_for_review": flagged,
            "review_notes": review_reason,
            "reviewed_by": None
        }
        MOCK_DATA["followup_responses"].append(response_record)

        # Update plan status
        plan["status"] = "flagged" if flagged else "completed"

        if flagged and plan.get("doctor_id"):
            # Create high-priority alert notification for the doctor
            MOCK_DATA["notifications"].append({
                "id": str(uuid.uuid4()),
                "user_id": str(plan["doctor_id"]),
                "title": "Clinical Review Flag: Patient Follow-up Alert",
                "message": f"Patient follow-up #{followup_id[:8]} flagged for human review: {review_reason}",
                "type": "clinical_alert",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        return response_record


followup_service = FollowupService()
