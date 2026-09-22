def test_admin_endpoints_role_enforcement(client, patient_token, admin_token, staff_token):
    headers_patient = {"Authorization": f"Bearer {patient_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    headers_staff = {"Authorization": f"Bearer {staff_token}"}

    # 1. Patient tries to access admin analytics -> 403 Forbidden
    patient_res = client.get("/api/v1/admin/analytics", headers=headers_patient)
    assert patient_res.status_code == 403
    assert patient_res.json()["error_code"] == "FORBIDDEN"

    # 2. Patient tries to view audit logs -> 403 Forbidden
    patient_logs = client.get("/api/v1/admin/audit-logs", headers=headers_patient)
    assert patient_logs.status_code == 403

    # 3. Admin can access analytics
    admin_res = client.get("/api/v1/admin/analytics", headers=headers_admin)
    assert admin_res.status_code == 200
    assert admin_res.json()["success"] is True
    assert "total_patients" in admin_res.json()["data"]

    # 4. Admin and Staff can access queue
    admin_queue = client.get("/api/v1/admin/queue", headers=headers_admin)
    assert admin_queue.status_code == 200
    assert isinstance(admin_queue.json()["data"], list)

    staff_queue = client.get("/api/v1/admin/queue", headers=headers_staff)
    assert staff_queue.status_code == 200
    assert isinstance(staff_queue.json()["data"], list)

    # 5. Admin can view audit logs
    admin_logs = client.get("/api/v1/admin/audit-logs", headers=headers_admin)
    assert admin_logs.status_code == 200
    assert isinstance(admin_logs.json()["data"], list)
