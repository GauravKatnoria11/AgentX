import uuid
from datetime import date, time, datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import ensure_patient_ownership, log_audit_event


class AppointmentService:
    def book_appointment(
        self,
        patient_id: str,
        doctor_id: str,
        hospital_id: str,
        department_id: Optional[str],
        appointment_date: date,
        appointment_time: time,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        patient_phone: Optional[str] = None,
        blood_group: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Validate date not in past
        if appointment_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot book an appointment for a past date."
            )

        # 2. Check doctor exists
        doctor = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
        if not doctor and (doctor_id == "doc-1" or doctor_id == "1"):
            doctor = MOCK_DATA["doctors"][0] if MOCK_DATA["doctors"] else None
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found."
            )

        # 3. Check hospital exists
        hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hospital_id)), None)
        if not hospital and (hospital_id == "hosp-1" or hospital_id == "1"):
            hospital = MOCK_DATA["hospitals"][0] if MOCK_DATA["hospitals"] else None
        if not hospital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hospital not found."
            )

        # 4. Check double-booking conflict (Prevent booking unavailable slots / double bookings)
        time_str = appointment_time.strftime("%H:%M:%S")
        date_str = str(appointment_date)

        existing_conflict = next(
            (
                a for a in MOCK_DATA["appointments"]
                if str(a["doctor_id"]) == str(doctor_id)
                and str(a["appointment_date"]) == date_str
                and str(a["appointment_time"])[:5] == time_str[:5]
                and a["status"] != "cancelled"
            ),
            None
        )
        if existing_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This doctor is already booked for the selected time slot. Please choose another time."
            )

        # 5. Compute queue number for that doctor/date
        day_appointments = [
            a for a in MOCK_DATA["appointments"]
            if str(a["doctor_id"]) == str(doctor_id) and str(a["appointment_date"]) == date_str
        ]
        queue_number = len(day_appointments) + 1

        # Look up patient profile to get existing contact info or update it
        patient_profile = next((p for p in MOCK_DATA.get("profiles", []) if str(p["id"]) == str(patient_id)), None)
        if patient_profile:
            if patient_phone:
                patient_profile["phone"] = patient_phone
            if blood_group:
                patient_profile["blood_group"] = blood_group

        effective_phone = patient_phone or (patient_profile.get("phone") if patient_profile else None)
        effective_blood = blood_group or (patient_profile.get("blood_group") if patient_profile else None)
        patient_name = patient_profile.get("full_name") if patient_profile else "Patient"
        patient_email = (patient_profile.get("email") if patient_profile else None) or MOCK_DATA.get("last_active_user_email")

        # 6. Save appointment
        appointment_id = str(uuid.uuid4())
        new_appointment = {
            "id": appointment_id,
            "patient_id": str(patient_id),
            "patient_name": patient_name,
            "patient_email": patient_email,
            "patient_phone": effective_phone,
            "blood_group": effective_blood,
            "doctor_id": str(doctor_id),
            "hospital_id": str(hospital_id),
            "department_id": str(department_id) if department_id else doctor.get("department_id"),
            "appointment_date": date_str,
            "appointment_time": time_str,
            "status": "confirmed",
            "reason": reason,
            "queue_number": queue_number,
            "notes": notes,
            "cancellation_reason": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        MOCK_DATA["appointments"].append(new_appointment)

        # Create notification for patient
        MOCK_DATA["notifications"].append({
            "id": str(uuid.uuid4()),
            "user_id": str(patient_id),
            "title": "Appointment Confirmed",
            "message": f"Your appointment with {doctor['name']} at {hospital['name']} is confirmed for {date_str} at {time_str[:5]}.",
            "type": "appointment",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Log audit entry
        log_audit_event(
            action="appointment_booked",
            resource_type="appointment",
            resource_id=appointment_id,
            user_id=str(patient_id),
            details={"doctor_id": doctor_id, "date": date_str, "time": time_str}
        )

        return self.enrich_appointment(new_appointment)

    def get_patient_appointments(self, patient_id: str, patient_email: Optional[str] = None) -> List[Dict[str, Any]]:
        appointments = [
            a for a in MOCK_DATA["appointments"]
            if str(a.get("patient_id")) == str(patient_id)
            or (patient_email and a.get("patient_email") == patient_email)
            or (str(patient_id) in ["11111111-1111-1111-1111-111111111111", "guest", "default"] and str(a.get("patient_id")) == "11111111-1111-1111-1111-111111111111")
        ]
        # Deduplicate
        seen = set()
        deduped = []
        for a in appointments:
            if a["id"] not in seen:
                seen.add(a["id"])
                deduped.append(a)

        deduped.sort(key=lambda x: (str(x.get("appointment_date", "")), str(x.get("appointment_time", ""))), reverse=True)
        return [self.enrich_appointment(a) for a in deduped]

    def get_appointment_by_id(self, appointment_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found."
            )

        # Enforce patient ownership rule
        ensure_patient_ownership(current_user, appointment["patient_id"])
        return self.enrich_appointment(appointment)

    def cancel_appointment(self, appointment_id: str, current_user: Dict[str, Any], cancellation_reason: Optional[str] = None) -> Dict[str, Any]:
        appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found."
            )

        # Enforce patient ownership rule
        ensure_patient_ownership(current_user, appointment["patient_id"])

        if appointment["status"] == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment is already cancelled."
            )

        appointment["status"] = "cancelled"
        appointment["cancellation_reason"] = cancellation_reason or "Cancelled by user"

        log_audit_event(
            action="appointment_cancelled",
            resource_type="appointment",
            resource_id=appointment_id,
            user_id=str(current_user.get("id")),
            details={"reason": appointment["cancellation_reason"]}
        )

        return self.enrich_appointment(appointment)

    def complete_appointment(self, appointment_id: str, current_user: Dict[str, Any]) -> Dict[str, Any]:
        appointment = next((a for a in MOCK_DATA["appointments"] if str(a["id"]) == str(appointment_id)), None)
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found."
            )

        appointment["status"] = "completed"
        appointment["completed_at"] = datetime.now(timezone.utc).isoformat()

        log_audit_event(
            action="appointment_completed",
            resource_type="appointment",
            resource_id=appointment_id,
            user_id=str(current_user.get("id")),
            details={"doctor_id": appointment.get("doctor_id")}
        )

        return self.enrich_appointment(appointment)

    def enrich_appointment(self, appointment: Dict[str, Any]) -> Dict[str, Any]:
        res = dict(appointment)
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(appointment.get("hospital_id"))), None)
        dept = next((d for d in MOCK_DATA["departments"] if str(d["id"]) == str(appointment.get("department_id"))), None)
        patient = next((p for p in MOCK_DATA.get("profiles", []) if str(p["id"]) == str(appointment.get("patient_id"))), None)
        
        res["doctor_name"] = doc["name"] if doc else "Doctor"
        res["hospital_name"] = hosp["name"] if hosp else "Hospital"
        res["department_name"] = dept["name"] if dept else "General"
        res["patient_name"] = res.get("patient_name") or (patient["full_name"] if patient else "Patient")
        res["patient_email"] = res.get("patient_email") or (patient.get("email") if patient else None) or MOCK_DATA.get("last_active_user_email")
        res["patient_phone"] = res.get("patient_phone") or (patient.get("phone") if patient else None)
        res["blood_group"] = res.get("blood_group") or (patient.get("blood_group") if patient else None)

        # Check if patient already rated this consultation
        rev = next((r for r in MOCK_DATA.get("doctor_reviews", []) if str(r.get("appointment_id")) == str(appointment.get("id"))), None)
        if rev:
            res["patient_rating"] = rev.get("rating")

        return res


appointment_service = AppointmentService()
