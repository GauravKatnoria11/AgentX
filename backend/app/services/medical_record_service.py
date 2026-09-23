import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA, supabase_service
from app.utils.permissions import ensure_patient_ownership, log_audit_event


class MedicalRecordService:
    def get_patient_records(self, patient_id: str) -> List[Dict[str, Any]]:
        records = supabase_service.get_patient_medical_records(patient_id)
        log_audit_event(
            action="medical_record_list_view",
            resource_type="medical_record",
            user_id=str(patient_id),
            details={"count": len(records)}
        )
        return [self.enrich_record(r) for r in records]

    def get_record_by_id(self, record_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        record = supabase_service.get_medical_record_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found."
            )

        # Strictly enforce Patient Isolation
        ensure_patient_ownership(current_user, record["patient_id"])

        log_audit_event(
            action="medical_record_detail_view",
            resource_type="medical_record",
            resource_id=record_id,
            user_id=str(current_user.get("id"))
        )

        return self.enrich_record(record)

    def create_record(
        self,
        patient_id: str,
        title: str,
        record_type: str,
        disease_category: Optional[str] = "General Medicine",
        appointment_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        hospital_id: Optional[str] = None,
        file_url: Optional[str] = None,
        file_name: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        medicines: Optional[List[Dict[str, Any]]] = None,
        diet_plan: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        rec_id = str(uuid.uuid4())
        record = {
            "id": rec_id,
            "patient_id": str(patient_id),
            "disease_category": disease_category or "General Medicine",
            "appointment_id": appointment_id,
            "doctor_id": str(doctor_id) if doctor_id else None,
            "hospital_id": str(hospital_id) if hospital_id else None,
            "title": title,
            "record_type": record_type,
            "file_url": file_url,
            "file_name": file_name,
            "file_size_bytes": file_size_bytes,
            "medicines": medicines or [],
            "diet_plan": diet_plan or None,
            "notes": notes,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        saved_record = supabase_service.create_medical_record(record)

        log_audit_event(
            action="medical_record_created",
            resource_type="medical_record",
            resource_id=rec_id,
            user_id=str(patient_id),
            details={"title": title, "type": record_type}
        )

        return self.enrich_record(saved_record)

    def update_record(
        self,
        record_id: str,
        updates: Dict[str, Any],
        current_user: Dict[str, Any]
    ) -> Dict[str, Any]:
        record = supabase_service.get_medical_record_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found."
            )
        ensure_patient_ownership(current_user, record["patient_id"])

        updated = supabase_service.update_medical_record(record_id, updates)
        log_audit_event(
            action="medical_record_updated",
            resource_type="medical_record",
            resource_id=record_id,
            user_id=str(current_user.get("id"))
        )
        return self.enrich_record(updated or record)

    def delete_record(
        self,
        record_id: str,
        current_user: Dict[str, Any]
    ) -> bool:
        record = supabase_service.get_medical_record_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found."
            )
        ensure_patient_ownership(current_user, record["patient_id"])

        success = supabase_service.delete_medical_record(record_id)
        log_audit_event(
            action="medical_record_deleted",
            resource_type="medical_record",
            resource_id=record_id,
            user_id=str(current_user.get("id"))
        )
        return success

    def enrich_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        res = dict(record)
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(record.get("doctor_id"))), None)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(record.get("hospital_id"))), None)
        res["doctor_name"] = doc["name"] if doc else "Attending Specialist"
        res["hospital_name"] = hosp["name"] if hosp else "Associated Medical Facility"
        return res


medical_record_service = MedicalRecordService()
