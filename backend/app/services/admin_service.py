import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import log_audit_event


class AdminService:
    def get_system_analytics(self, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provides aggregated analytics for the admin panel.
        Completely isolated from regular patient responses.
        """
        total_patients = len([p for p in MOCK_DATA["profiles"] if p.get("role") == "patient"])
        total_doctors = len(MOCK_DATA["doctors"])
        total_hospitals = len(MOCK_DATA["hospitals"])
        total_appointments = len(MOCK_DATA["appointments"])
        active_followups = len([f for f in MOCK_DATA["followups"] if f.get("status") == "pending"])
        pending_reviews = len([r for r in MOCK_DATA["followup_responses"] if r.get("flagged_for_review") and not r.get("reviewed_by")])

        log_audit_event(
            action="admin_view_analytics",
            resource_type="analytics",
            user_id=str(current_user.get("id"))
        )

        return {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_hospitals": total_hospitals,
            "total_appointments": total_appointments,
            "active_followups": active_followups,
            "pending_reviews": pending_reviews
        }

    def get_hospital_queue(self, hospital_id: Optional[str], current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Retrieves real-time patient queue for hospital staff or admin.
        Enforces hospital isolation for staff.
        """
        role = current_user.get("role")
        staff_hosp_id = (current_user.get("metadata") or {}).get("hospital_id")

        target_hosp_id = hospital_id
        if role == "staff":
            target_hosp_id = staff_hosp_id

        appointments = MOCK_DATA["appointments"]
        if target_hosp_id:
            appointments = [a for a in appointments if str(a.get("hospital_id")) == str(target_hosp_id)]

        queue_items = []
        for a in appointments:
            patient = next((p for p in MOCK_DATA["profiles"] if str(p["id"]) == str(a["patient_id"])), None)
            doctor = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(a["doctor_id"])), None)
            dept = next((d for d in MOCK_DATA["departments"] if str(d["id"]) == str(a.get("department_id"))), None)

            queue_items.append({
                "appointment_id": str(a["id"]),
                "patient_id": str(a["patient_id"]),
                "patient_name": patient["full_name"] if patient else "Patient",
                "doctor_name": doctor["name"] if doctor else "Doctor",
                "department_name": dept["name"] if dept else "General",
                "appointment_time": a["appointment_time"],
                "queue_number": a.get("queue_number", 1),
                "status": a["status"]
            })

        return queue_items

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        logs = list(MOCK_DATA["audit_logs"])
        logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return logs[:limit]

    def add_hospital(self, hospital_data: Dict[str, Any], current_user: Dict[str, Any]) -> Dict[str, Any]:
        hosp_id = str(uuid.uuid4())
        record = {
            "id": hosp_id,
            "name": hospital_data["name"],
            "type": hospital_data.get("type", "General Hospital"),
            "address": hospital_data["address"],
            "city": hospital_data["city"],
            "state": hospital_data.get("state", "IL"),
            "postal_code": hospital_data.get("postal_code", ""),
            "latitude": hospital_data.get("latitude", 39.78),
            "longitude": hospital_data.get("longitude", -89.65),
            "phone": hospital_data["phone"],
            "email": hospital_data.get("email"),
            "website": hospital_data.get("website"),
            "rating": hospital_data.get("rating", 4.5),
            "services": hospital_data.get("services", []),
            "emergency_available": hospital_data.get("emergency_available", True),
            "operational_hours": hospital_data.get("operational_hours", "24/7"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["hospitals"].append(record)

        log_audit_event(
            action="admin_create_hospital",
            resource_type="hospital",
            resource_id=hosp_id,
            user_id=str(current_user.get("id")),
            details={"hospital_name": record["name"]}
        )

        return record


admin_service = AdminService()
