import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.supabase import MOCK_DATA
from app.utils.permissions import log_audit_event


class DoctorService:
    def get_doctors(
        self,
        hospital_id: Optional[str] = None,
        department_id: Optional[str] = None,
        specialization: Optional[str] = None,
        search: Optional[str] = None,
        available_only: bool = False
    ) -> List[Dict[str, Any]]:
        results = []
        for doc in MOCK_DATA["doctors"]:
            if hospital_id and str(doc["hospital_id"]) != str(hospital_id):
                continue
            if department_id and str(doc["department_id"]) != str(department_id):
                continue
            if specialization and specialization.lower() not in doc["specialization"].lower():
                continue
            if available_only and not doc.get("is_available", True):
                continue
            if search:
                s = search.lower()
                matched = (
                    s in doc["name"].lower() or
                    s in doc["specialization"].lower() or
                    s in doc.get("bio", "").lower()
                )
                if not matched:
                    continue

            d_dict = dict(doc)
            hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(doc["hospital_id"])), None)
            dept = next((d for d in MOCK_DATA["departments"] if str(d["id"]) == str(doc["department_id"])), None)
            d_dict["hospital_name"] = hosp["name"] if hosp else "Unknown Hospital"
            d_dict["department_name"] = dept["name"] if dept else "General"
            results.append(d_dict)
        return results

    def get_doctor_by_id(self, doctor_id: str) -> Optional[Dict[str, Any]]:
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
        if not doc and (doctor_id == "doc-1" or doctor_id == "1"):
            doc = MOCK_DATA["doctors"][0] if MOCK_DATA["doctors"] else None

        if not doc:
            return None
        res = dict(doc)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(res["hospital_id"])), None)
        dept = next((d for d in MOCK_DATA["departments"] if str(d["id"]) == str(res["department_id"])), None)
        res["hospital_name"] = hosp["name"] if hosp else "Unknown Hospital"
        res["department_name"] = dept["name"] if dept else "General"
        res["schedules"] = [s for s in MOCK_DATA["doctor_schedules"] if str(s["doctor_id"]) == str(res["id"]) and s.get("is_active", True)]
        return res

    def get_doctor_availability(self, doctor_id: str, check_date: date) -> Dict[str, Any]:
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
        if not doc and (doctor_id == "doc-1" or doctor_id == "1"):
            doc = MOCK_DATA["doctors"][0] if MOCK_DATA["doctors"] else None

        if not doc:
            return {"doctor_id": doctor_id, "doctor_name": "", "date": str(check_date), "available_slots": [], "booked_slots": []}

        day_of_week = (check_date.weekday() + 1) % 7 # 0=Sunday, 6=Saturday
        schedules = [
            s for s in MOCK_DATA["doctor_schedules"]
            if str(s["doctor_id"]) == str(doc["id"]) and s["day_of_week"] == day_of_week and s.get("is_active", True)
        ]

        booked_appointments = [
            a for a in MOCK_DATA["appointments"]
            if str(a.get("doctor_id")) == str(doc["id"]) and str(a["appointment_date"]) == str(check_date) and a["status"] != "cancelled"
        ]
        booked_times = [str(a["appointment_time"])[:5] for a in booked_appointments]

        available_slots = []
        for sched in schedules:
            start_dt = datetime.strptime(sched["start_time"], "%H:%M:%S")
            end_dt = datetime.strptime(sched["end_time"], "%H:%M:%S")
            slot_duration = sched.get("slot_duration_minutes", 30)

            curr = start_dt
            while curr + timedelta(minutes=slot_duration) <= end_dt:
                slot_str = curr.strftime("%H:%M")
                if slot_str not in booked_times:
                    available_slots.append(slot_str)
                curr += timedelta(minutes=slot_duration)

        # Fallback default slots if no custom schedule was set
        if not available_slots:
            default_slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"]
            available_slots = [s for s in default_slots if s not in booked_times]

        return {
            "doctor_id": doctor_id,
            "doctor_name": doc["name"],
            "date": str(check_date),
            "available_slots": available_slots,
            "booked_slots": booked_times
        }

    def get_doctor_reviews(self, doctor_id: str, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
        if not doc and (doctor_id == "doc-1" or doctor_id == "1"):
            doc = MOCK_DATA["doctors"][0] if MOCK_DATA["doctors"] else None

        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        reviews = [r for r in MOCK_DATA.get("doctor_reviews", []) if str(r.get("doctor_id")) == str(doc["id"])]
        reviews.sort(key=lambda r: r.get("created_at", ""), reverse=True)

        breakdown = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        total_score = 0
        for r in reviews:
            star_key = str(int(r.get("rating", 5)))
            if star_key in breakdown:
                breakdown[star_key] += 1
            total_score += r.get("rating", 5)

        avg_rating = round(total_score / len(reviews), 1) if reviews else doc.get("rating", 4.8)
        doc["rating"] = avg_rating
        doc["review_count"] = len(reviews)

        can_rate = True  # Enabled for users to review doctors
        eligible_appointments = []
        user_review = None

        if current_user_id:
            user_apps = [
                a for a in MOCK_DATA["appointments"]
                if str(a.get("patient_id")) == str(current_user_id)
                and str(a.get("doctor_id")) == str(doc["id"])
            ]
            completed_apps = [a for a in user_apps if a.get("status") == "completed"]
            eligible_appointments = completed_apps if completed_apps else user_apps

            user_rev = next(
                (r for r in reviews if str(r.get("patient_id")) == str(current_user_id)),
                None
            )
            if user_rev:
                user_review = user_rev

        return {
            "doctor_id": str(doc["id"]),
            "doctor_name": doc["name"],
            "average_rating": avg_rating,
            "total_reviews": len(reviews),
            "breakdown": breakdown,
            "can_rate": can_rate,
            "eligible_appointments": eligible_appointments,
            "user_review": user_review,
            "reviews": reviews
        }

    def submit_doctor_review(
        self,
        doctor_id: str,
        patient_id: str,
        rating: int,
        comment: Optional[str] = None,
        tags: Optional[List[str]] = None,
        appointment_id: Optional[str] = None
    ) -> Dict[str, Any]:
        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(doctor_id)), None)
        if not doc and (doctor_id == "doc-1" or doctor_id == "1"):
            doc = MOCK_DATA["doctors"][0] if MOCK_DATA["doctors"] else None
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

        # Find any matching appointments between this patient and doctor
        user_apps = [
            a for a in MOCK_DATA["appointments"]
            if str(a.get("patient_id")) == str(patient_id)
            and str(a.get("doctor_id")) == str(doc["id"])
        ]
        completed_apps = [a for a in user_apps if a.get("status") == "completed"]

        target_appt = None
        if appointment_id:
            target_appt = next((a for a in MOCK_DATA["appointments"] if str(a.get("id")) == str(appointment_id)), None)
        elif completed_apps:
            target_appt = completed_apps[0]
        elif user_apps:
            target_appt = user_apps[0]

        is_verified = bool(completed_apps or (target_appt and target_appt.get("status") == "completed"))

        # Update appointment record if linked
        if target_appt:
            target_appt["patient_rating"] = rating

        # Resolve patient name
        patient_user = next((u for u in MOCK_DATA.get("profiles", []) if str(u["id"]) == str(patient_id)), None)
        patient_name = (
            (patient_user.get("full_name") or patient_user.get("name") if patient_user else None)
            or (target_appt.get("patient_name") if target_appt else None)
            or "Patient Reviewer"
        )

        # Check if review already exists for this patient-doctor pair or appointment
        existing_rev = next(
            (r for r in MOCK_DATA.get("doctor_reviews", [])
             if str(r.get("doctor_id")) == str(doc["id"])
             and (
                 (target_appt and str(r.get("appointment_id")) == str(target_appt["id"]))
                 or str(r.get("patient_id")) == str(patient_id)
             )),
            None
        )

        now_iso = datetime.now(timezone.utc).isoformat()
        if existing_rev:
            existing_rev["rating"] = rating
            existing_rev["comment"] = comment or existing_rev.get("comment", "")
            existing_rev["tags"] = tags or existing_rev.get("tags", [])
            existing_rev["verified_consultation"] = is_verified or existing_rev.get("verified_consultation", True)
            existing_rev["updated_at"] = now_iso
            saved_review = existing_rev
        else:
            new_rev_id = f"rev-{uuid.uuid4().hex[:8]}"
            saved_review = {
                "id": new_rev_id,
                "doctor_id": str(doc["id"]),
                "doctor_name": doc["name"],
                "patient_id": str(patient_id),
                "patient_name": patient_name,
                "appointment_id": str(target_appt["id"]) if target_appt else None,
                "hospital_id": str(doc.get("hospital_id")),
                "rating": rating,
                "comment": comment or "Consultation completed. Excellent clinical care.",
                "tags": tags or ["Accurate Diagnosis", "Compassionate Care"],
                "verified_consultation": is_verified,
                "created_at": now_iso
            }
            if "doctor_reviews" not in MOCK_DATA:
                MOCK_DATA["doctor_reviews"] = []
            MOCK_DATA["doctor_reviews"].append(saved_review)

        # 6. Recalculate doctor aggregate rating & review count
        all_revs = [r for r in MOCK_DATA.get("doctor_reviews", []) if str(r.get("doctor_id")) == str(doc["id"])]
        if all_revs:
            doc["rating"] = round(sum(r["rating"] for r in all_revs) / len(all_revs), 1)
            doc["review_count"] = len(all_revs)

        # 7. Log audit event
        log_audit_event(
            action="doctor_rating_submitted",
            resource_type="doctor_review",
            resource_id=saved_review["id"],
            user_id=str(patient_id),
            details={
                "doctor_id": str(doc["id"]),
                "rating": rating,
                "appointment_id": str(target_appt["id"]) if target_appt else None
            }
        )

        return {
            "review": saved_review,
            "doctor": {
                "id": str(doc["id"]),
                "name": doc["name"],
                "rating": doc["rating"],
                "review_count": doc["review_count"]
            }
        }


doctor_service = DoctorService()
