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

// Get stored user or null
export const initGuestAuth = async () => {
  return getStoredUser();
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (json.success && json.data?.access_token) {
    setAuthToken(json.data.access_token);
    if (json.data.user) {
      localStorage.setItem('auth_user', JSON.stringify(json.data.user));
    }
  }
  return json;
};

export const signupUser = async (payload) => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (json.success && json.data?.access_token) {
    setAuthToken(json.data.access_token);
    if (json.data.user) {
      localStorage.setItem('auth_user', JSON.stringify(json.data.user));
    }
  }
  return json;
};

export const oauthCallback = async (payload) => {
  const res = await fetch(`${API_BASE}/auth/oauth-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (json.success && json.data?.access_token) {
    setAuthToken(json.data.access_token);
    if (json.data.user) {
      localStorage.setItem('auth_user', JSON.stringify(json.data.user));
    }
  }
  return json;
};

export const fetchCurrentUser = async () => {
  if (!authToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: headers() });
    const json = await res.json();
    if (json.success && json.data) {
      localStorage.setItem('auth_user', JSON.stringify(json.data));
      return json.data;
    }
  } catch (e) {
    console.error('Failed to fetch current user:', e);
  }
  return getStoredUser();
};

export const logoutUser = () => {
  setAuthToken('');
  localStorage.removeItem('auth_user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

export const settlePrescription = async (payload, adminToken) => {
  const res = await fetch(`${API_BASE}/admin/prescribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken || authToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

// Hospital Secure Dedicated Portal
export const loginHospitalPortal = async (hospitalIdentifier, password) => {
  const res = await fetch(`${API_BASE}/hospital-portal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_identifier: hospitalIdentifier, password })
  });
  return res.json();
};

export const fetchHospitalDashboard = async (hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/dashboard`, {
    headers: { 'Authorization': `Bearer ${hospitalToken}` }
  });
  return res.json();
};

export const allotHospitalAppointment = async (appointmentId, payload, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/allot`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const prescribeHospitalPatient = async (appointmentId, payload, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/prescribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const updateHospitalPortalBeds = async (payload, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/beds`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const updateHospitalEmergencyCase = async (alertId, payload, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/emergency/${alertId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

// --- Doctor Rating & Verified Reviews ---
export const fetchDoctorReviews = async (doctorId) => {
  const token = getGuestToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/reviews`, { headers });
  return res.json();
};

export const submitDoctorRating = async (doctorId, payload) => {
  const token = getGuestToken();
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

// --- Appointment Completion & Resend Reminder ---
export const completeAppointment = async (appointmentId) => {
  const token = getGuestToken();
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

export const sendAppointmentReminder = async (appointmentId, recipientEmail = null) => {
  const token = getGuestToken();
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/send-reminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(recipientEmail ? { recipient_email: recipientEmail } : {})
  });
  return res.json();
};

// --- Doctor Referral & Caseload Balancing ---
export const referAppointmentDoctor = async (appointmentId, payload, adminToken) => {
  const res = await fetch(`${API_BASE}/admin/appointments/${appointmentId}/refer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const referHospitalAppointment = async (appointmentId, payload, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/refer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const completeHospitalAppointment = async (appointmentId, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${hospitalToken}` }
  });
  return res.json();
};

export const sendHospitalAppointmentReminder = async (appointmentId, hospitalToken, recipientEmail = null) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/send-reminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify({ recipient_email: recipientEmail })
  });
  return res.json();
};

export const cancelHospitalAppointment = async (appointmentId, reason, hospitalToken) => {
  const res = await fetch(`${API_BASE}/hospital-portal/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hospitalToken}`
    },
    body: JSON.stringify({ reason })
  });
  return res.json();
};




