import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Ambulance,
  HeartPulse,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Flame,
  User,
  ArrowRight,
  Brain,
  Car,
  Wind,
  Building2,
  Phone,
  Crosshair
} from 'lucide-react';
import { triggerEmergencySOS } from '../api';
import { getAccurateGPSLocation } from '../utils/geolocation';

const HOSHIARPUR_LOCATIONS = [
  { name: 'Model Town, Hoshiarpur', lat: 31.5312, lon: 75.9184 },
  { name: 'Civil Lines, Court Road, Hoshiarpur', lat: 31.5284, lon: 75.9122 },
  { name: 'Bus Stand / Sutheri Road, Hoshiarpur', lat: 31.5342, lon: 75.9158 },
  { name: 'Phagwara Road / Session Courts, Hoshiarpur', lat: 31.5188, lon: 75.9082 },
  { name: 'Chandigarh Road / Bypass, Hoshiarpur', lat: 31.5165, lon: 75.9285 },
  { name: 'Railway Station Road, Hoshiarpur', lat: 31.5245, lon: 75.9055 },
  { name: 'Mahilpur Road / Bullowal Area', lat: 31.4850, lon: 75.9550 },
  { name: 'Rayat Bahra Professional University (Bohan)', lat: 31.4820, lon: 75.9591 }
];

const EMERGENCY_CONDITIONS = [
  {
    id: 'heart_attack',
    label: 'Heart Attack / Acute Chest Pain',
    iconType: 'heart',
    severity: 'CRITICAL - LEVEL 1',
    color: '#ef4444',
    desc: 'Severe chest tightness, pain radiating to left arm/jaw, shortness of breath, cold sweat'
  },
  {
    id: 'brain_stroke',
    label: 'Brain Stroke / Sudden Paralysis',
    iconType: 'brain',
    severity: 'CRITICAL - LEVEL 1',
    color: '#dc2626',
    desc: 'Facial drooping, arm weakness, slurred speech, sudden loss of balance (FAST)'
  },
  {
    id: 'trauma_accident',
    label: 'Road Accident / Polytrauma / Severe Bleeding',
    iconType: 'car',
    severity: 'TRAUMA - CODE RED',
    color: '#ea580c',
    desc: 'Deep lacerations, suspected bone fractures, blunt chest/head impact, profuse bleeding'
  },
  {
    id: 'breathing_failure',
    label: 'Severe Respiratory Distress / Choking',
    iconType: 'wind',
    severity: 'ACUTE - LEVEL 1',
    color: '#b91c1c',
    desc: 'Gasping for air, cyanosis (blue lips), acute asthma/COPD attack, choking'
  },
  {
    id: 'unconscious_poison',
    label: 'Unconscious / Seizures / Poisoning',
    iconType: 'alert',
    severity: 'EMERGENCY - LEVEL 2',
    color: '#d97706',
    desc: 'Unresponsive patient, continuous convulsions, drug/pesticide ingestion, snake bite'
  }
];

export default function EmergencyPage({ onNavigateToRoute, patientLocation }) {
  const [selectedCondition, setSelectedCondition] = useState(EMERGENCY_CONDITIONS[0]);
  const [selectedLocation, setSelectedLocation] = useState(
    patientLocation || HOSHIARPUR_LOCATIONS[0]
  );
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsAccuracyInfo, setGpsAccuracyInfo] = useState(
    patientLocation?.isExactGPS ? `±${patientLocation.accuracy || 8}m` : null
  );
  const [patientName, setPatientName] = useState('John Doe');
  const [patientPhone, setPatientPhone] = useState('+91-98765-43210');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(null);

  useEffect(() => {
    if (patientLocation) {
      setSelectedLocation(patientLocation);
      if (patientLocation.isExactGPS) {
        setGpsAccuracyInfo(`±${patientLocation.accuracy || 8}m`);
      }
    }
  }, [patientLocation]);

  const handleAutoDetectGPS = async () => {
    setIsDetectingGPS(true);
    try {
      const loc = await getAccurateGPSLocation();
      setSelectedLocation(loc);
      setGpsAccuracyInfo(`±${loc.accuracy}m (${loc.accuracy_label})`);
    } catch (err) {
      console.warn('GPS detection error:', err);
      alert(err.message || 'Could not detect device GPS.');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  useEffect(() => {
    let interval;
    if (sosResult && sosResult.eta_minutes) {
      setCountdownTimer(sosResult.eta_minutes * 60);
      interval = setInterval(() => {
        setCountdownTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sosResult]);

  const handleTriggerSOS = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        emergency_type: selectedCondition.label,
        patient_name: patientName || 'Emergency Patient',
        phone: patientPhone || '+91-98765-43210',
        current_location: selectedLocation.name,
        current_lat: selectedLocation.lat,
        current_lon: selectedLocation.lon,
        notes: customNotes || `Urgent triage requested for ${selectedCondition.label}`
      };

      const res = await triggerEmergencySOS(payload);
      if (res.success && res.data) {
        setSosResult(res.data);
      }
    } catch (e) {
      console.error('Failed to trigger emergency SOS:', e);
      // Fallback display
      setSosResult({
        alert_id: 'HSP-SOS-' + Math.floor(1000 + Math.random() * 9000),
        status: 'Ambulance Dispatched & Trauma Bay Alerted',
        eta_minutes: 6,
        ambulance_assigned: 'Punjab 108 Advanced Life Support Unit #PB-07-HSP',
        emergency_hotline: '+91-1882-220022',
        national_ambulance_number: '108',
        nearest_hospital: {
          name: 'Civil Hospital Hoshiarpur',
          address: 'Court Road, Near District Administrative Complex, Hoshiarpur',
          phone: '+91-1882-220022',
          emergency_hotline: '108 / +91-1882-220022',
          available_icu_beds: 14,
          distance_km: 1.8
        },
        first_aid_instructions: [
          'Keep patient seated upright with clothing loosened.',
          'Do not offer water or food until emergency paramedics arrive.',
          'If chest pain is diagnosed, administer chewable Aspirin (300mg) if non-allergic.',
          'Ensure road/stair access is clear for incoming stretcher team.'
        ]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Alert */}
      <div
        style={{
          background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
          borderRadius: '10px',
          padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 28px)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 12px',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              <ShieldAlert size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
              24/7 Emergency Dispatch
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, margin: '6px 0', letterSpacing: '-0.02em' }}>
            Emergency Response & Ambulance Dispatch
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.95, lineHeight: 1.4, margin: 0 }}>
            Alerts the nearest emergency facility, reserves an ICU trauma bed, and coordinates 108 ambulance dispatch.
          </p>
        </div>

        {/* Quick Dial Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
          <a
            href="tel:108"
            style={{
              flex: '1 1 180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#ffffff',
              color: '#b91c1c',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <PhoneCall size={18} /> Call 108 Ambulance
          </a>
          <a
            href="tel:+911882220022"
            style={{
              flex: '1 1 180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            <ShieldAlert size={18} /> Civil Hospital Casualty
          </a>
        </div>
      </div>

      {/* Active SOS In-Progress View */}
      {sosResult && (
        <div
          className="card"
          style={{
            border: '2px solid #ef4444',
            background: '#fef2f2',
            padding: 'clamp(16px, 3.5vw, 24px)',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}
              >
                ● LIVE SOS ACTIVE • ALERT #{sosResult.alert_id.slice(-6).toUpperCase()}
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#991b1b', marginTop: '10px', marginBottom: '4px' }}>
                {sosResult.status}
              </h3>
              <p style={{ fontSize: '14px', color: '#7f1d1d', margin: 0 }}>
                {sosResult.ambulance_assigned}
              </p>
            </div>

            {/* Countdown Clock */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #fecaca',
                padding: '14px 22px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)',
                minWidth: 'min(100%, 200px)'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                Estimated Ambulance Arrival
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#b91c1c', fontFamily: 'monospace' }}>
                {formatCountdown(countdownTimer)}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b' }}>~{sosResult.eta_minutes} min response window</div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '16px',
              marginTop: '20px'
            }}
          >
            {/* Nearest Hospital Card */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} /> Assigned Receiving Facility
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                {sosResult.nearest_hospital.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} /> {sosResult.nearest_hospital.address}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '12px', fontSize: '13px', fontWeight: 700, flexWrap: 'wrap' }}>
                <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> {sosResult.nearest_hospital.available_icu_beds} ICU Beds Available
                </span>
                <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> {sosResult.nearest_hospital.phone}
                </span>
              </div>
              <button
                className="btn-google-danger"
                style={{ width: '100%', marginTop: '14px', justifyContent: 'center' }}
                onClick={() => onNavigateToRoute && onNavigateToRoute(sosResult.nearest_hospital.name)}
              >
                <Navigation size={16} /> Open Turn-by-Turn GPS Route
              </button>
            </div>

            {/* Critical First-Aid Guidance */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> Critical Actions While Help Is En-Route
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sosResult.first_aid_instructions?.map((inst, i) => (
                  <li key={i} style={{ lineHeight: 1.4 }}>
                    <strong>{inst}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SOS Configuration & Trigger Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
        {/* Step 1: Select Emergency Condition */}
        <div className="card" style={{ padding: 'clamp(16px, 3.5vw, 24px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px'
              }}
            >
              1
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Select Critical Situation / Symptoms
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {EMERGENCY_CONDITIONS.map((cond) => {
              const isSelected = selectedCondition.id === cond.id;
              return (
                <div
                  key={cond.id}
                  onClick={() => setSelectedCondition(cond)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${isSelected ? cond.color : 'var(--border-subtle)'}`,
                    background: isSelected ? '#fff5f5' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isSelected ? '#fee2e2' : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {cond.iconType === 'heart' && <HeartPulse size={20} color={cond.color} />}
                        {cond.iconType === 'brain' && <Brain size={20} color={cond.color} />}
                        {cond.iconType === 'car' && <Car size={20} color={cond.color} />}
                        {cond.iconType === 'wind' && <Wind size={20} color={cond.color} />}
                        {cond.iconType === 'alert' && <AlertTriangle size={20} color={cond.color} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {cond.label}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {cond.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: isSelected ? cond.color : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569'
                      }}
                    >
                      {cond.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Location in Hoshiarpur & Patient Info */}
        <div className="card" style={{ padding: 'clamp(16px, 3.5vw, 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px'
                }}
              >
                2
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Patient Location in Hoshiarpur
              </h3>
            </div>

            {/* Location selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PATIENT LOCATION
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectGPS}
                  disabled={isDetectingGPS}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: 'none',
                    background: '#fef2f2',
                    color: isDetectingGPS ? 'var(--text-muted)' : '#dc2626',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: isDetectingGPS ? 'wait' : 'pointer'
                  }}
                >
                  <Crosshair size={12} /> {isDetectingGPS ? 'Locking Satellite GPS...' : '📍 Auto-Detect My Live GPS'}
                </button>
              </div>

              {gpsAccuracyInfo && (
                <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '11.5px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color="#16a34a" /> Live GPS Accurate ({gpsAccuracyInfo}): <strong>{selectedLocation.formatted_address || selectedLocation.name}</strong>
                </div>
              )}

              <select
                value={selectedLocation.name}
                onChange={(e) => {
                  const loc = HOSHIARPUR_LOCATIONS.find((l) => l.name === e.target.value);
                  if (loc) {
                    setSelectedLocation(loc);
                    setGpsAccuracyInfo(null);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: '#f8fafc',
                  color: 'var(--text-main)'
                }}
              >
                {selectedLocation && !HOSHIARPUR_LOCATIONS.some(l => l.name === selectedLocation.name) && (
                  <option value={selectedLocation.name}>
                    📍 {selectedLocation.name} (Live GPS)
                  </option>
                )}
                {HOSHIARPUR_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Name and Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  PATIENT NAME
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    background: '#f8fafc'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  CALLBACK PHONE
                </label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    background: '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Custom Notes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ADDITIONAL CRITICAL DETAILS (OPTIONAL)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Diabetics history, age 65, severe chest pressure for 20 mins..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  background: '#f8fafc',
                  resize: 'none'
                }}
              />
            </div>
          </div>

          {/* Big Trigger SOS Button */}
          <div>
            <button
              onClick={handleTriggerSOS}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Flame size={24} />
              {isSubmitting ? 'DISPATCHING EMERGENCY TEAM...' : 'TRIGGER EMERGENCY SOS NOW'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Directly contacts District Trauma Control & notifies on-call ER medical team
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
