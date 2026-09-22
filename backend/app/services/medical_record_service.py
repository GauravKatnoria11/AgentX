import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import ensure_patient_ownership, log_audit_event


class MedicalRecordService:
    def get_patient_records(self, patient_id: str) -> List[Dict[str, Any]]:
        records = [r for r in MOCK_DATA["medical_records"] if str(r["patient_id"]) == str(patient_id)]
        records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        log_audit_event(
            action="medical_record_list_view",
            resource_type="medical_record",
            user_id=str(patient_id),
            details={"count": len(records)}
        )
        return [self.enrich_record(r) for r in records]

    def get_record_by_id(self, record_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        record = next((r for r in MOCK_DATA["medical_records"] if str(r["id"]) == str(record_id)), None)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical record not found."
            )

        # Strictly enforce Patient Isolation (Page 15)
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
        doctor_id: Optional[str] = None,
        hospital_id: Optional[str] = None,
        file_url: Optional[str] = None,
        file_name: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        rec_id = str(uuid.uuid4())
        record = {
            "id": rec_id,
            "patient_id": str(patient_id),
            "doctor_id": str(doctor_id) if doctor_id else None,
            "hospital_id": str(hospital_id) if hospital_id else None,
            "title": title,
            "record_type": record_type,
            "file_url": file_url,
            "file_name": file_name,
            "file_size_bytes": file_size_bytes,
            "notes": notes,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["medical_records"].append(record)

        log_audit_event(
            action="medical_record_created",
            resource_type="medical_record",
            resource_id=rec_id,
            user_id=str(patient_id),
            details={"title": title, "type": record_type}
        )

        return self.enrich_record(record)

    def enrich_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        res = dict(record)
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(record.get("doctor_id"))), None)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(record.get("hospital_id"))), None)
        res["doctor_name"] = doc["name"] if doc else "Attending Specialist"
        res["hospital_name"] = hosp["name"] if hosp else "Associated Medical Facility"
        return res


medical_record_service = MedicalRecordService()
