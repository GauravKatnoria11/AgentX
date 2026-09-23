import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Bed,
  ShieldCheck,
  Search,
  Pill,
  Utensils,
  Sun,
  Moon,
  Sunset,
  Coffee,
  PhoneCall,
  Save,
  X,
  Plus,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  Check,
  Activity,
  AlertTriangle,
  Send,
  Mail,
  Star
} from 'lucide-react';
import {
  loginHospitalPortal,
  fetchHospitalDashboard,
  allotHospitalAppointment,
  prescribeHospitalPatient,
  updateHospitalPortalBeds,
  updateHospitalEmergencyCase,
  referHospitalAppointment,
  completeHospitalAppointment,
  sendHospitalAppointmentReminder,
  cancelHospitalAppointment
} from '../api';

export default function HospitalSecurePortal({ onExitPortal }) {
  const [hospitalToken, setHospitalToken] = useState(localStorage.getItem('hospital_portal_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('ivy_hsp');
  const [loginPassword, setLoginPassword] = useState('ivy@hsp2026');
  const [loginError, setLoginError] = useState('');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'queue' | 'beds' | 'emergency'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'confirmed'
  const [searchQuery, setSearchQuery] = useState('');

  // Allot Timing Modal State
  const [selectedAppForAllot, setSelectedAppForAllot] = useState(null);
  const [allotDate, setAllotDate] = useState('2026-09-26');
  const [allotTime, setAllotTime] = useState('10:30:00');
  const [allotDoctorId, setAllotDoctorId] = useState('');
  const [allotQueueNumber, setAllotQueueNumber] = useState(1);
  const [allotNotes, setAllotNotes] = useState('');
  const [isSubmittingAllot, setIsSubmittingAllot] = useState(false);
  const [allotSuccessMsg, setAllotSuccessMsg] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Doctor Referral Modal State
  const [selectedReferApp, setSelectedReferApp] = useState(null);
  const [referTargetDoctorId, setReferTargetDoctorId] = useState('');
  const [referReason, setReferReason] = useState('High Patient Caseload / Doctor Overbooked');
  const [referNotes, setReferNotes] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [referralSuccessMsg, setReferralSuccessMsg] = useState('');
  const [referralErrMsg, setReferralErrMsg] = useState('');

  // Prescribe Regimen & Diet Modal State
  const [selectedAppForPrescribe, setSelectedAppForPrescribe] = useState(null);
  const [prescDiseaseCategory, setPrescDiseaseCategory] = useState('Cardiovascular & Hypertension');
  const [prescTitle, setPrescTitle] = useState('Cardiology Regimen & Pharmacotherapy');
  const [prescDiagnosis, setPrescDiagnosis] = useState('Mild Hypertension with Dyslipidemia');
  const [prescMedicines, setPrescMedicines] = useState([
    {
      name: 'Telmisartan 40mg',
      dosage: '1 Tablet',
      timing: { morning: true, afternoon: false, evening: false, night: false },
      timing_label: 'Morning (Morning)',
      meal_relation: 'After Breakfast',
      duration: '30 Days',
      instructions: 'Take with warm water at fixed morning time'
    },
    {
      name: 'Atorvastatin 20mg',
      dosage: '1 Tablet',
      timing: { morning: false, afternoon: false, evening: false, night: true },
      timing_label: 'Night (Night)',
      meal_relation: 'After Dinner',
      duration: '30 Days',
      instructions: 'Take right before bedtime'
    }
  ]);
  const [prescDietPlan, setPrescDietPlan] = useState({
    title: 'Hospital Clinical Nutrition Protocol',
    breakfast: '1 bowl steel-cut oats with almonds + 1 boiled apple',
    lunch: '2 whole-wheat rotis, spinach dal, steamed lauki, cucumber salad',
    evening_snack: 'Roasted makhana + green tea',
    dinner: 'Moong dal khichdi / soup (have before 8:00 PM)',
    foods_to_avoid: 'Pickles, Papad, Fried Pakoras, High Sodium Namkeen',
    hydration_advice: '2.5 to 3 Liters filtered water daily',
    doctor_notes: '30 mins morning walk, monitor BP weekly'
  });
  const [prescNotes, setPrescNotes] = useState('');
  const [isSubmittingPrescribe, setIsSubmittingPrescribe] = useState(false);
  const [prescribeSuccessMsg, setPrescribeSuccessMsg] = useState('');

  useEffect(() => {
    if (hospitalToken) {
      loadDashboard(hospitalToken);
    }
  }, [hospitalToken]);

  const loadDashboard = async (token) => {
    setLoading(true);
    try {
      const res = await fetchHospitalDashboard(token);
      if (res.success && res.data) {
        setDashboardData(res.data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setHospitalToken('');
        localStorage.removeItem('hospital_portal_token');
      }
    } catch (e) {
      console.error('Failed to load hospital dashboard:', e);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await loginHospitalPortal(loginIdentifier, loginPassword);
      if (res.success && res.data?.access_token) {
        const token = res.data.access_token;
        setHospitalToken(token);
        localStorage.setItem('hospital_portal_token', token);
        setIsAuthenticated(true);
        loadDashboard(token);
      } else {
        setLoginError(res.message || 'Invalid hospital ID or password');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Authentication failed. Please verify hospital credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setHospitalToken('');
    localStorage.removeItem('hospital_portal_token');
    setIsAuthenticated(false);
    setDashboardData(null);
  };

  // Quick preset login helper for admin testing
  const handleSelectPresetAccount = (ident, pwd) => {
    setLoginIdentifier(ident);
    setLoginPassword(pwd);
  };

  // Open Allotment modal
  const handleOpenAllotModal = (app) => {
    setSelectedAppForAllot(app);
    setAllotDate(app.appointment_date || '2026-09-26');
    setAllotTime(app.appointment_time || '10:30:00');
    setAllotDoctorId(app.doctor_id || (dashboardData?.doctors?.[0]?.id || ''));
    setAllotQueueNumber(app.queue_number || (dashboardData?.appointments?.length || 1));
    setAllotNotes(app.notes || 'Confirmed by Facility Outpatient Desk');
    setAllotSuccessMsg('');
  };

  const handleSubmitAllotment = async (e) => {
    e.preventDefault();
    if (!selectedAppForAllot) return;
    setIsSubmittingAllot(true);
    try {
      const payload = {
        appointment_date: allotDate,
        appointment_time: allotTime,
        doctor_id: allotDoctorId || selectedAppForAllot.doctor_id,
        queue_number: parseInt(allotQueueNumber, 10) || 1,
        notes: allotNotes
      };
      const res = await allotHospitalAppointment(selectedAppForAllot.id, payload, hospitalToken);
      if (res.success) {
        setAllotSuccessMsg(`Timing confirmed for ${allotDate} at ${allotTime.slice(0, 5)} (Token #${payload.queue_number})`);
        loadDashboard(hospitalToken);
        setTimeout(() => {
          setSelectedAppForAllot(null);
          setAllotSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAllot(false);
    }
  };

  // Open Referral Modal
  const handleOpenReferModal = (app) => {
    setSelectedReferApp(app);
    const docs = dashboardData?.doctors || [];
    const altDoc = docs.find(d => String(d.id) !== String(app.doctor_id)) || docs[0];
    setReferTargetDoctorId(altDoc ? altDoc.id : '');
    setReferReason('High Patient Caseload / Doctor Overbooked');
    setReferNotes('');
    setReferralSuccessMsg('');
    setReferralErrMsg('');
  };

  const handleConfirmReferral = async (e) => {
    e.preventDefault();
    if (!selectedReferApp || !referTargetDoctorId) return;
    setIsSubmittingReferral(true);
    setReferralErrMsg('');
    try {
      const res = await referHospitalAppointment(
        selectedReferApp.id,
        {
          target_doctor_id: referTargetDoctorId,
          reason: referReason,
          notes: referNotes
        },
        hospitalToken
      );
      if (res.success) {
        setReferralSuccessMsg(res.message || 'Patient successfully referred!');
        loadDashboard(hospitalToken);
        setTimeout(() => {
          setSelectedReferApp(null);
          setReferralSuccessMsg('');
        }, 1500);
      } else {
        setReferralErrMsg(res.message || 'Failed to refer patient.');
      }
    } catch (err) {
      setReferralErrMsg('Error submitting doctor referral.');
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Complete consultation (Doctor finished - unlocks patient verified rating)
  const handleCompleteAppointment = async (appId) => {
    try {
      const res = await completeHospitalAppointment(appId, hospitalToken);
      if (res.success) {
        setActionNotice('Consultation marked as completed! Patient can now leave verified review.');
        loadDashboard(hospitalToken);
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Resend reminder email
  const handleSendReminder = async (app) => {
    setSendingReminderId(app.id);
    try {
      // Find patient's logged in / registered email
      let targetEmail = app.patient_email;
      if (!targetEmail) {
        try {
          const stored = JSON.parse(localStorage.getItem('hospital_current_user') || '{}');
          if (stored.email) targetEmail = stored.email;
        } catch (err) {}
      }
      const res = await sendHospitalAppointmentReminder(app.id, hospitalToken, targetEmail);
      if (res.success) {
        const dest = res.data?.resend_result?.recipient || targetEmail || 'patient email';
        setActionNotice(` Resend reminder email successfully dispatched to ${dest}!`);
        loadDashboard(hospitalToken);
        setTimeout(() => setActionNotice(''), 4500);
      } else {
        setActionNotice(res.message || 'Notice: Email reminder queued.');
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch (e) {
      console.error(e);
      setActionNotice('Error sending reminder email.');
      setTimeout(() => setActionNotice(''), 4000);
    } finally {
      setSendingReminderId(null);
    }
  };

  // Cancel appointment
  const handleCancelAppointment = async (appId) => {
    const reason = window.prompt('Enter cancellation reason for patient:', 'Doctor unavailable / Clinic rescheduling');
    if (!reason) return;
    try {
      const res = await cancelHospitalAppointment(appId, reason, hospitalToken);
      if (res.success) {
        setActionNotice('Appointment slot cancelled.');
        loadDashboard(hospitalToken);
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Prescribe modal
  const handleOpenPrescribeModal = (app) => {
    setSelectedAppForPrescribe(app);
    const reasonLower = (app?.reason || '').toLowerCase();
    const isOrtho = reasonLower.includes('knee') || reasonLower.includes('joint') || reasonLower.includes('ortho') || reasonLower.includes('fracture');
    const isDiabetes = reasonLower.includes('sugar') || reasonLower.includes('diabetes') || reasonLower.includes('glucose');

    let disease = 'Cardiovascular & Hypertension';
    let title = 'Cardiology Consultation & Regimen';
    let diag = 'Mild Hypertension with Dyslipidemia';
    let meds = [
      {
        name: 'Telmisartan 40mg',
        dosage: '1 Tablet',
        timing: { morning: true, afternoon: false, evening: false, night: false },
        timing_label: 'Morning (Morning)',
        meal_relation: 'After Breakfast',
        duration: '30 Days',
        instructions: 'Take with warm water at fixed morning time'
      },
      {
        name: 'Atorvastatin 20mg',
        dosage: '1 Tablet',
        timing: { morning: false, afternoon: false, evening: false, night: true },
        timing_label: 'Night (Night)',
        meal_relation: 'After Dinner',
        duration: '30 Days',
        instructions: 'Take right before bedtime'
      }
    ];

    if (isOrtho) {
      disease = 'Orthopedics & Joint Trauma';
      title = 'Orthopedic Evaluation & Joint Protocol';
      diag = 'Osteoarthritis & Cartilage Degeneration';
      meds = [
        {
          name: 'Glucosamine Sulfate 500mg',
          dosage: '1 Capsule',
          timing: { morning: true, afternoon: false, evening: true, night: false },
          timing_label: 'Morning & Evening (Morning Evening)',
          meal_relation: 'After Food',
          duration: '60 Days',
          instructions: 'Joint cartilage protection'
        }
      ];
    } else if (isDiabetes) {
      disease = 'Type-2 Diabetes & Endocrine';
      title = 'Glycemic Stabilization & Endocrine Regimen';
      diag = 'Type-2 Diabetes Mellitus with elevated HbA1c';
      meds = [
        {
          name: 'Metformin 500mg SR',
          dosage: '1 Tablet',
          timing: { morning: true, afternoon: false, evening: true, night: false },
          timing_label: 'Morning & Evening (Morning Evening)',
          meal_relation: 'With Meals',
          duration: '90 Days',
          instructions: 'Take halfway through meals'
        }
      ];
    }

    setPrescDiseaseCategory(disease);
    setPrescTitle(title);
    setPrescDiagnosis(diag);
    setPrescMedicines(meds);
    setPrescNotes(`Consultation at ${dashboardData?.hospital?.name || 'Hospital'}`);
    setPrescribeSuccessMsg('');
  };

  const handleTimingToggle = (idx, timingKey) => {
    setPrescMedicines(prev => prev.map((med, i) => {
      if (i !== idx) return med;
      const updatedTiming = { ...med.timing, [timingKey]: !med.timing[timingKey] };
      const activeKeys = Object.keys(updatedTiming).filter(k => updatedTiming[k]);
      let label = activeKeys.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' & ');
      if (activeKeys.length === 0) label = 'As Directed / SOS';
      return { ...med, timing: updatedTiming, timing_label: label };
    }));
  };

  const handleMedicineChange = (idx, field, value) => {
    setPrescMedicines(prev => prev.map((med, i) => i === idx ? { ...med, [field]: value } : med));
  };

  const handleAddMedicine = () => {
    setPrescMedicines(prev => [
      ...prev,
      {
        name: '',
        dosage: '1 Tablet',
        timing: { morning: true, afternoon: false, evening: true, night: false },
        timing_label: 'Morning & Evening (Morning Evening)',
        meal_relation: 'After Food',
        duration: '30 Days',
        instructions: ''
      }
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setPrescMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppForPrescribe) return;
    setIsSubmittingPrescribe(true);
    try {
      const avoidList = (prescDietPlan.foods_to_avoid || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        disease_category: prescDiseaseCategory,
        title: prescTitle,
        diagnosis: prescDiagnosis,
        doctor_id: selectedAppForPrescribe.doctor_id,
        medicines: prescMedicines,
        diet_plan: {
          ...prescDietPlan,
          foods_to_avoid: avoidList
        },
        notes: prescNotes
      };

      const res = await prescribeHospitalPatient(selectedAppForPrescribe.id, payload, hospitalToken);
      if (res.success) {
        setPrescribeSuccessMsg(`Medicine regimen and diet plan settled for ${selectedAppForPrescribe.patient_name || 'Patient'}!`);
        loadDashboard(hospitalToken);
        setTimeout(() => {
          setSelectedAppForPrescribe(null);
          setPrescribeSuccessMsg('');
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPrescribe(false);
    }
  };

  // Adjust ICU Beds
  const handleBedAdjust = async (delta) => {
    if (!dashboardData?.hospital) return;
    const currentIcu = dashboardData.hospital.available_icu_beds || 0;
    const newIcu = Math.max(0, currentIcu + delta);
    try {
      const res = await updateHospitalPortalBeds({ available_icu_beds: newIcu }, hospitalToken);
      if (res.success) {
        setDashboardData(prev => ({
          ...prev,
          hospital: { ...prev.hospital, available_icu_beds: newIcu },
          metrics: { ...prev.metrics, available_icu_beds: newIcu }
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Emergency Alert
  const handleUpdateEmergency = async (alertId, newStatus) => {
    try {
      const res = await updateHospitalEmergencyCase(alertId, { status: newStatus }, hospitalToken);
      if (res.success) {
        loadDashboard(hospitalToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter appointments for this hospital
  const appointments = dashboardData?.appointments || [];
  const filteredAppointments = appointments.filter(app => {
    const matchesFilter = 
      statusFilter === 'all' || 
      app.status === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const matchesSearch = 
      (app.patient_name && app.patient_name.toLowerCase().includes(q)) ||
      (app.patient_phone && app.patient_phone.includes(q)) ||
      (app.reason && app.reason.toLowerCase().includes(q)) ||
      (app.doctor_name && app.doctor_name.toLowerCase().includes(q)) ||
      (app.id && app.id.toLowerCase().includes(q));

    return matchesFilter && matchesSearch;
  });

  // ==========================================
  // VIEW 1: LOGIN VIEW (RESTRICTED GATEWAY)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#080e1e', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(14px, 3vw, 24px)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 'min(480px, 94vw)', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: 'clamp(18px, 4vw, 36px)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#059669', padding: '10px', borderRadius: '10px' }}>
              <Building2 size={26} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Hospital Authority Portal
              </h2>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                Hoshiarpur District Healthcare Facility Gateway
              </div>
            </div>
          </div>

          <div style={{ background: '#1e293b', padding: '12px 14px', borderRadius: '10px', fontSize: '12px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
             <strong>Confidential Access:</strong> This endpoint is exclusively distributed to verified hospital administrations to triage, manage, and prescribe for their patients.
          </div>

          {loginError && (
            <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                HOSPITAL IDENTIFIER / USERNAME
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="e.g. ivy_hsp or hosp-1"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#080e1e',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                HOSPITAL MASTER PASSWORD
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter facility password..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#080e1e',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Quick Demo Selectors */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                QUICK FACILITY LOGIN (Demo / Evaluation):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Ivy Hospital', id: 'ivy_hsp', pwd: 'ivy@hsp2026' },
                  { label: 'Civil Hospital', id: 'civil_hsp', pwd: 'civil@hsp2026' },
                  { label: 'Vasal Hospital', id: 'vasal_hsp', pwd: 'vasal@hsp2026' },
                  { label: 'Saini Trauma', id: 'saini_hsp', pwd: 'saini@hsp2026' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPresetAccount(item.id, item.pwd)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: loginIdentifier === item.id ? '#059669' : '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '14px',
                borderRadius: '10px',
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <KeyRound size={17} />
              {loading ? 'Verifying Facility Credentials...' : 'Authenticate & Enter Hospital Console'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={onExitPortal}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 auto'
              }}
            >
              <ArrowLeft size={14} /> Exit Portal & Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED HOSPITAL CONSOLE
  // ==========================================
  const hospital = dashboardData?.hospital || {};
  const metrics = dashboardData?.metrics || {};

  return (
    <div style={{ minHeight: '100vh', background: '#080e1e', color: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Bar with Hospital Branding */}
      <header style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', padding: '16px clamp(14px, 3vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#059669', padding: '10px', borderRadius: '10px' }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {hospital.name || 'Hospital Authority Console'}
              </h2>
              <span style={{ background: '#1e293b', border: '1px solid #059669', color: '#34d399', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                ID: {hospital.id}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
               {hospital.address || 'Hoshiarpur, Punjab'} • Hotline: <strong>{hospital.emergency_hotline || '108'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadDashboard(hospitalToken)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh Roster
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: '#7f1d1d',
              color: '#fecaca',
              border: '1px solid #991b1b',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: '24px clamp(14px, 3vw, 32px)', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metric Cards Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Card 1: Total Patients */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
              <span>REGISTERED PATIENTS</span>
              <Users size={18} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '8px' }}>
              {metrics.total_patients || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Dedicated to this medical facility
            </div>
          </div>

          {/* Card 2: Pending Appointments */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
              <span>PENDING CONFIRMATIONS</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#facc15', marginTop: '8px' }}>
              {metrics.pending_appointments || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Require timing & token allotment
            </div>
          </div>

          {/* Card 3: ICU Bed Controller */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
              <span>AVAILABLE ICU BEDS</span>
              <Bed size={18} color="#10b981" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
                {hospital.available_icu_beds || 0} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>/ {hospital.total_beds || 0} Total</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleBedAdjust(-1)}
                  style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}
                >
                  -
                </button>
                <button
                  onClick={() => handleBedAdjust(1)}
                  style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#059669', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Live syncs with District 108 trauma network
            </div>
          </div>

          {/* Card 4: Emergency Alerts */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
              <span>ACTIVE 108 DISPATCHES</span>
              <Flame size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', marginTop: '8px' }}>
              {metrics.active_emergencies || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Ambulances routed to this hospital
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', paddingBottom: '4px' }}>
            {[
              { id: 'patients', label: `Patients & Appointments (${appointments.length})`, icon: Users },
              { id: 'beds', label: 'ICU & Bed Capacity Studio', icon: Bed },
              { id: 'emergency', label: `Inbound Emergency Cases (${dashboardData?.emergency_alerts?.length || 0})`, icon: Flame }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#059669' : '#1e293b',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'patients' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: statusFilter === f ? '#3b82f6' : '#1e293b',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '220px', maxWidth: '100%' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search patient, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 30px',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    background: '#080e1e',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* TAB 1: PATIENTS & APPOINTMENTS (ISOLATED TO THIS FACILITY) */}
        {/* ==================================================== */}
        {activeTab === 'patients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {actionNotice && (
              <div style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> {actionNotice}
              </div>
            )}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#090e1c', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '14px 20px' }}>Patient Details</th>
                    <th style={{ padding: '14px 20px' }}>Consultation Reason</th>
                    <th style={{ padding: '14px 20px' }}>Scheduled Date & Time</th>
                    <th style={{ padding: '14px 20px' }}>Attending Doctor</th>
                    <th style={{ padding: '14px 20px' }}>Status & Token</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Facility Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No patients or appointments found for {hospital.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((app) => {
                      const isPending = app.status === 'pending';
                      const isCompleted = app.status === 'completed';
                      const isCancelled = app.status === 'cancelled';
                      return (
                        <tr key={app.id} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>
                              {app.patient_name || 'Patient'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              Tel: {app.patient_phone || '+91-98765-XXXXX'} • Blood: <span style={{ color: '#f87171', fontWeight: 700 }}>{app.blood_group || app.patient_blood_group || 'O+'}</span>
                            </div>
                            {app.patient_email && (
                              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Email: {app.patient_email}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px', maxWidth: '240px' }}>
                            <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
                              {app.reason || 'General Consultation'}
                            </div>
                            {app.notes && (
                              <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '2px' }}>
                                Note: {app.notes}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ color: '#ffffff', fontWeight: 600 }}>
                              Date: {app.appointment_date}
                            </div>
                            <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                              Time: {app.appointment_time ? app.appointment_time.slice(0, 5) : 'Awaiting Slot'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ color: '#ffffff', fontWeight: 600 }}>{app.doctor_name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{app.doctor_specialization}</div>
                          </td>

                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: isCancelled
                                    ? 'rgba(239, 68, 68, 0.15)'
                                    : isPending
                                    ? 'rgba(234, 179, 8, 0.15)'
                                    : isCompleted
                                    ? 'rgba(59, 130, 246, 0.15)'
                                    : 'rgba(16, 185, 129, 0.15)',
                                  color: isCancelled
                                    ? '#f87171'
                                    : isPending
                                    ? '#facc15'
                                    : isCompleted
                                    ? '#60a5fa'
                                    : '#34d399',
                                  border: `1px solid ${
                                    isCancelled
                                      ? 'rgba(239, 68, 68, 0.3)'
                                      : isPending
                                      ? 'rgba(234, 179, 8, 0.3)'
                                      : isCompleted
                                      ? 'rgba(59, 130, 246, 0.3)'
                                      : 'rgba(16, 185, 129, 0.3)'
                                  }`
                                }}
                              >
                                {isCancelled ? 'x Cancelled' : isPending ? '● Pending Slot' : isCompleted ? ' Completed' : '● Confirmed'}
                              </span>
                              {app.queue_number && (
                                <span style={{ fontSize: '11px', background: '#080e1e', padding: '2px 8px', borderRadius: '10px', color: '#34d399', fontWeight: 700 }}>
                                  Token #{app.queue_number}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* 1. Allot Slot / Reschedule */}
                              {!isCancelled && (
                                <button
                                  onClick={() => handleOpenAllotModal(app)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: isPending ? '#2563eb' : '#1e293b',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Allot or change date and time slot"
                                >
                                  {isPending ? 'Allot Timing' : 'Reschedule'}
                                </button>
                              )}

                              {/* 2. Mark Consultation Done (Doctor Completed) */}
                              {!isCompleted && !isCancelled && (
                                <button
                                  onClick={() => handleCompleteAppointment(app.id)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #10b981',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Mark consultation done so patient can rate doctor"
                                >
                                  <Check size={12} /> Mark Done
                                </button>
                              )}

                              {/* 3. Prescribe Regimen */}
                              {!isCancelled && (
                                <button
                                  onClick={() => handleOpenPrescribeModal(app)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #059669',
                                    background: 'rgba(5, 150, 105, 0.15)',
                                    color: '#34d399',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Pill size={12} /> Prescribe
                                </button>
                              )}

                              {/* 4. Refer Doctor */}
                              {!isCancelled && !isCompleted && (
                                <button
                                  onClick={() => handleOpenReferModal(app)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #6366f1',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: '#a5b4fc',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Refer patient to another specialist due to high caseload"
                                >
                                   Refer
                                </button>
                              )}

                              {/* 5. Send Resend Reminder */}
                              {!isCancelled && !isCompleted && (
                                <button
                                  onClick={() => handleSendReminder(app)}
                                  disabled={sendingReminderId === app.id}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #38bdf8',
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    color: '#7dd3fc',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Send email reminder via Resend to patient"
                                >
                                  <Send size={11} /> {sendingReminderId === app.id ? 'Sending...' : 'Remind'}
                                </button>
                              )}

                              {/* 6. Cancel Slot */}
                              {!isCancelled && !isCompleted && (
                                <button
                                  onClick={() => handleCancelAppointment(app.id)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '10px',
                                    border: '1px solid #ef4444',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#f87171',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Cancel this appointment"
                                >
                                  Cancel
                                </button>
                              )}
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

        {/* ==================================================== */}
        {/* TAB 2: BED & ICU CAPACITY CONTROLLER */}
        {/* ==================================================== */}
        {activeTab === 'beds' && (
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '28px', maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Bed size={24} color="#10b981" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                {hospital.name} Bed Availability Controller
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '24px' }}>
              Adjust available beds in real time. These numbers directly update the Hoshiarpur public emergency directory and district 108 ambulance dispatchers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* ICU Bed Counter */}
              <div style={{ background: '#080e1e', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>Available ICU Beds</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Equipped with mechanical ventilators & ACLS monitors</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    onClick={() => handleBedAdjust(-1)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '18px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '24px', fontWeight: 800, minWidth: '36px', textAlign: 'center' }}>
                    {hospital.available_icu_beds || 0}
                  </span>
                  <button
                    onClick={() => handleBedAdjust(1)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#059669', border: 'none', color: '#ffffff', fontSize: '18px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Beds */}
              <div style={{ background: '#080e1e', padding: '20px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Total Inpatient Capacity</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>General wards, private rooms, and HDU beds</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#cbd5e1' }}>
                  {hospital.total_beds || 0} Beds
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: INBOUND EMERGENCY DISPATCHES */}
        {/* ==================================================== */}
        {activeTab === 'emergency' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '10px', padding: '16px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Flame size={22} color="#fca5a5" />
                <div>
                  <strong style={{ fontSize: '15px' }}>District 108 Emergency Ambulance Triage Feed</strong>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Live incoming triage alerts routed to {hospital.name}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
              {(dashboardData?.emergency_alerts || []).map((alert) => (
                <div key={alert.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ background: '#dc2626', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                        ALERT: CODE RED INBOUND
                      </span>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '8px 0 2px' }}>
                        {alert.emergency_type}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Patient: <strong>{alert.patient_name}</strong> • Tel: {alert.phone}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 800 }}>
                      ETA ~{alert.eta_minutes || 5} min
                    </span>
                  </div>

                  <div style={{ background: '#080e1e', borderRadius: '10px', padding: '10px 12px', marginTop: '12px', fontSize: '12px', color: '#cbd5e1' }}>
                     Pick-up: <strong>{alert.current_location}</strong>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Triage Action:</span>
                    <select
                      value={alert.status}
                      onChange={(e) => handleUpdateEmergency(alert.id, e.target.value)}
                      style={{
                        background: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        padding: '6px 10px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="dispatched">Ambulance Dispatched</option>
                      <option value="en_route">En Route to Hospital</option>
                      <option value="admitted">Admitted to Trauma Bay</option>
                      <option value="resolved">Triage Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL: ALLOT APPOINTMENT TIMING */}
      {/* ==================================================== */}
      {selectedAppForAllot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: 'clamp(16px, 4vw, 28px)', width: '100%', maxWidth: 'min(520px, 94vw)', color: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                Allot Appointment Slot & Issue Token
              </h3>
              <button onClick={() => setSelectedAppForAllot(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {allotSuccessMsg ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '10px', color: '#10b981' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
                <strong>{allotSuccessMsg}</strong>
              </div>
            ) : (
              <form onSubmit={handleSubmitAllotment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PATIENT NAME
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedAppForAllot.patient_name || 'Patient'} (${selectedAppForAllot.patient_phone || ''})`}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#94a3b8', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      CONFIRMED DATE
                    </label>
                    <input
                      type="date"
                      value={allotDate}
                      onChange={(e) => setAllotDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      CONFIRMED TIME
                    </label>
                    <input
                      type="time"
                      value={allotTime}
                      onChange={(e) => setAllotTime(e.target.value)}
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      ASSIGN ATTENDING SPECIALIST
                    </label>
                    <select
                      value={allotDoctorId}
                      onChange={(e) => setAllotDoctorId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '13px' }}
                    >
                      {(dashboardData?.doctors || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      TOKEN #
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={allotQueueNumber}
                      onChange={(e) => setAllotQueueNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PATIENT INSTRUCTIONS
                  </label>
                  <textarea
                    rows={2}
                    value={allotNotes}
                    onChange={(e) => setAllotNotes(e.target.value)}
                    placeholder="Instructions for patient (e.g. report 10 mins prior)..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '13px', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAppForAllot(null)}
                    style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '10px', background: '#1e293b', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAllot}
                    style={{ flex: 2, minWidth: '160px', padding: '10px', borderRadius: '10px', background: '#059669', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isSubmittingAllot ? 'Confirming...' : 'Confirm Slot & Issue Token'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PRESCRIBE MEDICINES & DIET PLAN */}
      {/* ==================================================== */}
      {selectedAppForPrescribe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: 'clamp(16px, 4vw, 28px)', width: '100%', maxWidth: 'min(760px, 94vw)', color: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={18} color="#10b981" />
                  Prescribe Medicine Regimen & Diet Plan
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Patient: <strong style={{ color: '#38bdf8' }}>{selectedAppForPrescribe.patient_name}</strong> • {hospital.name}
                </div>
              </div>
              <button onClick={() => setSelectedAppForPrescribe(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {prescribeSuccessMsg ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '10px', color: '#10b981' }}>
                <CheckCircle2 size={40} style={{ margin: '0 auto 8px' }} />
                <strong>{prescribeSuccessMsg}</strong>
              </div>
            ) : (
              <form onSubmit={handleSubmitPrescription} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Disease & Diagnosis */}
                <div style={{ background: '#080e1e', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                        DISEASE SPECIALTY
                      </label>
                      <select
                        value={prescDiseaseCategory}
                        onChange={(e) => setPrescDiseaseCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '12px' }}
                      >
                        <option value="Cardiovascular & Hypertension">Cardiovascular & Hypertension</option>
                        <option value="Orthopedics & Joint Trauma">Orthopedics & Joint Trauma</option>
                        <option value="Type-2 Diabetes & Endocrine">Type-2 Diabetes & Endocrine</option>
                        <option value="Pulmonology & Respiratory Care">Pulmonology & Respiratory Care</option>
                        <option value="General Health & Care">General Health & Care</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                        CLINICAL DIAGNOSIS
                      </label>
                      <input
                        type="text"
                        value={prescDiagnosis}
                        onChange={(e) => setPrescDiagnosis(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Medicines List */}
                <div style={{ background: '#080e1e', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>
                      Medicine Schedule (Morning / Evening Timings)
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      style={{ padding: '4px 10px', borderRadius: '10px', background: '#1e293b', border: '1px solid #059669', color: '#34d399', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Medicine
                    </button>
                  </div>

                  {prescMedicines.map((med, idx) => (
                    <div key={idx} style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Telmisartan 40mg)"
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                          required
                          style={{ flex: 2, padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          style={{ width: '90px', padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '12px' }}
                        />
                        <select
                          value={med.meal_relation}
                          onChange={(e) => handleMedicineChange(idx, 'meal_relation', e.target.value)}
                          style={{ width: '120px', padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#080e1e', color: '#ffffff', fontSize: '11px' }}
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="With Meals">With Meals</option>
                        </select>
                        {prescMedicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            style={{ background: '#7f1d1d', border: 'none', color: '#fca5a5', padding: '6px 8px', borderRadius: '10px', cursor: 'pointer' }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Timing Toggles */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '4px' }}>Timings:</span>
                        <button
                          type="button"
                          onClick={() => handleTimingToggle(idx, 'morning')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '10px',
                            border: med.timing?.morning ? '1px solid #f59e0b' : '1px solid #334155',
                            background: med.timing?.morning ? '#78350f' : '#1e293b',
                            color: med.timing?.morning ? '#fde68a' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Morning Morning
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimingToggle(idx, 'afternoon')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '10px',
                            border: med.timing?.afternoon ? '1px solid #ea580c' : '1px solid #334155',
                            background: med.timing?.afternoon ? '#7c2d12' : '#1e293b',
                            color: med.timing?.afternoon ? '#fed7aa' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Afternoon Afternoon
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimingToggle(idx, 'evening')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '10px',
                            border: med.timing?.evening ? '1px solid #8b5cf6' : '1px solid #334155',
                            background: med.timing?.evening ? '#4c1d95' : '#1e293b',
                            color: med.timing?.evening ? '#ddd6fe' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Evening Evening
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTimingToggle(idx, 'night')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '10px',
                            border: med.timing?.night ? '1px solid #3b82f6' : '1px solid #334155',
                            background: med.timing?.night ? '#1e3a8a' : '#1e293b',
                            color: med.timing?.night ? '#bfdbfe' : '#94a3b8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Night Night
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diet Plan */}
                <div style={{ background: '#080e1e', padding: '14px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                    Hospital Diet Plan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder=" Breakfast Plan..."
                      value={prescDietPlan.breakfast}
                      onChange={(e) => setPrescDietPlan(p => ({ ...p, breakfast: e.target.value }))}
                      style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '11px' }}
                    />
                    <input
                      type="text"
                      placeholder=" Lunch Plan..."
                      value={prescDietPlan.lunch}
                      onChange={(e) => setPrescDietPlan(p => ({ ...p, lunch: e.target.value }))}
                      style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '11px' }}
                    />
                    <input
                      type="text"
                      placeholder=" Evening Snack..."
                      value={prescDietPlan.evening_snack}
                      onChange={(e) => setPrescDietPlan(p => ({ ...p, evening_snack: e.target.value }))}
                      style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '11px' }}
                    />
                    <input
                      type="text"
                      placeholder=" Dinner Plan..."
                      value={prescDietPlan.dinner}
                      onChange={(e) => setPrescDietPlan(p => ({ ...p, dinner: e.target.value }))}
                      style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedAppForPrescribe(null)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#1e293b', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPrescribe}
                    style={{ flex: 2, padding: '10px', borderRadius: '10px', background: '#059669', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {isSubmittingPrescribe ? 'Settling...' : 'Issue Prescription & Diet Plan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REFER DOCTOR MODAL */}
      {selectedReferApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            width: '100%',
            maxWidth: 'min(520px, 94vw)',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(16px, 4vw, 24px)',
            color: '#ffffff',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}> Doctor Referral & Reassignment</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                  Reassign patient <strong style={{ color: '#ffffff' }}>{selectedReferApp.patient_name}</strong> to balance clinical load
                </p>
              </div>
              <button
                onClick={() => setSelectedReferApp(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                x
              </button>
            </div>

            {referralErrMsg && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                {referralErrMsg}
              </div>
            )}

            {referralSuccessMsg && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                {referralSuccessMsg}
              </div>
            )}

            <form onSubmit={handleConfirmReferral} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Select Target Doctor (Specialist to Receive Patient)
                </label>
                <select
                  value={referTargetDoctorId}
                  onChange={(e) => setReferTargetDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '13px' }}
                >
                  {(dashboardData?.doctors || []).map((doc) => {
                    const isSame = String(doc.id) === String(selectedReferApp.doctor_id);
                    return (
                      <option key={doc.id} value={doc.id} disabled={isSame}>
                        {doc.name} • {doc.specialization} {isSame ? '(Current Doctor)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Referral Reason
                </label>
                <select
                  value={referReason}
                  onChange={(e) => setReferReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '13px' }}
                >
                  <option value="High Patient Caseload / Doctor Overbooked">High Patient Caseload / Doctor Overbooked</option>
                  <option value="Specialist Referral & Advanced Diagnostic Review">Specialist Referral & Advanced Diagnostic Review</option>
                  <option value="Clinical Second Opinion Required">Clinical Second Opinion Required</option>
                  <option value="Emergency Priority Escalation">Emergency Priority Escalation</option>
                  <option value="Patient Preference / Schedule Conflict">Patient Preference / Schedule Conflict</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Clinical Handoff Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for receiving specialist regarding symptoms, prior medications, or urgency..."
                  value={referNotes}
                  onChange={(e) => setReferNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReferApp(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#1e293b', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReferral}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', background: '#6366f1', border: 'none', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isSubmittingReferral ? 'Transferring...' : 'Confirm Referral & Transfer Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
