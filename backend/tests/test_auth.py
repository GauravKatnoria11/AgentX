def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_signup_and_login(client):
    email = "newpatient@test.com"
    signup_payload = {
        "email": email,
        "password": "strongPassword123!",
        "full_name": "Test Patient",
        "role": "patient",
        "phone": "+1234567890",
        "captcha_token": "test-token"
    }
    signup_resp = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_resp.status_code == 201
    data = signup_resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == email

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "strongPassword123!",
        "captcha_token": "test-token"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert login_data["success"] is True
    assert "access_token" in login_data["data"]


def test_auth_oauth_callback(client):
    resp = client.post("/api/v1/auth/oauth-callback", json={
        "provider": "google",
        "access_token": "oauth_sample_token_123",
        "email": "google_patient@gmail.com",
        "full_name": "Google User"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "google_patient@gmail.com"


def test_unauthorized_access_denied(client):
    # Without token
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401
    assert resp.json()["success"] is False
    assert resp.json()["error_code"] == "UNAUTHORIZED"
