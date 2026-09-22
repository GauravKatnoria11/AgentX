import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.security import create_access_token
from app.supabase import MOCK_DATA

client = TestClient(app)

@pytest.fixture
def patient_token():
    return create_access_token({
        "sub": "11111111-1111-1111-1111-111111111111",
        "role": "patient",
        "email": "john.doe@example.com",
        "name": "John Doe"
    })

@pytest.fixture
def admin_token():
    return create_access_token({
        "sub": "00000000-0000-0000-0000-000000000000",
        "role": "admin",
        "email": "admin@hospital.org",
        "name": "Admin User"
    })

def test_doctor_rating_rejected_if_not_appointed():
    # Token for a user with NO appointments with doc-hsp-5
    stranger_token = create_access_token({
        "sub": "99999999-0000-0000-0000-000000000000",
        "role": "patient",
        "email": "stranger@example.com"
    })
    headers = {"Authorization": f"Bearer {stranger_token}"}
    resp = client.post(
        "/api/v1/doctors/doc-hsp-5/ratings",
        json={"rating": 5, "comment": "Trying to rate without booking"},
        headers=headers
    )
    assert resp.status_code == 403
    assert "You can only rate a doctor if you have booked an appointment" in resp.json()["detail"]

def test_doctor_rating_rejected_if_appointment_is_not_completed(patient_token):
    # John Doe has app-hsp-1 with doc-hsp-1, but status is 'confirmed', NOT completed
    # And app-hsp-req-1 with doc-hsp-2, but status is 'pending', NOT completed
    headers = {"Authorization": f"Bearer {patient_token}"}
    resp = client.post(
        "/api/v1/doctors/doc-hsp-2/ratings",
        json={"rating": 4, "comment": "Consultation pending, rating early"},
        headers=headers
    )
    assert resp.status_code == 403
    assert "only rate a doctor after your consultation appointment is marked 'completed'" in resp.json()["detail"]

def test_doctor_rating_succeeds_when_appointment_is_completed(patient_token):
    # John Doe has app-completed-1 with doc-hsp-1 where status == 'completed'
    headers = {"Authorization": f"Bearer {patient_token}"}
    resp = client.post(
        "/api/v1/doctors/doc-hsp-1/ratings",
        json={
            "rating": 5,
            "comment": "Superb consultation. Doctor explained my medication regimen with morning/night schedules clearly.",
            "tags": ["Accurate Diagnosis", "Clear Medicine Schedule", "Compassionate Care"],
            "appointment_id": "app-completed-1"
        },
        headers=headers
    )
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["review"]["rating"] == 5
    assert data["review"]["verified_consultation"] is True
    assert data["doctor"]["rating"] >= 4.5

    # Check reviews listing
    rev_resp = client.get("/api/v1/doctors/doc-hsp-1/reviews", headers=headers)
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()["data"]
    assert rev_data["can_rate"] is True
    assert rev_data["total_reviews"] >= 1

def test_admin_refer_overbooked_doctor_patient(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Refer app-hsp-1 from doc-hsp-1 to doc-hsp-2
    resp = client.post(
        "/api/v1/admin/appointments/app-hsp-1/refer",
        json={
            "target_doctor_id": "doc-hsp-2",
            "reason": "Doctor Overbooked - Caseload Balancing",
            "notes": "Transferring patient to joint trauma specialist"
        },
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["appointment"]["doctor_id"] == "doc-hsp-2"
    assert "Referred" in data["appointment"]["notes"]
    assert "referred_to" in data

def test_appointment_resend_reminder_email(patient_token):
    headers = {"Authorization": f"Bearer {patient_token}"}
    resp = client.post(
        "/api/v1/appointments/app-today-remind/send-reminder",
        json={"recipient_email": "patient.test@healthnexus.internal"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    data = resp.json()["data"]
    assert data["provider"] == "resend"
    assert "subject" in data

def test_automatic_appointment_date_reminder_trigger():
    resp = client.post("/api/v1/appointments/reminders/trigger-today")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert "total_reminders_triggered" in resp.json()["data"]
