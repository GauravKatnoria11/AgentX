def test_maps_route(client):
    resp = client.get("/api/v1/maps/route?origin=Springfield+Center&destination=City+General+Hospital")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["distance_km"] > 0
    assert len(data["data"]["steps"]) > 0


def test_maps_distance(client):
    resp = client.get("/api/v1/maps/distance?origin=Springfield+Center&destination=City+General+Hospital")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "distance_km" in data["data"]


def test_maps_eta(client):
    resp = client.get("/api/v1/maps/eta?origin=Springfield+Center&destination=City+General+Hospital")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "eta_timestamp" in data["data"]
    assert "suggested_departure_time" in data["data"]


def test_maps_reverse_geocode(client):
    resp = client.get("/api/v1/maps/reverse-geocode?lat=31.5312&lon=75.9184")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "formatted_address" in data["data"]
    assert data["data"]["latitude"] == 31.5312
    assert data["data"]["longitude"] == 75.9184

