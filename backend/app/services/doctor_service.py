from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


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


doctor_service = DoctorService()
