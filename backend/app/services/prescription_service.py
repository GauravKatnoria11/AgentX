import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import ensure_patient_ownership, log_audit_event


class PrescriptionService:
    def get_my_prescriptions(self, patient_id: str) -> List[Dict[str, Any]]:
        prescriptions = [p for p in MOCK_DATA["prescriptions"] if str(p["patient_id"]) == str(patient_id)]
        log_audit_event(
            action="prescription_view_list",
            resource_type="prescription",
            user_id=str(patient_id),
            details={"count": len(prescriptions)}
        )
        return [self.enrich_prescription(p) for p in prescriptions]

    def get_prescription_by_id(self, prescription_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        presc = next((p for p in MOCK_DATA["prescriptions"] if str(p["id"]) == str(prescription_id)), None)
        if not presc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found."
            )

        ensure_patient_ownership(current_user, presc["patient_id"])

        log_audit_event(
            action="prescription_view_detail",
            resource_type="prescription",
            resource_id=prescription_id,
            user_id=str(current_user.get("id"))
        )

        return self.enrich_prescription(presc)

    def upload_prescription(
        self,
        patient_id: str,
        diagnosis: str,
        medications: List[Dict[str, Any]],
        instructions: Optional[str] = None,
        file_url: Optional[str] = None,
        doctor_id: Optional[str] = None,
        appointment_id: Optional[str] = None,
        is_ai_caller: bool = False
    ) -> Dict[str, Any]:
        # Critical Safety Rule (Page 14): AI is strictly forbidden from creating prescriptions!
        if is_ai_caller:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="AI systems are strictly prohibited from generating, modifying, or prescribing medications."
            )

        presc_id = str(uuid.uuid4())
        new_presc = {
            "id": presc_id,
            "patient_id": str(patient_id),
            "doctor_id": str(doctor_id) if doctor_id else None,
            "appointment_id": str(appointment_id) if appointment_id else None,
            "diagnosis": diagnosis,
            "medications": medications,
            "instructions": instructions,
            "file_url": file_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["prescriptions"].append(new_presc)

        log_audit_event(
            action="prescription_uploaded",
            resource_type="prescription",
            resource_id=presc_id,
            user_id=str(patient_id),
            details={"diagnosis": diagnosis, "medication_count": len(medications)}
        )

        return self.enrich_prescription(new_presc)

    def enrich_prescription(self, presc: Dict[str, Any]) -> Dict[str, Any]:
        res = dict(presc)
        if presc.get("doctor_id"):
            doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(presc["doctor_id"])), None)
            res["doctor_name"] = doc["name"] if doc else "Attending Physician"
        else:
            res["doctor_name"] = "Attending Physician"
        return res


prescription_service = PrescriptionService()
