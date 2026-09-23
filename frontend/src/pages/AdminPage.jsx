import React, { useState, useEffect } from 'react';
import { Shield, Activity, Users, Building2, Calendar, ClipboardList, PlusCircle, CheckCircle2, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { fetchAdminAnalytics, fetchAdminQueue, fetchAdminAuditLogs, setAuthToken, API_BASE } from '../api';

export default function AdminPage({ onExitAdmin }) {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [queue, setQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'analytics' | 'audit' | 'new-hospital'
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@example.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // New Hospital Form
  const [hospName, setHospName] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospCity, setHospCity] = useState('Springfield');
  const [hospPhone, setHospPhone] = useState('+1-217-555-0900');
  const [hospType, setHospType] = useState('Super-Specialty');
  const [hospCreated, setHospCreated] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        setAdminToken(data.data.access_token);
        setIsAuthenticated(true);
        loadAdminData(data.data.access_token);
      } else {
        setLoginError('Invalid administrator credentials.');
      }
    } catch (e) {
      setLoginError('Failed to authenticate with admin server.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async (token) => {
    try {
      const [anRes, qRes, logRes] = await Promise.all([
        fetchAdminAnalytics(token),
        fetchAdminQueue(token),
        fetchAdminAuditLogs(token)
      ]);
      if (anRes.success) setAnalytics(anRes.data);
      if (qRes.success) setQueue(qRes.data || []);
      if (logRes.success) setAuditLogs(logRes.data || []);
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/hospitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: hospName,
          address: hospAddress,
          city: hospCity,
          state: 'IL',
          phone: hospPhone,
          type: hospType,
          latitude: 39.78,
          longitude: -89.65,
          emergency_available: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setHospCreated(true);
        setHospName('');
        setHospAddress('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '420px', margin: '60px auto', padding: '20px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-blue)', marginBottom: '8px' }}>
            <Shield size={24} />
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Hospital Staff & Admin Gateway</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Restricted access portal for authorized hospital operations and administrators.
          </p>

          {loginError && (
            <div style={{ padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '12px', marginBottom: '14px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Admin Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign in to Admin Dashboard'}
            </button>
          </form>

          <button
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            onClick={onExitAdmin}
          >
            <ArrowLeft size={14} /> Back to Carelink
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="pill-badge blue">Admin Security Level: Active</span>
            <h2 className="section-title">Hospital Administration & Operations</h2>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Managing live queues, facility onboarding, analytics, and compliance audit logs
          </div>
        </div>

        <button className="btn-secondary" onClick={onExitAdmin}>
          <ArrowLeft size={14} /> Exit Admin View
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          className={`pill-badge ${activeTab === 'queue' ? 'blue' : ''}`}
          style={{ cursor: 'pointer', padding: '8px 18px', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveTab('queue')}
        >
          <Users size={14} /> Live Patient Queue ({queue.length})
        </button>

        <button
          className={`pill-badge ${activeTab === 'analytics' ? 'blue' : ''}`}
          style={{ cursor: 'pointer', padding: '8px 18px', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveTab('analytics')}
        >
          <Activity size={14} /> Platform Metrics
        </button>

        <button
          className={`pill-badge ${activeTab === 'audit' ? 'blue' : ''}`}
          style={{ cursor: 'pointer', padding: '8px 18px', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveTab('audit')}
        >
          <ClipboardList size={14} /> Audit Trail ({auditLogs.length})
        </button>

        <button
          className={`pill-badge ${activeTab === 'new-hospital' ? 'blue' : ''}`}
          style={{ cursor: 'pointer', padding: '8px 18px', border: '1px solid var(--border-subtle)' }}
          onClick={() => setActiveTab('new-hospital')}
        >
          <PlusCircle size={14} /> Register Hospital
        </button>
      </div>

      {/* 1. Live Patient Queue */}
      {activeTab === 'queue' && (
        <div className="table-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
            Live Hospital Arrival Queue
          </h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>QUEUE #</th>
                <th>PATIENT</th>
                <th>DOCTOR</th>
                <th>DEPARTMENT</th>
                <th>APPOINTMENT TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>#{q.queue_number}</td>
                  <td style={{ fontWeight: 600 }}>{q.patient_name}</td>
                  <td>{q.doctor_name}</td>
                  <td>{q.department_name}</td>
                  <td><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {q.appointment_time}</td>
                  <td>
                    <span className={`pill-badge ${q.status === 'confirmed' ? 'green' : 'blue'}`}>
                      ● {q.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Patients</div>
            <div className="stat-value">{analytics.total_patients}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Doctors</div>
            <div className="stat-value">{analytics.total_doctors}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Affiliated Hospitals</div>
            <div className="stat-value">{analytics.total_hospitals}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Consultations Booked</div>
            <div className="stat-value">{analytics.total_appointments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Follow-up Plans</div>
            <div className="stat-value">{analytics.active_followups}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clinical Flags Awaiting Review</div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>{analytics.pending_reviews}</div>
          </div>
        </div>
      )}

      {/* 3. Audit Logs */}
      {activeTab === 'audit' && (
        <div className="table-card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
            HIPAA-Compliant Operational Audit Trail
          </h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTION</th>
                <th>RESOURCE TYPE</th>
                <th>RESOURCE ID</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.created_at?.slice(0, 19).replace('T', ' ')}</td>
                  <td style={{ fontWeight: 600 }}>{log.action}</td>
                  <td>{log.resource_type}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.resource_id?.slice(0, 10)}...</td>
                  <td style={{ fontSize: '12px' }}>{JSON.stringify(log.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Add Hospital */}
      {activeTab === 'new-hospital' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Onboard New Hospital Facility</h3>
          {hospCreated && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Hospital created and integrated into real database.
            </div>
          )}
          <form onSubmit={handleAddHospital} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Facility Name</label>
              <input
                type="text"
                value={hospName}
                onChange={(e) => setHospName(e.target.value)}
                required
                placeholder="e.g. St. Luke Medical Center"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Street Address</label>
              <input
                type="text"
                value={hospAddress}
                onChange={(e) => setHospAddress(e.target.value)}
                required
                placeholder="e.g. 500 Healthcare Blvd"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>City</label>
                <input
                  type="text"
                  value={hospCity}
                  onChange={(e) => setHospCity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Phone</label>
                <input
                  type="text"
                  value={hospPhone}
                  onChange={(e) => setHospPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              Register Facility
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
