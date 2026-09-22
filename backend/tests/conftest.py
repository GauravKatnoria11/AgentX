import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.security import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def patient_token():
    return create_access_token({
        "sub": "11111111-1111-1111-1111-111111111111",
        "role": "patient",
        "email": "patient@example.com",
        "full_name": "John Doe"
    })


@pytest.fixture
def patient_b_token():
    return create_access_token({
        "sub": "99999999-9999-9999-9999-999999999999",
        "role": "patient",
        "email": "patient_b@example.com",
        "full_name": "Jane Patient B"
    })


@pytest.fixture
def doctor_token():
    return create_access_token({
        "sub": "22222222-2222-2222-2222-222222222222",
        "role": "doctor",
        "email": "doctor@example.com",
        "full_name": "Dr. Sarah Adams"
    })


@pytest.fixture
def staff_token():
    return create_access_token({
        "sub": "33333333-3333-3333-3333-333333333333",
        "role": "staff",
        "email": "staff@example.com",
        "full_name": "Hospital Staff Mark"
    })


@pytest.fixture
def admin_token():
    return create_access_token({
        "sub": "44444444-4444-4444-4444-444444444444",
        "role": "admin",
        "email": "admin@example.com",
        "full_name": "System Administrator"
    })
