def test_list_doctors_with_specialization_filter(client):
    resp = client.get("/api/v1/doctors?specialization=Cardiology")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    assert "Cardiology" in data["data"][0]["specialization"]


def test_doctor_availability_slots(client):
    resp = client.get("/api/v1/doctors/doc-1/availability?check_date=2026-09-28")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    avail = data["data"]
    assert avail["doctor_id"] == "doc-1"
    assert isinstance(avail["available_slots"], list)
    assert len(avail["available_slots"]) > 0
