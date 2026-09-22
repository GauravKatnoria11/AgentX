const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1';

// Default mock patient token for initial seamless viewing
let authToken = localStorage.getItem('auth_token') || '';

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

const headers = () => {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) {
    h['Authorization'] = `Bearer ${authToken}`;
  }
  return h;
};

// Initial auto-login for patient experience if no token
export const initGuestAuth = async () => {
  if (!authToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'patient@example.com', password: 'password123' })
      });
      const json = await res.json();
      if (json.success && json.data?.access_token) {
        setAuthToken(json.data.access_token);
        return json.data.user;
      }
    } catch (e) {
      console.warn('Backend login fallback:', e);
    }
  }
  return null;
};

// Hospitals
export const fetchHospitals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/hospitals?${query}`, { headers: headers() });
  return res.json();
};

export const searchHospitals = async (q) => {
  const res = await fetch(`${API_BASE}/hospitals/search?q=${encodeURIComponent(q)}`, { headers: headers() });
  return res.json();
};

export const fetchHospitalById = async (id) => {
  const res = await fetch(`${API_BASE}/hospitals/${id}`, { headers: headers() });
  return res.json();
};

// Doctors
export const fetchDoctors = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/doctors?${query}`, { headers: headers() });
  return res.json();
};

export const fetchDoctorById = async (id) => {
  const res = await fetch(`${API_BASE}/doctors/${id}`, { headers: headers() });
  return res.json();
};

export const fetchDoctorAvailability = async (id, checkDate) => {
  const url = checkDate ? `${API_BASE}/doctors/${id}/availability?check_date=${checkDate}` : `${API_BASE}/doctors/${id}/availability`;
  const res = await fetch(url, { headers: headers() });
  return res.json();
};

// Appointments
export const fetchMyAppointments = async () => {
  const res = await fetch(`${API_BASE}/appointments/my`, { headers: headers() });
  return res.json();
};

export const bookAppointment = async (payload) => {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const cancelAppointment = async (id, reason) => {
  const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ cancellation_reason: reason || 'Cancelled by user' })
  });
  return res.json();
};

// Labs & Diagnostics
export const fetchLabs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/labs?${query}`, { headers: headers() });
  return res.json();
};

export const fetchLabTests = async (category = '', q = '') => {
  let url = `${API_BASE}/labs/tests`;
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (q) params.append('q', q);
  const qStr = params.toString();
  if (qStr) url += `?${qStr}`;
  const res = await fetch(url, { headers: headers() });
  return res.json();
};

export const bookLabTest = async (payload) => {
  const res = await fetch(`${API_BASE}/labs/book`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload)
  });
  return res.json();
};


// Pharmacies & Medicines
export const fetchPharmacies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/pharmacies?${query}`, { headers: headers() });
  return res.json();
};

export const fetchMedicines = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/medicines?${query}`, { headers: headers() });
  return res.json();
};

// Prescriptions
export const fetchMyPrescriptions = async () => {
  const res = await fetch(`${API_BASE}/prescriptions/my`, { headers: headers() });
  return res.json();
};

// Medical Records
export const fetchMyMedicalRecords = async () => {
  const res = await fetch(`${API_BASE}/medical-records/my`, { headers: headers() });
  return res.json();
};

export const uploadMedicalRecord = async (payload) => {
  const res = await fetch(`${API_BASE}/medical-records/upload`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload)
  });
  return res.json();
};

// Follow-up Plans
export const fetchMyFollowups = async () => {
  const res = await fetch(`${API_BASE}/followups/my`, { headers: headers() });
  return res.json();
};

export const submitFollowupResponse = async (id, responses, severityScore) => {
  const res = await fetch(`${API_BASE}/followups/${id}/respond`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ responses, symptoms_severity_score: severityScore })
  });
  return res.json();
};

// Maps & Navigation
export const searchLocation = async (query = '') => {
  const res = await fetch(`${API_BASE}/maps/search-location?query=${encodeURIComponent(query)}`, {
    headers: headers()
  });
  return res.json();
};

export const fetchRoute = async (origin, destination, mode = 'driving') => {
  const res = await fetch(`${API_BASE}/maps/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`, {
    headers: headers()
  });
  return res.json();
};

export const fetchETA = async (origin, destination, mode = 'driving') => {
  const res = await fetch(`${API_BASE}/maps/eta?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`, {
    headers: headers()
  });
  return res.json();
};

// AI Services
export const aiSearch = async (query) => {
  const res = await fetch(`${API_BASE}/ai/search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query })
  });
  return res.json();
};

export const aiSymptomIntake = async (description, duration, severity) => {
  const res = await fetch(`${API_BASE}/ai/symptoms`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ symptoms_description: description, duration, severity })
  });
  return res.json();
};

export const aiSummarizeRecord = async (recordId, content) => {
  const res = await fetch(`${API_BASE}/ai/summarize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ record_id: recordId, content })
  });
  return res.json();
};

export const aiChat = async (message) => {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ message })
  });
  return res.json();
};

// Emergency Services
export const triggerEmergencySOS = async (payload) => {
  const res = await fetch(`${API_BASE}/emergency/sos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const fetchEmergencyAlerts = async () => {
  const res = await fetch(`${API_BASE}/emergency/alerts`, {
    headers: headers()
  });
  return res.json();
};

// Admin Portal APIs (Strictly for staff/admin role)
export const fetchAdminAnalytics = async (adminToken) => {
  const res = await fetch(`${API_BASE}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken || authToken}` }
  });
  return res.json();
};

export const fetchAdminQueue = async (adminToken) => {
  const res = await fetch(`${API_BASE}/admin/queue`, {
    headers: { 'Authorization': `Bearer ${adminToken || authToken}` }
  });
  return res.json();
};

export const fetchAdminAppointments = async (statusFilter, adminToken) => {
  const url = statusFilter ? `${API_BASE}/admin/appointments?status_filter=${statusFilter}` : `${API_BASE}/admin/appointments`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${adminToken || authToken}` }
  });
  return res.json();
};

export const allotAppointmentTiming = async (appointmentId, payload, adminToken) => {
  const res = await fetch(`${API_BASE}/admin/appointments/${appointmentId}/allot`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken || authToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const updateHospitalBeds = async (hospitalId, payload, adminToken) => {
  const res = await fetch(`${API_BASE}/admin/hospitals/${hospitalId}/beds`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken || authToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const updateEmergencyStatus = async (alertId, payload, adminToken) => {
  const res = await fetch(`${API_BASE}/admin/emergency/${alertId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken || authToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const fetchAdminAuditLogs = async (adminToken) => {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: { 'Authorization': `Bearer ${adminToken || authToken}` }
  });
  return res.json();
};

