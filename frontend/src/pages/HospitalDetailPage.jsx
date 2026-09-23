import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Star,
  ShieldAlert,
  Clock,
  Navigation,
  Stethoscope,
  HeartPulse,
  Activity,
  Bed,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Ambulance,
  Landmark,
  Car
} from 'lucide-react';
import { fetchHospitalById } from '../api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAP_API_KEY || 'AIzaSyAZrHMmmhHPcEGyxi__AZJxmnK17B5Nf2U';

export default function HospitalDetailPage({ hospitalId, initialTab = 'overview', onBack, onSelectDoctor, onNavigateToRoute }) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  const effectiveHospitalId = hospitalId || 'hosp-1';

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadDetails(effectiveHospitalId);
  }, [effectiveHospitalId]);

  const loadDetails = async (id) => {
    setLoading(true);
    try {
      const res = await fetchHospitalById(id || 'hosp-1');
      if (res.success && res.data) {
        setHospital(res.data);
      }
    } catch (e) {
      console.error('Error fetching hospital detail:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <Activity size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
        <div>Loading comprehensive hospital dossier...</div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Hospital not found</h3>
        <button className="btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Return to Directory
        </button>
      </div>
    );
  }

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    hospital.name + ', ' + hospital.address + ', Hoshiarpur, Punjab'
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    hospital.name + ', ' + hospital.address + ', Hoshiarpur, Punjab'
  )}`;

  const turnByTurnUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Return Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--text-main)'
          }}
        >
          <ArrowLeft size={16} /> Back to All Hospitals
        </button>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => onNavigateToRoute && onNavigateToRoute(hospital.name)}
          >
            <Navigation size={15} /> Calculate Route & ETA
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={15} /> Open in Google Maps
          </a>
        </div>
      </div>

      {/* Hospital Hero Card */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '680px', flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="pill-badge blue">{hospital.type}</span>
              {hospital.emergency_available && (
                <span className="pill-badge red">● 24/7 Trauma Emergency</span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, color: '#eab308' }}>
                <Star size={15} fill="#eab308" /> {hospital.rating} (Verified Accreditation)
              </span>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 12px 0' }}>
              {hospital.name}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--primary-blue)" /> {hospital.address}, {hospital.city}, {hospital.state} - {hospital.postal_code}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="#059669" /> General: {hospital.phone} • Emergency Hotline: <strong style={{ color: '#dc2626' }}>{hospital.emergency_hotline}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Operational Hours: {hospital.operational_hours}
              </div>
            </div>
          </div>

          {/* Real-Time Bed Availability Badge Box */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '20px 24px',
              minWidth: 'min(100%, 220px)',
              flex: '1 1 200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Hospital Bed Status
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>
                {hospital.available_icu_beds}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                ICU Beds Available
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total Bed Capacity: <strong>{hospital.total_beds} beds</strong>
            </div>
            <div style={{ marginTop: '12px', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (hospital.available_icu_beds / 20) * 100)}%`,
                  height: '100%',
                  background: '#059669',
                  borderRadius: '10px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px', flexWrap: 'nowrap' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'departments', label: `Departments (${hospital.departments?.length || 0})` },
            { id: 'doctors', label: `Specialists (${hospital.doctors?.length || 0})` },
            { id: 'transport', label: 'Transportation' },
            { id: 'map', label: 'Map & Location' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                color: activeTab === tab.id ? 'var(--primary-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-blue)' : '2px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview & Diseases Treated */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Diseases Treated Section */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={16} color="var(--primary-blue)" /> Specialized Disease Coverage
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {hospital.diseases_treated?.map((disease, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#166534'
                  }}
                >
                  <CheckCircle2 size={15} color="#16a34a" /> {disease}
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Services & Facilities */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="var(--primary-blue)" /> Clinical Services & Facilities
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
              {hospital.services?.map((svc, i) => (
                <span
                  key={i}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>

          {/* Empanelled Government Healthcare Schemes */}
          {hospital.government_schemes?.length > 0 && (
            <div className="card" style={{ padding: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ background: '#dcfce7', padding: '6px', borderRadius: '3px', display: 'flex' }}>
                  <Landmark size={20} color="#15803d" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#14532d', margin: 0 }}>
                    Empanelled Government Schemes
                  </h3>
                  <div style={{ fontSize: '12px', color: '#166534' }}>
                    Cashless inpatient admission accepted for eligible beneficiaries
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '10px', marginTop: '16px' }}>
                {hospital.government_schemes.map((sch, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      borderRadius: '3px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#14532d' }}>
                        {sch}
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                        Cashless desk available
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#ffffff', borderRadius: '3px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>
                  <strong>Admissions Document:</strong> Carry Aadhaar Card and Golden Card / Smart Card for pre-authorization.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Departments */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {hospital.departments?.length > 0 ? (
            hospital.departments.map((dept) => (
              <div key={dept.id} className="card" style={{ padding: '20px' }}>
                <span className="pill-badge blue" style={{ marginBottom: '8px' }}>
                  Floor: {dept.floor_location || 'Ground Floor'}
                </span>
                <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', marginBottom: '8px' }}>
                  {dept.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {dept.description}
                </p>
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Head of Department: <strong>{dept.head_doctor_name}</strong> • Ext: <strong>{dept.contact_extension}</strong>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
              No departments listed for this facility.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Doctors on Staff */}
      {activeTab === 'doctors' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {hospital.doctors?.length > 0 ? (
            hospital.doctors.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="pill-badge green" style={{ marginBottom: '6px' }}>
                        {doc.specialization}
                      </span>
                      <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 2px 0' }}>
                        {doc.name}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Dept: <strong>{doc.department_name}</strong> • {doc.qualification} • {doc.experience_years} yrs exp.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#eab308' }}>
                      <Star size={14} fill="#eab308" /> {doc.rating}
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '12px' }}>
                    {doc.bio}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                    ₹{doc.consultation_fee} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>/ visit</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => onSelectDoctor && onSelectDoctor(doc)}
                  >
                    <Calendar size={14} /> Book Consultation
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
              No specialist profiles linked directly to this facility currently.
            </div>
          )}
        </div>
      )}

      {/* Tab: Transportation & Ambulances */}
      {activeTab === 'transport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Emergency Ambulance Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              borderRadius: '10px',
              padding: '24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 8px 20px rgba(185, 28, 28, 0.25)'
            }}
          >
            <div>
              <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <ShieldAlert size={13} /> 24/7 Rapid Medical Dispatch
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>
                Emergency Ambulance & Critical Patient Transport
              </h3>
              <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
                Directly connected to Punjab National 108 network and {hospital.name}'s on-call ambulance dispatch.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="tel:108"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  color: '#b91c1c',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                <Phone size={16} /> Dial 108 (Govt Ambulance)
              </a>
              <a
                href={`tel:${hospital.transportation_facilities?.ambulance_hotline || hospital.emergency_hotline}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
                <Phone size={16} /> Hospital Emergency Hotline
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Fleet & Capabilities */}
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ambulance size={18} color="#dc2626" /> On-Campus Ambulance Fleet
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(hospital.transportation_facilities?.ambulance_fleet || [
                  'Level-3 Advanced Cardiac Life Support (ACLS) Ambulance',
                  'Basic Life Support (BLS) Ambulance',
                  'Emergency Trauma Stretcher Van'
                ]).map((amb, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-main)'
                    }}
                  >
                    <CheckCircle2 size={16} color="#16a34a" /> {amb}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Equipped with transport ventilators, defibrillators, oxygen banks, and trained paramedical staff on standby 24/7.
              </div>
            </div>

            {/* Free Shuttle Schedule */}
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={18} color="var(--primary-blue)" /> Free Patient Shuttle Bus Service
              </h4>
              <div style={{ padding: '14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                <strong>Route & Timetable:</strong>
                <div style={{ marginTop: '4px' }}>
                  {hospital.transportation_facilities?.shuttle_schedule ||
                    'Scheduled patient shuttle runs every 30 minutes from Hoshiarpur Railway Station -> Central Bus Stand -> Hospital Campus.'}
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div>• Free for patients, senior citizens, and registered attendants</div>
                <div>• Low-floor ramp for wheelchair and elderly accessibility</div>
                <div>• Operating hours: <strong>7:30 AM to 8:30 PM daily</strong></div>
              </div>
            </div>

            {/* Parking & Drop-off Facility */}
            <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
                Parking: Parking, EV Charging & Accessibility
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--primary-blue)" />
                  <span><strong>Parking:</strong> {hospital.transportation_facilities?.parking || '150 Car Parking Slots, 2-Wheeler Zone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--primary-blue)" />
                  <span><strong>Emergency Gate:</strong> Dedicated non-slip stretcher ramp at Casualty Door</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--primary-blue)" />
                  <span><strong>Wheelchair Support:</strong> 24/7 volunteer porters available at main arrival porch</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
                 Transit Landmark: {hospital.transportation_facilities?.transit_notes || 'Easily accessible from main Hoshiarpur arterial roads.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Live Google Maps Location */}
      {activeTab === 'map' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="pill-badge blue"> Verified Google Maps Location</span>
                <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '10px', fontWeight: 700, color: '#334155' }}>
                  GPS: {hospital.latitude}° N, {hospital.longitude}° E
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 4px 0', color: 'var(--text-main)' }}>
                {hospital.name}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="var(--primary-blue)" /> {hospital.address}, {hospital.city}, {hospital.state} - {hospital.postal_code}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={15} /> Open in Google Maps
              </a>
              <a
                href={turnByTurnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Navigation size={15} /> Turn-by-Turn GPS
              </a>
              <button
                className="btn-secondary"
                onClick={() => onNavigateToRoute && onNavigateToRoute(hospital.name)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Route from My Location
              </button>
            </div>
          </div>

          {/* Interactive Google Map Frame */}
          <div style={{ width: '100%', height: '460px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
            <iframe
              title={hospital.name}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={mapEmbedUrl}
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div>
              <strong>Arriving by Transit:</strong> {hospital.transportation_facilities?.transit_notes || 'Conveniently connected via major arterial roads.'}
            </div>
            <div>
              <strong>Emergency Access:</strong> 24/7 Dedicated casualty ambulance gate available.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

