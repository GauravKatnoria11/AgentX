def test_patient_medical_record_isolation(client, patient_token, patient_b_token):
    headers_a = {"Authorization": f"Bearer {patient_token}"}
    headers_b = {"Authorization": f"Bearer {patient_b_token}"}

    # 1. Patient A uploads a private medical record
    payload = {
        "title": "Private Blood Test Report",
        "record_type": "Lab Report",
        "hospital_id": "hosp-1",
        "notes": "Sensitive patient A health metrics"
    }
    create_resp = client.post("/api/v1/medical-records/upload", json=payload, headers=headers_a)
    assert create_resp.status_code == 201
    record_id = create_resp.json()["data"]["id"]

    # 2. Patient A can access their own record
    get_a = client.get(f"/api/v1/medical-records/{record_id}", headers=headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["data"]["title"] == "Private Blood Test Report"

    # 3. Patient B attempts to access Patient A's record -> Access Denied (403 Forbidden)
    get_b = client.get(f"/api/v1/medical-records/{record_id}", headers=headers_b)
    assert get_b.status_code == 403
    assert get_b.json()["error_code"] == "FORBIDDEN"
    assert "Access denied" in get_b.json()["message"]


def test_prescription_access_isolation(client, patient_b_token):
    # Prescription 1 belongs to Patient A ("11111111-1111-1111-1111-111111111111")
    headers_b = {"Authorization": f"Bearer {patient_b_token}"}
    resp = client.get("/api/v1/prescriptions/presc-1", headers=headers_b)
    assert resp.status_code == 403
    assert resp.json()["error_code"] == "FORBIDDEN"
