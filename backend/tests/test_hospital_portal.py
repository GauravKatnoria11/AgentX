import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_hospital_portal_login_and_multi_tenant_isolation():
    # 1. Login as Ivy Hospital
    ivy_resp = client.post("/api/v1/hospital-portal/auth/login", json={
        "identifier": "ivy_hsp",
        "password": "ivy@hsp2026"
    })
    assert ivy_resp.status_code == 200
    ivy_json = ivy_resp.json()
    assert ivy_json["success"] is True
    ivy_data = ivy_json["data"]
    assert "access_token" in ivy_data
    assert ivy_data["hospital"]["id"] == "hosp-hoshiarpur-2"
    assert "Ivy Hospital" in ivy_data["hospital"]["name"]
    ivy_token = ivy_data["access_token"]

    # 2. Login as Civil Hospital
    civil_resp = client.post("/api/v1/hospital-portal/auth/login", json={
        "identifier": "civil_hsp",
        "password": "civil@hsp2026"
    })
    assert civil_resp.status_code == 200
    civil_json = civil_resp.json()
    assert civil_json["success"] is True
    civil_token = civil_json["data"]["access_token"]
    assert civil_json["data"]["hospital"]["id"] == "hosp-1"

    # 3. Check Ivy Hospital Dashboard
    ivy_headers = {"Authorization": f"Bearer {ivy_token}"}
    dash_resp = client.get("/api/v1/hospital-portal/dashboard", headers=ivy_headers)
    assert dash_resp.status_code == 200
    dash_json = dash_resp.json()
    assert dash_json["success"] is True
    dash_data = dash_json["data"]
    assert dash_data["hospital"]["id"] == "hosp-hoshiarpur-2"
    assert "metrics" in dash_data
    assert "appointments" in dash_data

    # Every appointment in ivy dashboard MUST belong to hosp-hoshiarpur-2
    for appt in dash_data["appointments"]:
        assert appt["hospital_id"] == "hosp-hoshiarpur-2"

    # 4. Check Bed Update for Ivy Hospital
    bed_resp = client.patch(
        "/api/v1/hospital-portal/beds",
        json={"icu_beds_available": 14, "total_beds": 160},
        headers=ivy_headers
    )
    assert bed_resp.status_code == 200
    bed_json = bed_resp.json()
    assert bed_json["success"] is True
    assert bed_json["data"]["hospital"]["icu_beds_available"] == 14

    # 5. Check Allotting appointment
    if dash_data["appointments"]:
        target_appt = dash_data["appointments"][0]
        appt_id = target_appt["id"]
        allot_resp = client.patch(
            f"/api/v1/hospital-portal/appointments/{appt_id}/allot",
            json={
                "appointment_date": "2026-09-27",
                "appointment_time": "11:00:00",
                "queue_number": 3,
                "notes": "Fast-tracked by Hospital Chief Medical Officer"
            },
            headers=ivy_headers
        )
        assert allot_resp.status_code == 200
        allot_json = allot_resp.json()
        assert allot_json["success"] is True
        assert allot_json["data"]["appointment"]["status"] == "confirmed"
        assert allot_json["data"]["appointment"]["queue_number"] == 3

        # 6. Check Prescribe Regimen and Diet
        presc_resp = client.post(
            f"/api/v1/hospital-portal/appointments/{appt_id}/prescribe",
            json={
                "disease_category": "Hypertension & Cardiac Care",
                "title": "Hospital Cardiology Protocol",
                "diagnosis": "Grade-1 Essential Hypertension",
                "medicines": [
                    {
                        "name": "Telmisartan 40mg",
                        "dosage": "1 Tablet",
                        "timing_label": "Morning (🌅)",
                        "timing": {"morning": True, "afternoon": False, "evening": False, "night": False},
                        "meal_relation": "After Breakfast",
                        "duration": "30 Days",
                        "instructions": "Take daily at 8:00 AM"
                    }
                ],
                "diet_plan": {
                    "title": "Low Sodium Cardiac Diet",
                    "breakfast": "Steel cut oatmeal with flax seeds",
                    "lunch": "2 chapati, yellow dal, green beans",
                    "evening_snack": "Roasted makhana",
                    "dinner": "Vegetable soup and moong khichdi",
                    "foods_to_avoid": "Pickles, processed snacks, fried namkeen",
                    "hydration_advice": "2.5 Liters water daily",
                    "doctor_notes": "Morning walk for 30 minutes"
                },
                "doctor_notes": "Follow-up after 4 weeks with fresh lipid profile"
            },
            headers=ivy_headers
        )
        assert presc_resp.status_code == 200
        assert presc_resp.json()["success"] is True

def test_hospital_portal_invalid_credentials():
    resp = client.post("/api/v1/hospital-portal/auth/login", json={
        "identifier": "unknown_hospital",
        "password": "wrong_password"
    })
    assert resp.status_code == 401


def test_hospital_portal_send_reminder():
    ivy_resp = client.post("/api/v1/hospital-portal/auth/login", json={
        "identifier": "ivy_hsp",
        "password": "ivy@hsp2026"
    })
    assert ivy_resp.status_code == 200
    token = ivy_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dispatch reminder for app-hsp-1
    remind_resp = client.post(
        "/api/v1/hospital-portal/appointments/app-hsp-1/send-reminder",
        json={"recipient_email": "g200004k@gmail.com"},
        headers=headers
    )
    assert remind_resp.status_code == 200
    data = remind_resp.json()
    assert data["success"] is True
    assert "resend_result" in data["data"]
    assert data["data"]["appointment"]["reminder_sent"] is True

