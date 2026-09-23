def test_ai_natural_language_search(client):
    resp = client.post("/api/v1/ai/search", json={
        "query": "Find a nearby hospital for heart treatment"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["intent"]["department"] == "Cardiology"
    assert len(data["data"]["hospitals"]) > 0


def test_ai_symptom_intake_without_diagnosis(client):
    resp = client.post("/api/v1/ai/symptoms", json={
        "symptoms_description": "I have headache and dizziness since yesterday",
        "duration": "1 day"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    # Mandatory Safety Rule: Warning notice present and no clinical diagnosis claim
    assert "NOT a clinical diagnosis" in data["data"]["warning_notice"]
    assert "Neurology" in data["data"]["suggested_departments"]


def test_ai_healthcare_chat(client):
    # Standard FAQ
    resp = client.post("/api/v1/ai/chat", json={
        "message": "What are the visiting hours for the hospital?"
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert "reply" in resp.json()["data"]

    # Prescription prohibition test
    presc_query_resp = client.post("/api/v1/ai/chat", json={
        "message": "what medicine should i take for chest infection?"
    })
    assert presc_query_resp.status_code == 200
    reply = presc_query_resp.json()["data"]["reply"]
    assert "not authorized to prescribe" in reply.lower() or "physician" in reply.lower()


def test_ai_disease_cost_prediction(client):
    resp = client.post("/api/v1/ai/search", json={
        "query": "Knee arthritis and joint replacement cost"
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "estimated_cost" in data
    assert data["estimated_cost"] is not None
    assert "Knee" in data["estimated_cost"]["condition_or_procedure"]
    assert "Ayushman Bharat" in str(data["estimated_cost"]["government_schemes_coverage"])

