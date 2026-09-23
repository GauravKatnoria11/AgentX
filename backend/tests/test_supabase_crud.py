import uuid
import pytest
from app.supabase import supabase_service
from app.services.appointment_service import appointment_service
from app.services.medical_record_service import medical_record_service


def test_supabase_appointment_crud_service():
    """
    Test full CRUD lifecycle for appointments using SupabaseService
    """
    test_id = f"test-appt-{uuid.uuid4().hex[:8]}"
    patient_id = "test-patient-crud-1"

    # 1. CREATE
    created = supabase_service.create_appointment({
        "id": test_id,
        "patient_id": patient_id,
        "doctor_id": "doc-hsp-1",
        "hospital_id": "hosp-hoshiarpur-2",
        "appointment_date": "2026-11-20",
        "appointment_time": "15:00:00",
        "status": "confirmed",
        "reason": "Supabase CRUD integration verification",
        "patient_phone": "+91-98765-11111",
        "blood_group": "B+"
    })
    assert created["id"] == test_id
    assert created["status"] == "confirmed"

    # 2. READ BY ID
    fetched = supabase_service.get_appointment_by_id(test_id)
    assert fetched is not None
    assert fetched["id"] == test_id
    assert fetched["patient_id"] == patient_id
    assert fetched["appointment_date"] == "2026-11-20"

    # 3. READ BY PATIENT
    patient_appts = supabase_service.get_patient_appointments(patient_id)
    assert any(a["id"] == test_id for a in patient_appts)

    # 4. UPDATE
    updated = supabase_service.update_appointment(test_id, {
        "status": "cancelled",
        "cancellation_reason": "Rescheduled to another week"
    })
    assert updated is not None
    assert updated["status"] == "cancelled"
    assert updated["cancellation_reason"] == "Rescheduled to another week"

    # 5. DELETE
    deleted = supabase_service.delete_appointment(test_id)
    assert deleted is True

    # Verify deletion
    after_delete = supabase_service.get_appointment_by_id(test_id)
    assert after_delete is None


def test_supabase_medical_record_crud_service():
    """
    Test full CRUD lifecycle for medical records using SupabaseService
    """
    test_rec_id = f"test-rec-{uuid.uuid4().hex[:8]}"
    patient_id = "test-patient-crud-2"

    # 1. CREATE
    created = supabase_service.create_medical_record({
        "id": test_rec_id,
        "patient_id": patient_id,
        "title": "Comprehensive Lipid & Renal Profile",
        "record_type": "Pathology Lab Report",
        "disease_category": "Nephrology & Cardiology",
        "notes": "Kidney function tests normal. Serum creatinine 0.9 mg/dL.",
        "medicines": [
            {
                "name": "Ramipril 5mg",
                "dosage": "1 Capsule",
                "timing_label": "Morning",
                "duration": "60 Days"
            }
        ],
        "diet_plan": {
            "title": "Renal-Protective Diet",
            "notes": "Adequate hydration, low potassium fruits."
        }
    })
    assert created["id"] == test_rec_id
    assert created["title"] == "Comprehensive Lipid & Renal Profile"
    assert created["disease_category"] == "Nephrology & Cardiology"
    assert len(created["medicines"]) == 1

    # 2. READ BY ID
    fetched = supabase_service.get_medical_record_by_id(test_rec_id)
    assert fetched is not None
    assert fetched["id"] == test_rec_id
    assert fetched["patient_id"] == patient_id
    assert fetched["medicines"][0]["name"] == "Ramipril 5mg"
    assert fetched["diet_plan"]["title"] == "Renal-Protective Diet"

    # 3. READ BY PATIENT
    patient_records = supabase_service.get_patient_medical_records(patient_id)
    assert any(r["id"] == test_rec_id for r in patient_records)

    # 4. UPDATE
    updated = supabase_service.update_medical_record(test_rec_id, {
        "title": "Updated Renal Profile",
        "notes": "Follow-up test after 30 days."
    })
    assert updated is not None
    assert updated["title"] == "Updated Renal Profile"
    assert updated["notes"] == "Follow-up test after 30 days."

    # 5. DELETE
    deleted = supabase_service.delete_medical_record(test_rec_id)
    assert deleted is True

    # Verify deletion
    after_delete = supabase_service.get_medical_record_by_id(test_rec_id)
    assert after_delete is None


def test_medical_record_router_update_and_delete(client, patient_token, patient_b_token):
    """
    Test PATCH and DELETE API endpoints for medical records
    """
    headers = {"Authorization": f"Bearer {patient_token}"}
    headers_other = {"Authorization": f"Bearer {patient_b_token}"}

    # 1. Create a record via upload endpoint
    create_resp = client.post("/api/v1/medical-records/upload", json={
        "title": "API Test Medical Record",
        "record_type": "Consultation Summary",
        "notes": "Initial consultation notes"
    }, headers=headers)
    assert create_resp.status_code == 201
    rec_id = create_resp.json()["data"]["id"]

    # 2. Update via PATCH endpoint
    patch_resp = client.patch(f"/api/v1/medical-records/{rec_id}", json={
        "notes": "Updated notes via PATCH endpoint"
    }, headers=headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["notes"] == "Updated notes via PATCH endpoint"

    # 3. Unauthorized user cannot update (Patient Isolation)
    unauth_patch = client.patch(f"/api/v1/medical-records/{rec_id}", json={
        "notes": "Malicious update"
    }, headers=headers_other)
    assert unauth_patch.status_code == 403

    # 4. Delete via DELETE endpoint
    del_resp = client.delete(f"/api/v1/medical-records/{rec_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # 5. Verify 404 after deletion
    get_resp = client.get(f"/api/v1/medical-records/{rec_id}", headers=headers)
    assert get_resp.status_code == 404
