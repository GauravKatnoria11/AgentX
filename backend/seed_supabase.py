import os
import sys
import logging
from supabase import create_client
from app.config import settings
from app.supabase import MOCK_DATA

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_supabase")

def seed():
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not url or not key:
        logger.error("Missing SUPABASE_URL or keys in .env")
        return

    logger.info(f"Connecting to Supabase at {url}...")
    sb = create_client(url, key)

    # 1. Seed Hospitals
    logger.info("Seeding hospitals...")
    for h in MOCK_DATA.get("hospitals", []):
        try:
            sb.table("hospitals").upsert({
                "id": h["id"],
                "name": h["name"],
                "type": h.get("type", "General Hospital"),
                "address": h["address"],
                "city": h["city"],
                "state": h["state"],
                "postal_code": h["postal_code"],
                "latitude": h["latitude"],
                "longitude": h["longitude"],
                "phone": h["phone"],
                "emergency_hotline": h.get("emergency_hotline"),
                "email": h.get("email"),
                "website": h.get("website"),
                "rating": h.get("rating", 4.5),
                "services": h.get("services", []),
                "diseases_treated": h.get("diseases_treated", []),
                "emergency_available": h.get("emergency_available", True),
                "available_icu_beds": h.get("available_icu_beds", 10),
                "total_beds": h.get("total_beds", 100),
                "operational_hours": h.get("operational_hours", "24/7"),
                "consultation_fee": h.get("consultation_fee", 0.0),
                "min_fee": h.get("min_fee", 0.0),
                "max_fee": h.get("max_fee", 0.0),
                "fee_tier": h.get("fee_tier"),
                "transportation_facilities": h.get("transportation_facilities", {}),
                "image_url": h.get("image_url")
            }).execute()
        except Exception as e:
            logger.warning(f"Hospital {h['name']} notice: {e}")

    # 2. Seed Departments
    logger.info("Seeding departments...")
    for d in MOCK_DATA.get("departments", []):
        try:
            sb.table("departments").upsert({
                "id": d["id"],
                "hospital_id": d["hospital_id"],
                "name": d["name"],
                "description": d.get("description"),
                "head_doctor_name": d.get("head_doctor_name"),
                "floor_location": d.get("floor_location"),
                "contact_extension": d.get("contact_extension")
            }).execute()
        except Exception as e:
            logger.warning(f"Department {d['name']} notice: {e}")

    # 3. Seed Doctors
    logger.info("Seeding doctors...")
    for doc in MOCK_DATA.get("doctors", []):
        try:
            sb.table("doctors").upsert({
                "id": doc["id"],
                "hospital_id": doc["hospital_id"],
                "department_id": doc["department_id"],
                "name": doc["name"],
                "specialization": doc["specialization"],
                "qualification": doc["qualification"],
                "experience_years": doc.get("experience_years", 0),
                "consultation_fee": doc.get("consultation_fee", 0.0),
                "bio": doc.get("bio"),
                "rating": doc.get("rating", 4.8),
                "is_available": doc.get("is_available", True)
            }).execute()
        except Exception as e:
            logger.warning(f"Doctor {doc['name']} notice: {e}")

    # 4. Seed Doctor Schedules
    logger.info("Seeding doctor schedules...")
    for s in MOCK_DATA.get("doctor_schedules", []):
        try:
            sb.table("doctor_schedules").upsert({
                "id": s["id"],
                "doctor_id": s["doctor_id"],
                "day_of_week": s["day_of_week"],
                "start_time": s["start_time"],
                "end_time": s["end_time"],
                "slot_duration_minutes": s.get("slot_duration_minutes", 30),
                "is_active": s.get("is_active", True)
            }).execute()
        except Exception as e:
            logger.warning(f"Schedule {s['id']} notice: {e}")

    # 5. Seed Appointments
    logger.info("Seeding appointments...")
    valid_app_ids = set()
    for app in MOCK_DATA.get("appointments", []):
        try:
            time_val = app["appointment_time"]
            if time_val == "Pending Allotment" or not time_val:
                time_val = "10:00:00"
            sb.table("appointments").upsert({
                "id": app["id"],
                "patient_id": app["patient_id"],
                "doctor_id": app["doctor_id"],
                "hospital_id": app["hospital_id"],
                "department_id": app.get("department_id"),
                "appointment_date": app["appointment_date"],
                "appointment_time": time_val,
                "status": app.get("status", "pending"),
                "reason": app.get("reason"),
                "queue_number": app.get("queue_number"),
                "notes": app.get("notes"),
                "patient_phone": app.get("patient_phone"),
                "blood_group": app.get("blood_group")
            }).execute()
            valid_app_ids.add(app["id"])
        except Exception as e:
            logger.warning(f"Appointment {app['id']} notice: {e}")

    # 6. Seed Doctor Reviews
    logger.info("Seeding doctor reviews...")
    for rev in MOCK_DATA.get("doctor_reviews", []):
        try:
            app_id = rev.get("appointment_id")
            if app_id not in valid_app_ids:
                app_id = None
            sb.table("doctor_reviews").upsert({
                "id": rev["id"],
                "doctor_id": rev["doctor_id"],
                "doctor_name": rev["doctor_name"],
                "patient_id": rev["patient_id"],
                "patient_name": rev["patient_name"],
                "appointment_id": app_id,
                "hospital_id": rev.get("hospital_id"),
                "rating": rev["rating"],
                "comment": rev.get("comment"),
                "tags": rev.get("tags", []),
                "verified_consultation": rev.get("verified_consultation", True)
            }).execute()
        except Exception as e:
            logger.warning(f"Review {rev['id']} notice: {e}")

    # 7. Seed Medical Records
    logger.info("Seeding medical records...")
    for rec in MOCK_DATA.get("medical_records", []):
        try:
            meta = dict(rec.get("metadata") or {})
            if "disease_category" in rec and "disease_category" not in meta:
                meta["disease_category"] = rec["disease_category"]
            if "appointment_id" in rec and "appointment_id" not in meta:
                meta["appointment_id"] = rec["appointment_id"]
            if "medicines" in rec and "medicines" not in meta:
                meta["medicines"] = rec["medicines"]
            if "diet_plan" in rec and "diet_plan" not in meta:
                meta["diet_plan"] = rec["diet_plan"]

            sb.table("medical_records").upsert({
                "id": rec["id"],
                "patient_id": rec["patient_id"],
                "doctor_id": rec.get("doctor_id"),
                "hospital_id": rec.get("hospital_id"),
                "title": rec["title"],
                "record_type": rec["record_type"],
                "file_url": rec.get("file_url"),
                "file_name": rec.get("file_name"),
                "file_size_bytes": rec.get("file_size_bytes"),
                "notes": rec.get("notes"),
                "metadata": meta
            }).execute()
        except Exception as e:
            logger.warning(f"Medical record {rec['id']} notice: {e}")

    logger.info("All tables seeded into Supabase successfully!")

if __name__ == "__main__":
    seed()
