def test_appointment_booking_flow(client, patient_token):
    headers = {"Authorization": f"Bearer {patient_token}"}
    payload = {
        "doctor_id": "doc-1",
        "hospital_id": "hosp-1",
        "appointment_date": "2026-10-15",
        "appointment_time": "11:00:00",
        "reason": "Annual cardiovascular checkup"
    }
    # 1. Book successfully
    resp = client.post("/api/v1/appointments", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    app_id = data["data"]["id"]
    assert data["data"]["status"] == "confirmed"

    # 2. Attempt double-booking exact same slot -> Conflict (409)
    conflict_resp = client.post("/api/v1/appointments", json=payload, headers=headers)
    assert conflict_resp.status_code == 409
    assert conflict_resp.json()["error_code"] == "CONFLICT"

    # 3. View my appointments
    my_resp = client.get("/api/v1/appointments/my", headers=headers)
    assert my_resp.status_code == 200
    assert any(a["id"] == app_id for a in my_resp.json()["data"])

    # 4. Cancel appointment
    cancel_resp = client.patch(
        f"/api/v1/appointments/{app_id}/cancel",
        json={"cancellation_reason": "Schedule change"},
        headers=headers
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["data"]["status"] == "cancelled"
