def test_list_pharmacies(client):
    resp = client.get("/api/v1/pharmacies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert len(data["data"]) >= 5


def test_pharmacy_and_medicine_availability_search(client):
    # Search medicines for Ivy 24/7 Pharmacy
    resp = client.get("/api/v1/medicines?pharmacy_id=pharm-hsp-1")
    assert resp.status_code == 200
    meds = resp.json()["data"]
    assert len(meds) > 0
    
    # Check that in-stock and out-of-stock items exist with stock_units
    in_stock_med = next((m for m in meds if m["in_stock"] is True), None)
    out_of_stock_med = next((m for m in meds if m["in_stock"] is False), None)
    assert in_stock_med is not None
    assert in_stock_med["stock_units"] > 0
    assert out_of_stock_med is not None
    assert out_of_stock_med["stock_units"] == 0

    # Search specific drug in that pharmacy
    search_resp = client.get("/api/v1/medicines?pharmacy_id=pharm-hsp-1&search=atorvastatin")
    assert search_resp.status_code == 200
    results = search_resp.json()["data"]
    assert any("atorvastatin" in m["name"].lower() for m in results)
