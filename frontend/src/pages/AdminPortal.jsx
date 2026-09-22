import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Bed,
  Building2,
  Users,
  Activity,
  FileText,
  Search,
  ArrowLeft,
  UserCheck,
  PhoneCall,
  Save,
  X,
  Plus,
  Minus,
  RefreshCw,
  Pill,
  Utensils,
  Sun,
  Moon,
  Sunset,
  Coffee
} from 'lucide-react';
import {
  fetchAdminAnalytics,
  fetchAdminQueue,
  fetchAdminAppointments,
  allotAppointmentTiming,
  updateHospitalBeds,
  updateEmergencyStatus,
  fetchEmergencyAlerts,
  fetchAdminAuditLogs,
  fetchHospitals,
  fetchDoctors,
  settlePrescription
} from '../api';

export default function AdminPortal({ onExitAdmin }) {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@example.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'emergency' | 'beds' | 'queue' | 'analytics' | 'audit'

  // Admin Data State
  const [appointments, setAppointments] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Timing Allotment Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [allotDate, setAllotDate] = useState('2026-09-25');
  const [allotTime, setAllotTime] = useState('10:00:00');
  const [allotDoctorId, setAllotDoctorId] = useState('');
  const [allotQueueNumber, setAllotQueueNumber] = useState(1);
  const [allotNotes, setAllotNotes] = useState('');
  const [allotSuccessMessage, setAllotSuccessMessage] = useState('');
  const [isSubmittingAllotment, setIsSubmittingAllotment] = useState(false);

  // Status Filter for Appointments
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // 'all' | 'pending' | 'confirmed'

  // Doctor Prescription & Diet Plan State
  const [selectedPrescribeApp, setSelectedPrescribeApp] = useState(null);
  const [prescDiseaseCategory, setPrescDiseaseCategory] = useState('Cardiovascular & Hypertension');
  const [prescTitle, setPrescTitle] = useState('Cardiology Regimen & Pharmacotherapy');
  const [prescDiagnosis, setPrescDiagnosis] = useState('Mild Hypertension with Dyslipidemia');
  const [prescMedicines, setPrescMedicines] = useState([
    {
      name: 'Telmisartan 40mg',
      dosage: '1 Tablet',
      timing: { morning: true, afternoon: false, evening: false, night: false },
      timing_label: 'Morning (🌅)',
      meal_relation: 'After Breakfast',
      duration: '30 Days',
      instructions: 'Take with warm water at fixed morning time'
    },
    {
      name: 'Atorvastatin 20mg',
      dosage: '1 Tablet',
      timing: { morning: false, afternoon: false, evening: false, night: true },
      timing_label: 'Night (🌙)',
      meal_relation: 'After Dinner',
      duration: '30 Days',
      instructions: 'Take right before bedtime'
    }
  ]);
  const [prescDietPlan, setPrescDietPlan] = useState({
    title: 'Heart-Healthy Low Sodium Diet Plan',
    breakfast: '1 bowl steel-cut oats with almonds + 1 boiled apple',
    lunch: '2 whole-wheat rotis, spinach dal, steamed lauki, cucumber salad',
    evening_snack: 'Roasted makhana + green tea',
    dinner: 'Moong dal khichdi / soup (have before 8:00 PM)',
    foods_to_avoid: 'Pickles, Papad, Fried Pakoras, High Sodium Namkeen',
    hydration_advice: '2.5 to 3 Liters water daily',
    doctor_notes: '30 mins morning walk, monitor BP every Monday'
  });
  const [prescNotes, setPrescNotes] = useState('');
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);
  const [prescribeSuccessMessage, setPrescribeSuccessMessage] = useState('');

  useEffect(() => {
    // If we have an admin token, attempt to verify
    if (adminToken) {
      setIsAuthenticated(true);
      loadDashboardData(adminToken);
    } else {
      // Auto-login for admin convenience
      handleAutoAdminLogin();
    }
  }, []);

  const handleAutoAdminLogin = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
      });
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        setAdminToken(data.data.access_token);
        localStorage.setItem('admin_token', data.data.access_token);
        setIsAuthenticated(true);
        loadDashboardData(data.data.access_token);
      }
    } catch (e) {
      console.warn('Auto admin login fallback:', e);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success && data.data?.access_token) {
        setAdminToken(data.data.access_token);
        localStorage.setItem('admin_token', data.data.access_token);
        setIsAuthenticated(true);
        loadDashboardData(data.data.access_token);
      } else {
        setLoginError('Invalid administrator credentials.');
      }
    } catch (e) {
      setLoginError('Failed to authenticate with management server.');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (token) => {
    setLoading(true);
    try {
      const [appRes, emRes, hospRes, docRes, qRes, anRes, logRes] = await Promise.all([
        fetchAdminAppointments(null, token),
        fetchEmergencyAlerts(),
        fetchHospitals(),
        fetchDoctors(),
        fetchAdminQueue(token),
        fetchAdminAnalytics(token),
        fetchAdminAuditLogs(token)
      ]);

      if (appRes?.success) setAppointments(appRes.data || []);
      if (emRes?.success) setEmergencyAlerts(emRes.data || []);
      if (hospRes?.success) setHospitals(hospRes.data || []);
      if (docRes?.success) setDoctors(docRes.data || []);
      if (qRes?.success) setQueue(qRes.data || []);
      if (anRes?.success) setAnalytics(anRes.data || null);
      if (logRes?.success) setAuditLogs(logRes.data || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Open Allotment Modal for a specific appointment
  const handleOpenAllotModal = (app) => {
    setSelectedAppointment(app);
    setAllotDate(app.appointment_date || '2026-09-25');
    setAllotTime(app.appointment_time || '10:00:00');
    setAllotDoctorId(app.doctor_id || (doctors[0]?.id || ''));
    setAllotQueueNumber(app.queue_number || (appointments.filter(a => a.appointment_date === app.appointment_date).length + 1));
    setAllotNotes(app.notes || 'Confirmed by Medical Superintendent Desk');
    setAllotSuccessMessage('');
  };

  // Submit Allotment
  const handleSubmitAllotment = async (e) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    setIsSubmittingAllotment(true);
    try {
      const payload = {
        appointment_date: allotDate,
        appointment_time: allotTime,
        doctor_id: allotDoctorId || selectedAppointment.doctor_id,
        queue_number: parseInt(allotQueueNumber, 10) || 1,
        admin_notes: allotNotes
      };

      const res = await allotAppointmentTiming(selectedAppointment.id, payload, adminToken);
      if (res.success) {
        setAllotSuccessMessage(`Timing allotted! Confirmed for ${allotDate} at ${allotTime.slice(0, 5)} (Queue #${payload.queue_number})`);
        // Refresh appointment list
        const updated = await fetchAdminAppointments(null, adminToken);
        if (updated?.success) setAppointments(updated.data || []);
        setTimeout(() => {
          setSelectedAppointment(null);
          setAllotSuccessMessage('');
        }, 1500);
      }
    } catch (e) {
      console.error('Failed to allot appointment timing:', e);
    } finally {
      setIsSubmittingAllotment(false);
    }
  };

  // Open Prescribe Modal for a specific appointment
  const handleOpenPrescribeModal = (app) => {
    setSelectedPrescribeApp(app);
    const reasonLower = (app?.reason || '').toLowerCase();
    const isOrtho = reasonLower.includes('knee') || reasonLower.includes('joint') || reasonLower.includes('arthritis') || reasonLower.includes('bone');
    const isDiabetes = reasonLower.includes('sugar') || reasonLower.includes('diabetes') || reasonLower.includes('glucose');

    let disease = 'Cardiovascular & Hypertension';
    let title = 'Cardiology Consultation & Pharmacotherapy';
    let diagnosis = 'Mild Hypertension with Dyslipidemia';
    let meds = [
      {
        name: 'Telmisartan 40mg',
        dosage: '1 Tablet',
        timing: { morning: true, afternoon: false, evening: false, night: false },
        timing_label: 'Morning (🌅)',
        meal_relation: 'After Breakfast',
        duration: '30 Days',
        instructions: 'Take with warm water at fixed morning time'
      },
      {
        name: 'Atorvastatin 20mg',
        dosage: '1 Tablet',
        timing: { morning: false, afternoon: false, evening: false, night: true },
        timing_label: 'Night (🌙)',
        meal_relation: 'After Dinner',
        duration: '30 Days',
        instructions: 'Take right before bedtime'
      }
    ];
    let diet = {
      title: 'Heart-Healthy Low Sodium Diet Plan',
      breakfast: '1 bowl steel-cut oats with almonds + 1 boiled apple',
      lunch: '2 whole-wheat rotis, spinach dal, steamed lauki, cucumber salad',
      evening_snack: 'Roasted makhana + green tea',
      dinner: 'Moong dal khichdi / soup (have before 8:00 PM)',
      foods_to_avoid: 'Pickles, Papad, Fried Pakoras, High Sodium Namkeen',
      hydration_advice: '2.5 to 3 Liters water daily',
      doctor_notes: '30 mins morning walk, monitor BP every Monday'
    };

    if (isOrtho) {
      disease = 'Orthopedics & Joint Trauma';
      title = 'Knee Osteoarthritis & Joint Care Regimen';
      diagnosis = 'Grade-2 Bilateral Knee Osteoarthritis';
      meds = [
        {
          name: 'Glucosamine Sulfate 500mg',
          dosage: '1 Capsule',
          timing: { morning: true, afternoon: false, evening: true, night: false },
          timing_label: 'Morning & Evening (🌅 🌆)',
          meal_relation: 'After Food',
          duration: '60 Days',
          instructions: 'Joint cartilage protection'
        },
        {
          name: 'Calcium Citrate + Vitamin D3',
          dosage: '1 Tablet',
          timing: { morning: true, afternoon: false, evening: false, night: false },
          timing_label: 'Morning (🌅)',
          meal_relation: 'After Breakfast',
          duration: '30 Days',
          instructions: 'Take with warm milk'
        }
      ];
      diet = {
        title: 'Anti-inflammatory & Bone Density Protocol',
        breakfast: 'Sprouted moong & chana bowl + warm fortified milk',
        lunch: 'Bajra / Jowar roti, low-fat palak paneer, curd with flaxseed',
        evening_snack: 'Soaked almonds, walnuts, warm turmeric milk',
        dinner: 'Vegetable stew with paneer/tofu and pumpkin soup',
        foods_to_avoid: 'Refined sugar, bakery maida biscuits, inflammatory trans-fats',
        hydration_advice: '3 Liters water daily',
        doctor_notes: 'Static isometric knee exercises 15 mins morning and evening'
      };
    } else if (isDiabetes) {
      disease = 'Type-2 Diabetes & Endocrine';
      title = 'Glycemic Stabilization & Endocrine Regimen';
      diagnosis = 'Type-2 Diabetes Mellitus with elevated HbA1c';
      meds = [
        {
          name: 'Metformin 500mg SR',
          dosage: '1 Tablet',
          timing: { morning: true, afternoon: false, evening: true, night: false },
          timing_label: 'Morning & Evening (🌅 🌆)',
          meal_relation: 'With Meals',
          duration: '90 Days',
          instructions: 'Take halfway through meals'
        }
      ];
      diet = {
        title: 'Low Glycemic Index (GI) Diabetic Protocol',
        breakfast: 'Besan chilla or methi paratha without oil + green chutney',
        lunch: '1 small bowl brown rice, yellow moong dal, bitter gourd (karela)',
        evening_snack: 'Roasted chana + chia seeds in water',
        dinner: 'Clear vegetable soup + 1 multigrain chapati',
        foods_to_avoid: 'Refined sweets (mithai), white bread, fruit juices with sugar',
        hydration_advice: 'Methi dana lukewarm water first thing in the morning',
        doctor_notes: 'Check fasting glucose weekly. 45 mins morning walk.'
      };
    }

    setPrescDiseaseCategory(disease);
    setPrescTitle(title);
    setPrescDiagnosis(diagnosis);
    setPrescMedicines(meds);
    setPrescDietPlan(diet);
    setPrescNotes(`Appointment #${app.id} clinical consultation.`);
    setPrescribeSuccessMessage('');
  };

  const handleAddMedicine = () => {
    setPrescMedicines(prev => [
      ...prev,
      {
        name: '',
        dosage: '1 Tablet',
        timing: { morning: true, afternoon: false, evening: true, night: false },
        timing_label: 'Morning & Evening (🌅 🌆)',
        meal_relation: 'After Food',
        duration: '30 Days',
        instructions: ''
      }
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setPrescMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTimingToggle = (idx, timingKey) => {
    setPrescMedicines(prev => prev.map((med, i) => {
      if (i !== idx) return med;
      const updatedTiming = { ...med.timing, [timingKey]: !med.timing[timingKey] };
      const activeKeys = Object.keys(updatedTiming).filter(k => updatedTiming[k]);
      let label = activeKeys.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' & ');
      if (activeKeys.length === 0) label = 'As Directed / SOS';
      return {
        ...med,
        timing: updatedTiming,
        timing_label: label
      };
    }));
  };

  const handleMedicineChange = (idx, field, value) => {
    setPrescMedicines(prev => prev.map((med, i) => i === idx ? { ...med, [field]: value } : med));
  };

  const handleDietChange = (field, value) => {
    setPrescDietPlan(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedPrescribeApp) return;
    setIsSubmittingPrescription(true);
    try {
      const avoidList = (prescDietPlan.foods_to_avoid || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        appointment_id: selectedPrescribeApp.id,
        patient_id: selectedPrescribeApp.patient_id,
        doctor_id: selectedPrescribeApp.doctor_id,
        hospital_id: selectedPrescribeApp.hospital_id,
        disease_category: prescDiseaseCategory,
        title: prescTitle,
        diagnosis: prescDiagnosis,
        medicines: prescMedicines,
        diet_plan: {
          ...prescDietPlan,
          foods_to_avoid: avoidList
        },
        notes: prescNotes
      };

      const res = await settlePrescription(payload, adminToken);
      if (res.success) {
        setPrescribeSuccessMessage(`Medical regimen and diet plan settled for ${selectedPrescribeApp.patient_name || 'Patient'} (${prescDiseaseCategory})!`);
        const updated = await fetchAdminAppointments(null, adminToken);
        if (updated?.success) setAppointments(updated.data || []);
        setTimeout(() => {
          setSelectedPrescribeApp(null);
          setPrescribeSuccessMessage('');
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to settle prescription:', err);
    } finally {
      setIsSubmittingPrescription(false);
    }
  };

  // Adjust Hospital ICU beds
  const handleBedAdjust = async (hospitalId, delta) => {
    const hosp = hospitals.find(h => h.id === hospitalId);
    if (!hosp) return;
    const newIcu = Math.max(0, (hosp.available_icu_beds || 0) + delta);
    try {
      const res = await updateHospitalBeds(hospitalId, { available_icu_beds: newIcu }, adminToken);
      if (res.success) {
        setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, available_icu_beds: newIcu } : h));
      }
    } catch (e) {
      console.error('Failed to update hospital beds:', e);
    }
  };

  // Update Emergency Alert Status
  const handleUpdateEmergencyStatus = async (alertId, newStatus) => {
    try {
      const res = await updateEmergencyStatus(alertId, { status: newStatus }, adminToken);
      if (res.success) {
        setEmergencyAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
      }
    } catch (e) {
      console.error('Failed to update emergency alert status:', e);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (appointmentFilter === 'pending') return a.status === 'pending';
    if (appointmentFilter === 'confirmed') return a.status === 'confirmed';
    return true;
  });

  // If not authenticated, render login view
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1329', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: '#111c38', border: '1px solid #1e293b', borderRadius: '16px', padding: '36px', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#3b82f6', padding: '10px', borderRadius: '10px', color: '#ffffff' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Command Console</h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Hoshiarpur District Health Operations</div>
            </div>
          </div>

          {loginError && (
            <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', color: '#fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ADMIN EMAIL
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                SECURITY ACCESS KEY
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '14px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '14px',
                borderRadius: '8px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Authenticating...' : 'Authenticate & Enter Console'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={onExitAdmin}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
            >
              <ArrowLeft size={14} /> Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Dedicated Executive Sidebar */}
      <aside style={{ width: '270px', background: '#080d1a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#2563eb', padding: '8px', borderRadius: '8px' }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
                HealthNexus Admin
              </div>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>
                Hoshiarpur District Operations
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { id: 'appointments', label: 'Appointment Requests & Allotment', icon: Calendar, badge: appointments.filter(a => a.status === 'pending').length },
            { id: 'prescriptions', label: 'Prescribe Medicines & Diet Plan', icon: Pill },
            { id: 'emergency', label: 'Emergency SOS Console', icon: Flame, badge: emergencyAlerts.length, badgeColor: '#dc2626' },
            { id: 'beds', label: 'Hospitals & ICU Beds', icon: Bed },
            { id: 'queue', label: 'Live Clinic Queue', icon: Clock },
            { id: 'analytics', label: 'District Analytics', icon: Activity },
            { id: 'audit', label: 'Security & Audit Logs', icon: FileText }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} color={isActive ? '#60a5fa' : '#64748b'} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      background: item.badgeColor || '#eab308',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
            LOGGED IN AS SUPER ADMIN
          </div>
          <button
            onClick={onExitAdmin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: '#1e293b',
              color: '#f8fafc',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={15} /> Return to Patient View
          </button>
        </div>
      </aside>

      {/* Main Admin Content Wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{ height: '70px', background: '#0d1527', borderBottom: '1px solid #1e293b', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {activeTab === 'appointments' && 'Incoming Patient Appointment Requests'}
              {activeTab === 'prescriptions' && 'Doctor Prescribe Medicine Regimen & Diet Plan Studio'}
              {activeTab === 'emergency' && 'Live District Emergency SOS Monitor'}
              {activeTab === 'beds' && 'Hoshiarpur Hospital & ICU Bed Allocation'}
              {activeTab === 'queue' && 'Daily Outpatient Queue Manager'}
              {activeTab === 'analytics' && 'District Healthcare Telemetry'}
              {activeTab === 'audit' && 'System Audit Trail & Security Ledger'}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Restricted Administrative Gateway • All actions cryptographically logged
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => loadDashboardData(adminToken)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              Live Server Connected
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: '32px', flex: 1 }}>
          {/* TAB 1: APPOINTMENTS & TIMING ALLOTMENT */}
          {activeTab === 'appointments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: `All Requests (${appointments.length})` },
                    { id: 'pending', label: `Pending Allotment (${appointments.filter(a => a.status === 'pending').length})` },
                    { id: 'confirmed', label: `Confirmed (${appointments.filter(a => a.status === 'confirmed').length})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAppointmentFilter(f.id)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: appointmentFilter === f.id ? '#2563eb' : '#1e293b',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  💡 Click <strong>"Allot Timing & Assign Doctor"</strong> to confirm slot and issue queue token to patient.
                </div>
              </div>

              {/* Table */}
              <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#0c152a', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '14px 20px' }}>Patient Details</th>
                      <th style={{ padding: '14px 20px' }}>Hospital & Department</th>
                      <th style={{ padding: '14px 20px' }}>Requested Schedule</th>
                      <th style={{ padding: '14px 20px' }}>Assigned Specialist</th>
                      <th style={{ padding: '14px 20px' }}>Status / Queue</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No appointment requests found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((app) => {
                        const isPending = app.status === 'pending';
                        return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>
                                {app.patient_name || 'Patient'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {app.patient_phone || '+91-98765-XXXXX'}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ color: '#93c5fd', fontWeight: 600 }}>{app.hospital_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{app.appointment_type || 'Consultation'}</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ color: '#ffffff', fontWeight: 600 }}>
                                📅 {app.appointment_date}
                              </div>
                              <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                                ⏰ {app.appointment_time ? app.appointment_time.slice(0, 5) : 'Unallocated'}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ color: '#ffffff' }}>{app.doctor_name || 'Assigned by Admin'}</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: isPending ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isPending ? '#facc15' : '#34d399',
                                    border: `1px solid ${isPending ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                  }}
                                >
                                  {isPending ? '● Pending Allotment' : '✓ Confirmed'}
                                </span>
                                {app.queue_number && (
                                  <span style={{ fontSize: '11px', background: '#1e293b', padding: '2px 8px', borderRadius: '6px', color: '#93c5fd', fontWeight: 700 }}>
                                    Token #{app.queue_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleOpenAllotModal(app)}
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: isPending ? '#2563eb' : '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  {isPending ? 'Allot Timing' : 'Reschedule'}
                                </button>
                                <button
                                  onClick={() => handleOpenPrescribeModal(app)}
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #10b981',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <Pill size={13} /> Prescribe Regimen
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PRESCRIPTIONS & DIET PLAN STUDIO */}
          {activeTab === 'prescriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Introduction Banner */}
              <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: '14px', padding: '20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: '#10b981', padding: '10px', borderRadius: '10px', color: '#ffffff' }}>
                    <Pill size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Doctor Pharmacotherapy & Clinical Diet Studio</h3>
                    <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }}>
                      Settle pill schedules (morning, evening, night) and customized diet plans categorized by appointment and disease.
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700 }}>
                  🩺 Ready to Prescribe
                </div>
              </div>

              {/* Patient Appointment Selection Cards */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="#60a5fa" /> Select Patient Appointment to Prescribe:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {appointments.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        background: '#111c38',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '11px', background: '#1e293b', color: '#93c5fd', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            Appointment #{app.id}
                          </span>
                          <span style={{ fontSize: '11px', color: app.prescription_id ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
                            {app.prescription_id ? '✓ Prescribed' : '● Needs Prescription'}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '8px' }}>
                          {app.patient_name || 'Patient'}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          ☎ {app.patient_phone || '+91-98765-XXXXX'} • {app.hospital_name}
                        </div>

                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px', background: '#0b1329', padding: '8px 10px', borderRadius: '8px' }}>
                          <strong>Reason / Condition:</strong> {app.reason || 'General Followup'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenPrescribeModal(app)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10b981',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Pill size={15} /> Open Medicine & Diet Studio
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY SOS DISPATCH CONSOLE */}
          {activeTab === 'emergency' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '12px', padding: '16px 20px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Flame size={24} color="#fca5a5" />
                  <div>
                    <strong style={{ fontSize: '15px' }}>District 108 Emergency Dispatch Live Feed</strong>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Priority triage alerts dispatched to Hoshiarpur Civil Hospital and specialty trauma centers.</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '9999px' }}>
                  {emergencyAlerts.length} Active Incident(s)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {emergencyAlerts.map((alert) => (
                  <div key={alert.id} style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ background: '#dc2626', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
                          🚨 CODE RED EMERGENCY
                        </span>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px 0' }}>
                          {alert.emergency_type}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Patient: <strong>{alert.patient_name}</strong> • ☎ {alert.phone}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                        ETA ~{alert.eta_minutes || 5} min
                      </span>
                    </div>

                    <div style={{ background: '#0a0f1d', borderRadius: '8px', padding: '12px', marginTop: '14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ color: '#cbd5e1' }}>
                        📍 Incident Location: <strong style={{ color: '#ffffff' }}>{alert.current_location}</strong>
                      </div>
                      <div style={{ color: '#cbd5e1' }}>
                        🏥 Assigned Hospital: <strong style={{ color: '#60a5fa' }}>{alert.hospital_name}</strong>
                      </div>
                      {alert.notes && (
                        <div style={{ color: '#fca5a5' }}>
                          ⚠️ Notes: {alert.notes}
                        </div>
                      )}
                    </div>

                    {/* Status Changer */}
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Status:</span>
                      <select
                        value={alert.status}
                        onChange={(e) => handleUpdateEmergencyStatus(alert.id, e.target.value)}
                        style={{
                          background: '#1e293b',
                          color: '#ffffff',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        <option value="ambulance_dispatched">Ambulance Dispatched</option>
                        <option value="en_route">En Route to Incident</option>
                        <option value="patient_picked">Patient Onboard / Vitals Stable</option>
                        <option value="arrived_er">Arrived at Hospital ER</option>
                        <option value="icu_admitted">Admitted to Trauma ICU</option>
                        <option value="resolved">Resolved / Discharged</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HOSPITALS & ICU BED ALLOCATION */}
          {activeTab === 'beds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                Real-time bed availability control across Hoshiarpur healthcare facilities. Changes reflect instantly on patient discovery views and emergency routing.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {hospitals.map((hosp) => (
                  <div key={hosp.id} style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700 }}>
                          {hosp.type}
                        </span>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                          {hosp.name}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {hosp.address}, {hosp.city}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '16px', background: '#0b1222', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                            Available ICU Beds
                          </div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: '#34d399' }}>
                            {hosp.available_icu_beds || 0}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            of {hosp.total_beds} total beds
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleBedAdjust(hosp.id, -1)}
                            disabled={!hosp.available_icu_beds || hosp.available_icu_beds <= 0}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              background: '#1e293b',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 800
                            }}
                          >
                            <Minus size={16} />
                          </button>
                          <button
                            onClick={() => handleBedAdjust(hosp.id, 1)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              background: '#2563eb',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 800
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUEUE MANAGER */}
          {activeTab === 'queue' && (
            <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Today's Outpatient Arrival Queue</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Live Room & Token Allocations</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0c152a', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 20px' }}>Token #</th>
                    <th style={{ padding: '14px 20px' }}>Patient Name</th>
                    <th style={{ padding: '14px 20px' }}>Doctor & Department</th>
                    <th style={{ padding: '14px 20px' }}>Slot Time</th>
                    <th style={{ padding: '14px 20px' }}>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        No patients in active queue right now.
                      </td>
                    </tr>
                  ) : (
                    queue.map((q) => (
                      <tr key={q.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: '#38bdf8' }}>
                          #{q.queue_number}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#ffffff' }}>
                          {q.patient_name}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>
                          {q.doctor_name}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#ffffff' }}>
                          {q.appointment_time}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: DISTRICT ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Registered Patients</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', marginTop: '8px' }}>{analytics.total_patients}</div>
                <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>↑ Active Hoshiarpur Directory</div>
              </div>
              <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Verified Doctors</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#60a5fa', marginTop: '8px' }}>{analytics.total_doctors}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Across 7 Facilities</div>
              </div>
              <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Appointments Handled</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#facc15', marginTop: '8px' }}>{analytics.total_appointments}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Scheduled & Completed</div>
              </div>
              <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Beds in Network</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#34d399', marginTop: '8px' }}>{analytics.total_beds_in_system}</div>
                <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>{analytics.total_icu_beds_available} ICU Beds Free</div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Cryptographic Audit Trail</h3>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>All administrative actions are sealed and tamper-evident.</div>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#0c152a', borderBottom: '1px solid #1e293b', color: '#94a3b8', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 20px' }}>Timestamp</th>
                      <th style={{ padding: '12px 20px' }}>Action</th>
                      <th style={{ padding: '12px 20px' }}>Resource Type</th>
                      <th style={{ padding: '12px 20px' }}>Admin Identity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '12px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                          {log.created_at ? log.created_at.replace('T', ' ').slice(0, 19) : 'Just now'}
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: 700, color: '#60a5fa' }}>
                          {log.action}
                        </td>
                        <td style={{ padding: '12px 20px', color: '#cbd5e1' }}>
                          {log.resource_type} (#{log.resource_id?.slice(0, 8)})
                        </td>
                        <td style={{ padding: '12px 20px', color: '#94a3b8' }}>
                          {log.user_id ? log.user_id.slice(0, 8) : 'admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ALLOTMENT TIMING MODAL (Core feature for appointment timing allotment) */}
      {selectedAppointment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '28px', color: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>
                  HOSPITAL ADMINISTRATION ALLOTMENT
                </span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '4px 0 0 0' }}>
                  Allot Appointment Timing
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {allotSuccessMessage ? (
              <div style={{ background: '#064e3b', border: '1px solid #059669', color: '#a7f3d0', padding: '16px', borderRadius: '10px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
                ✓ {allotSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitAllotment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Patient Summary Box */}
                <div style={{ background: '#091024', padding: '14px', borderRadius: '10px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>PATIENT</div>
                    <strong style={{ color: '#ffffff' }}>{selectedAppointment.patient_name}</strong>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>FACILITY</div>
                    <strong style={{ color: '#60a5fa' }}>{selectedAppointment.hospital_name}</strong>
                  </div>
                </div>

                {/* Date & Time Picker */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      ALLOTTED DATE
                    </label>
                    <input
                      type="date"
                      value={allotDate}
                      onChange={(e) => setAllotDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      TIME SLOT
                    </label>
                    <select
                      value={allotTime}
                      onChange={(e) => setAllotTime(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                    >
                      <option value="09:00:00">09:00 AM - Morning Slot 1</option>
                      <option value="09:30:00">09:30 AM - Morning Slot 2</option>
                      <option value="10:00:00">10:00 AM - Morning Slot 3</option>
                      <option value="10:30:00">10:30 AM - Morning Slot 4</option>
                      <option value="11:00:00">11:00 AM - Morning Slot 5</option>
                      <option value="11:30:00">11:30 AM - Morning Slot 6</option>
                      <option value="14:00:00">02:00 PM - Afternoon Slot 1</option>
                      <option value="15:00:00">03:00 PM - Afternoon Slot 2</option>
                      <option value="16:00:00">04:00 PM - Evening Slot 1</option>
                    </select>
                  </div>
                </div>

                {/* Assign Doctor & Queue Token */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      ASSIGN CONSULTING DOCTOR
                    </label>
                    <select
                      value={allotDoctorId}
                      onChange={(e) => setAllotDoctorId(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                    >
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      QUEUE TOKEN #
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={allotQueueNumber}
                      onChange={(e) => setAllotQueueNumber(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Admin Notes for Patient */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    PATIENT INSTRUCTIONS / ADVISORY NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={allotNotes}
                    onChange={(e) => setAllotNotes(e.target.value)}
                    placeholder="e.g. Fasting blood test required, report to Reception Desk B 15 mins prior..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px', resize: 'none' }}
                  />
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#1e293b', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAllotment}
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', background: '#2563eb', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Save size={16} />
                    {isSubmittingAllotment ? 'Saving Allotment...' : 'Confirm Timing & Issue Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: DOCTOR PRESCRIBE MEDICINES & DIET PLAN */}
      {selectedPrescribeApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#111c38', border: '1px solid #1e293b', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '780px', color: '#ffffff', maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#10b981', padding: '6px', borderRadius: '8px' }}>
                    <Pill size={18} color="#ffffff" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Doctor Clinical Prescription & Diet Protocol Studio
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Patient: <strong style={{ color: '#38bdf8' }}>{selectedPrescribeApp.patient_name || 'Patient'}</strong> • Appointment #{selectedPrescribeApp.id} • {selectedPrescribeApp.hospital_name}
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescribeApp(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {prescribeSuccessMessage ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px' }}>
                <CheckCircle2 size={44} color="#10b981" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>Prescription & Diet Plan Settled!</h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px' }}>
                  {prescribeSuccessMessage}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Patient notification dispatched and medical record timeline updated.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPrescription} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Disease Classification & Diagnosis */}
                <div style={{ background: '#0b1329', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Disease Specialty & Clinical Diagnosis
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        DISEASE / CLINICAL CATEGORY
                      </label>
                      <select
                        value={prescDiseaseCategory}
                        onChange={(e) => setPrescDiseaseCategory(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '13px' }}
                      >
                        <option value="Cardiovascular & Hypertension">Cardiovascular & Hypertension</option>
                        <option value="Orthopedics & Joint Trauma">Orthopedics & Joint Trauma</option>
                        <option value="Type-2 Diabetes & Endocrine">Type-2 Diabetes & Endocrine</option>
                        <option value="Pulmonology & Respiratory Care">Pulmonology & Respiratory Care</option>
                        <option value="Gastroenterology & Digestive Health">Gastroenterology & Digestive Health</option>
                        <option value="Neurology & Stroke Care">Neurology & Stroke Care</option>
                        <option value="General Health & Infection Control">General Health & Infection Control</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        CONSULTATION / RECORD TITLE
                      </label>
                      <input
                        type="text"
                        value={prescTitle}
                        onChange={(e) => setPrescTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      CLINICAL DIAGNOSIS & REASON FOR REGIMEN
                    </label>
                    <input
                      type="text"
                      value={prescDiagnosis}
                      onChange={(e) => setPrescDiagnosis(e.target.value)}
                      required
                      placeholder="e.g. Mild Hypertension with Elevated LDL Cholesterol..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* 2. Medicine Regimen (Morning, Afternoon, Evening, Night) */}
                <div style={{ background: '#0b1329', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={15} /> 2. Medicine Schedule & Pill Timing (Morning/Evening)
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: '#1e293b',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={13} /> Add Medicine
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prescMedicines.map((med, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#111c38',
                          border: '1px solid #1e293b',
                          borderRadius: '10px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Telmisartan 40mg)"
                            value={med.name}
                            onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                            required
                            style={{ flex: 2, padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                          />
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 1 Tab)"
                            value={med.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            style={{ width: '110px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '13px' }}
                          />
                          <select
                            value={med.meal_relation}
                            onChange={(e) => handleMedicineChange(idx, 'meal_relation', e.target.value)}
                            style={{ width: '130px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '12px' }}
                          >
                            <option value="After Food">After Food</option>
                            <option value="Before Food">Before Food</option>
                            <option value="With Meals">With Meals</option>
                            <option value="Empty Stomach">Empty Stomach</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Duration (30 Days)"
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                            style={{ width: '100px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0b1329', color: '#ffffff', fontSize: '12px' }}
                          />
                          {prescMedicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* Interactive Pill Timings: Morning, Afternoon, Evening, Night */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                            Select Intake Times:
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Morning Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTimingToggle(idx, 'morning')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: med.timing?.morning ? '1px solid #f59e0b' : '1px solid #334155',
                                background: med.timing?.morning ? '#78350f' : '#1e293b',
                                color: med.timing?.morning ? '#fde68a' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Sun size={12} /> Morning
                            </button>

                            {/* Afternoon Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTimingToggle(idx, 'afternoon')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: med.timing?.afternoon ? '1px solid #ea580c' : '1px solid #334155',
                                background: med.timing?.afternoon ? '#7c2d12' : '#1e293b',
                                color: med.timing?.afternoon ? '#fed7aa' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Coffee size={12} /> Afternoon
                            </button>

                            {/* Evening Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTimingToggle(idx, 'evening')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: med.timing?.evening ? '1px solid #8b5cf6' : '1px solid #334155',
                                background: med.timing?.evening ? '#4c1d95' : '#1e293b',
                                color: med.timing?.evening ? '#ddd6fe' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Sunset size={12} /> Evening
                            </button>

                            {/* Night Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTimingToggle(idx, 'night')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: med.timing?.night ? '1px solid #3b82f6' : '1px solid #334155',
                                background: med.timing?.night ? '#1e3a8a' : '#1e293b',
                                color: med.timing?.night ? '#bfdbfe' : '#94a3b8',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Moon size={12} /> Night
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Specific physician instructions (e.g. Take with warm water before sleep)..."
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#0b1329', color: '#cbd5e1', fontSize: '11px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Doctor Prescribed Diet Plan */}
                <div style={{ background: '#0b1329', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Utensils size={15} /> 3. Doctor's Prescribed Diet Plan (Nutritional Protocol)
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      DIET PLAN TITLE
                    </label>
                    <input
                      type="text"
                      value={prescDietPlan.title}
                      onChange={(e) => handleDietChange('title', e.target.value)}
                      placeholder="e.g. Heart-Healthy Low Sodium Diet Plan"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', display: 'block', marginBottom: '3px' }}>
                        🥣 BREAKFAST PLAN
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.breakfast}
                        onChange={(e) => handleDietChange('breakfast', e.target.value)}
                        placeholder="Oats with almonds, boiled apple..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', display: 'block', marginBottom: '3px' }}>
                        🥗 LUNCH PLAN
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.lunch}
                        onChange={(e) => handleDietChange('lunch', e.target.value)}
                        placeholder="2 whole-wheat rotis, dal, cucumber salad..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', display: 'block', marginBottom: '3px' }}>
                        🍵 EVENING SNACK
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.evening_snack}
                        onChange={(e) => handleDietChange('evening_snack', e.target.value)}
                        placeholder="Roasted makhana, green tea..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', display: 'block', marginBottom: '3px' }}>
                        🍲 DINNER PLAN
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.dinner}
                        onChange={(e) => handleDietChange('dinner', e.target.value)}
                        placeholder="Moong dal khichdi / clear soup (before 8 PM)..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', display: 'block', marginBottom: '3px' }}>
                      🚫 FOODS TO STRICTLY AVOID (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={prescDietPlan.foods_to_avoid}
                      onChange={(e) => handleDietChange('foods_to_avoid', e.target.value)}
                      placeholder="Pickles, Papad, Fried Pakoras, High Sodium Namkeen, White Sugar"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '3px' }}>
                        💧 HYDRATION ADVICE
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.hydration_advice}
                        onChange={(e) => handleDietChange('hydration_advice', e.target.value)}
                        placeholder="2.5 to 3 Liters water daily"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '3px' }}>
                        📋 DOCTOR'S LIFESTYLE GUIDANCE
                      </label>
                      <input
                        type="text"
                        value={prescDietPlan.doctor_notes}
                        onChange={(e) => handleDietChange('doctor_notes', e.target.value)}
                        placeholder="30 mins brisk morning walk, monitor BP weekly..."
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#111c38', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPrescribeApp(null)}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#1e293b', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPrescription}
                    style={{ flex: 2, padding: '12px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Save size={16} />
                    {isSubmittingPrescription ? 'Settling Prescription...' : 'Settle & Issue Prescription Regimen'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

