def test_list_hospitals_pagination(client):
    resp = client.get("/api/v1/hospitals?page=1&limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) >= 1
    assert "pagination" in data
    assert data["pagination"]["page"] == 1


def test_hospital_distance_and_filters(client):
    resp = client.get("/api/v1/hospitals?city=Springfield&user_lat=39.78&user_lon=-89.65")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["data"]) > 0
    assert data["data"][0]["distance_km"] is not None


def test_hospital_search(client):
    resp = client.get("/api/v1/hospitals/search?q=General")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert any("General" in h["name"] for h in data["data"])


def test_hospital_detail_with_departments_and_doctors(client):
    resp = client.get("/api/v1/hospitals/hosp-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["id"] == "hosp-1"
    assert "departments" in data["data"]
    assert "doctors" in data["data"]
