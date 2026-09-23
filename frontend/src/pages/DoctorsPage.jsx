import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Star,
  Calendar,
  Clock,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  X,
  Filter,
  ArrowRight,
  Phone,
  Droplet,
  CreditCard
} from 'lucide-react';
import { fetchDoctors, fetchDoctorAvailability, bookAppointment, fetchHospitals } from '../api';

const getDoctorBannerTheme = (doc, index) => {
  const spec = (doc.specialization || '').toLowerCase();
  if (spec.includes('cardio')) return 'banner-theme-blue';
  if (spec.includes('neuro')) return 'banner-theme-purple';
  if (spec.includes('ortho')) return 'banner-theme-amber';
  if (spec.includes('eye') || spec.includes('ophth')) return 'banner-theme-emerald';
  if (spec.includes('emerg') || spec.includes('trauma')) return 'banner-theme-red';
  if (spec.includes('gyn') || spec.includes('obstet')) return 'banner-theme-purple';
  const themes = ['banner-theme-blue', 'banner-theme-teal', 'banner-theme-emerald', 'banner-theme-purple'];
  return themes[index % themes.length];
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DoctorsPage({
  currentUser,
  onSelectDoctor,
  preselectedHospital,
  initialDoctorToBook,
  onClearDoctorToBook,
  onNavigateToAppointments
}) {
  const [doctors, setDoctors] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(preselectedHospital?.id || 'all');
  const [specialization, setSpecialization] = useState('All');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(getTodayString());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSlots = async (docId, date) => {
    setLoadingSlots(true);
    try {
      const res = await fetchDoctorAvailability(docId, date);
      if (res.success && res.data) {
        const slots = res.data.available_slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0) {
          // Auto-select the first available slot so the user is ready to book immediately
          setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0]));
        } else {
          setSelectedSlot('');
        }
      } else {
        setAvailableSlots([]);
        setSelectedSlot('');
      }
    } catch (e) {
      console.error('Error fetching slots:', e);
      setAvailableSlots([]);
      setSelectedSlot('');
    } finally {
      setLoadingSlots(false);
    }
  };

  const openBookingModal = async (doc) => {
    if (!doc) return;
    setBookingDoctor(doc);
    setBookingSuccess(null);
    setBookingError('');
    setSelectedSlot('');
    setReason('');

    // Pre-populate phone and blood group from logged in user or auth storage
    let activePhone = currentUser?.phone || '';
    let activeBloodGroup = currentUser?.blood_group || '';
    if (!activePhone || !activeBloodGroup) {
      try {
        const stored = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (!activePhone && stored.phone) activePhone = stored.phone;
        if (!activeBloodGroup && stored.blood_group) activeBloodGroup = stored.blood_group;
      } catch (err) {
        // ignore JSON parse error
      }
    }
    // Reliable defaults so guest users are never roadblocked
    if (!activePhone) activePhone = '9876543210';
    if (!activeBloodGroup) activeBloodGroup = 'B+';

    setPatientPhone(activePhone);
    setBloodGroup(activeBloodGroup);

    await loadSlots(doc.id, appointmentDate);
  };

  const closeBookingModal = () => {
    setBookingDoctor(null);
    onClearDoctorToBook?.();
  };

  // Load hospitals for the filter dropdown
  useEffect(() => {
    fetchHospitals().then((res) => {
      if (res.success && res.data) {
        setHospitalsList(res.data);
      }
    });
  }, []);

  // Sync preselectedHospital if prop changes
  useEffect(() => {
    if (preselectedHospital?.id) {
      setSelectedHospitalId(preselectedHospital.id);
    }
  }, [preselectedHospital]);

  // Sync initialDoctorToBook if prop provided
  useEffect(() => {
    if (initialDoctorToBook) {
      openBookingModal(initialDoctorToBook);
    }
  }, [initialDoctorToBook]);

  // Load doctors filtered by hospital and specialization
  useEffect(() => {
    loadDoctors();
  }, [specialization, selectedHospitalId]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (specialization !== 'All') {
        params.specialization = specialization;
      }
      if (selectedHospitalId && selectedHospitalId !== 'all') {
        params.hospital_id = selectedHospitalId;
      }
      const res = await fetchDoctors(params);
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    if (bookingDoctor) {
      await loadSlots(bookingDoctor.id, newDate);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setBookingError('Please select a time slot for your appointment.');
      return;
    }

    const phoneToUse = patientPhone.trim() || '9876543210';
    const bloodToUse = bloodGroup || 'B+';

    setIsSubmitting(true);
    setBookingError('');
    try {
      const res = await bookAppointment({
        doctor_id: bookingDoctor.id,
        hospital_id: bookingDoctor.hospital_id,
        department_id: bookingDoctor.department_id,
        appointment_date: appointmentDate,
        appointment_time: selectedSlot.length === 5 ? selectedSlot + ':00' : selectedSlot,
        reason: reason.trim() || 'General OPD Consultation',
        patient_phone: phoneToUse,
        blood_group: bloodToUse
      });

      if (res.success && res.data) {
        setBookingSuccess(res.data);
      } else {
        const errorDetail = res.detail || res.message;
        let message = 'Failed to book appointment. Please try another slot.';
        if (typeof errorDetail === 'string') {
          message = errorDetail;
        } else if (Array.isArray(errorDetail)) {
          message = errorDetail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', ');
        }
        setBookingError(message);
      }
    } catch (e) {
      setBookingError('An error occurred during booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentHospitalObj = hospitalsList.find(
    (h) => String(h.id) === String(selectedHospitalId)
  );

  const categories = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Gynecology', 'Pulmonology', 'Ophthalmology', 'Surgery', 'Emergency Medicine'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Filter Controls: Specific Hospital Selector + Specialty Filter */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          {/* Hospital Selector Dropdown */}
          <div style={{ flex: '1 1 320px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Building2 size={15} color="var(--primary-blue)" /> Filter by Specific Hospital
            </label>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: selectedHospitalId !== 'all' ? '2px solid #2563eb' : '1px solid var(--border-subtle)',
                background: selectedHospitalId !== 'all' ? '#eff6ff' : '#f8fafc',
                color: selectedHospitalId !== 'all' ? '#1e40af' : 'var(--text-main)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Hospitals in Hoshiarpur (View All Specialists)</option>
              {hospitalsList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Active Hospital Indicator & Reset */}
          {selectedHospitalId !== 'all' && currentHospitalObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 16px', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                  Active Hospital Focus
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                  {currentHospitalObj.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHospitalId('all')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #6ee7b7',
                  color: '#065f46',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} /> Show All Hospitals
              </button>
            </div>
          )}
        </div>

        {/* Specialization Pills */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Stethoscope size={13} /> Filter by Medical Specialty
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSpecialization(cat)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: specialization === cat ? 'var(--primary-blue)' : '#f1f5f9',
                  color: specialization === cat ? '#ffffff' : '#475569',
                  border: specialization === cat ? '1px solid var(--primary-blue)' : '1px solid #e2e8f0',
                  transition: 'all 0.1s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hospital Context Banner if a specific hospital is selected */}
      {currentHospitalObj && (
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                {currentHospitalObj.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={12} /> {currentHospitalObj.address}, Hoshiarpur • Fee: <strong>₹{currentHospitalObj.consultation_fee}</strong>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', padding: '6px 12px', borderRadius: '10px' }}>
            {doctors.length} Specialist{doctors.length === 1 ? '' : 's'} on Roster
          </div>
        </div>
      )}

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading specialists for selected hospital...
        </div>
      ) : doctors.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Building2 size={40} color="var(--primary-blue)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            No Doctors Found for Selected Criteria
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Try switching to "All Hospitals" or resetting your specialty filter.
          </p>
          <button
            className="btn-primary"
            onClick={() => { setSelectedHospitalId('all'); setSpecialization('All'); }}
            style={{ margin: '0 auto' }}
          >
            Show All Doctors in All Hospitals
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '22px' }}>
          {doctors.map((doc, index) => (
            <div key={doc.id} className="classroom-card">
              {/* Google Classroom Style Thematic Banner Cover */}
              <div
                className={`classroom-card-banner ${getDoctorBannerTheme(doc, index)}`}
                onClick={() => onSelectDoctor && onSelectDoctor(doc)}
                title="Click to view doctor dossier"
              >
                <div className="banner-top-row">
                  <span className="banner-badge">{doc.specialization}</span>
                  <div className="banner-rating-pill">
                    <Star size={13} fill="#ffffff" color="#ffffff" />
                    <span>{doc.rating || 4.9}</span>
                  </div>
                </div>

                <div>
                  <h3 className="banner-title">{doc.name}</h3>
                  <div className="banner-subtitle">
                    {doc.hospital_name || 'Hoshiarpur Medical Center'}
                  </div>
                </div>

                {/* Overlapping Circular Doctor Avatar */}
                <div className="classroom-card-avatar" style={{ overflow: 'hidden' }}>
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"
                    alt={doc.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* Clean Scannable Card Body */}
              <div className="classroom-card-body">
                {/* Department & Qualifications */}
                <div className="classroom-meta-row">
                  <Stethoscope size={16} color="var(--primary-blue)" />
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>
                    Dept: <strong>{doc.department_name}</strong> • {doc.qualification}
                  </span>
                </div>

                {/* Experience */}
                <div className="classroom-meta-row">
                  <Award size={16} color="#059669" />
                  <span style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                    <strong>{doc.experience_years || 10}+ years</strong> clinical practice in Hoshiarpur
                  </span>
                </div>

                {/* Consultation Fee */}
                <div className="classroom-meta-row">
                  <CreditCard size={16} color="var(--primary-blue)" />
                  <span style={{ fontSize: '13px' }}>
                    Consultation Fee: <strong style={{ color: 'var(--primary-blue)', fontSize: '15px' }}>₹{doc.consultation_fee}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>(Hospital OPD)</span>
                  </span>
                </div>
              </div>

              {/* High-Visibility Action Footer */}
              <div className="classroom-card-footer">
                <button
                  type="button"
                  className="btn-google-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBookingModal(doc);
                  }}
                  style={{ flex: 1.2 }}
                >
                  <Calendar size={15} /> Book Appointment
                </button>

                <button
                  type="button"
                  className="btn-google-outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDoctor && onSelectDoctor(doc);
                  }}
                  title="View Doctor Profile"
                  style={{ flex: 1 }}
                >
                  Profile <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Booking Modal */}
      {bookingDoctor && (
        <div className="doctor-drawer-overlay" onClick={closeBookingModal}>
          <div
            className="card"
            style={{
              width: '540px',
              maxWidth: '94%',
              margin: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '10px',
              padding: '28px 30px',
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              zIndex: 100000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Book Consultation with {bookingDoctor.name}
                </h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                  <Building2 size={13} /> {bookingDoctor.hospital_name}
                </div>
              </div>
              <button
                type="button"
                onClick={closeBookingModal}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              Specialty: <strong>{bookingDoctor.specialization}</strong> • Dept: <strong>{bookingDoctor.department_name}</strong> • Consultation Fee: <strong style={{ color: 'var(--primary-blue)' }}>₹{bookingDoctor.consultation_fee}</strong>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px 0' }}>
                <CheckCircle2 size={52} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', margin: '0 0 6px 0' }}>Appointment Confirmed!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Your appointment at <strong>{bookingDoctor.hospital_name}</strong> is scheduled for <strong>{bookingSuccess.appointment_date}</strong> at <strong>{bookingSuccess.appointment_time?.slice(0, 5)}</strong>.
                </p>
                <div style={{ margin: '14px 0', padding: '12px', background: '#eff6ff', borderRadius: '10px', fontSize: '15px', color: 'var(--primary-blue)', fontWeight: 800, border: '1px solid #bfdbfe' }}>
                  Token Queue Number: #{bookingSuccess.queue_number || 1}
                </div>
                <div style={{ margin: '8px 0 20px 0', fontSize: '13px', color: '#475569' }}>
                  Patient Mobile: <strong>{bookingSuccess.patient_phone || patientPhone}</strong> • Blood Group: <strong style={{ color: '#b91c1c' }}>{bookingSuccess.blood_group || bloodGroup}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {onNavigateToAppointments && (
                    <button
                      type="button"
                      className="btn-google-primary"
                      style={{ flex: 1.4, justifyContent: 'center', padding: '11px 16px' }}
                      onClick={() => {
                        closeBookingModal();
                        onNavigateToAppointments();
                      }}
                    >
                      <Calendar size={15} /> View in My Appointments
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-google-outline"
                    style={{ flex: 1, justifyContent: 'center', padding: '11px 16px' }}
                    onClick={closeBookingModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookingError && (
                  <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {bookingError}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Consultation Date</label>
                    {/* Quick date chips */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[0, 1, 2].map((offset) => {
                        const target = new Date();
                        target.setDate(target.getDate() + offset);
                        const y = target.getFullYear();
                        const m = String(target.getMonth() + 1).padStart(2, '0');
                        const d = String(target.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${d}`;
                        const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : target.toLocaleDateString('en-US', { weekday: 'short' });
                        const isSelected = appointmentDate === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              setAppointmentDate(dateStr);
                              if (bookingDoctor) loadSlots(bookingDoctor.id, dateStr);
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '10px',
                              border: isSelected ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                              background: isSelected ? '#eff6ff' : '#f8fafc',
                              color: isSelected ? 'var(--primary-blue)' : 'var(--text-muted)',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={appointmentDate}
                    min={getTodayString()}
                    onChange={handleDateChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Hospital Consultation Slots for {appointmentDate}
                    </label>
                    {loadingSlots && (
                      <span style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                        Updating slots...
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '6px' }}>
                    {loadingSlots ? (
                      <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--text-muted)', padding: '12px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                        Loading doctor slots...
                      </div>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            style={{
                              padding: '8px 10px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '10px',
                              background: isSelected ? 'var(--primary-blue)' : '#f8fafc',
                              color: isSelected ? '#ffffff' : 'var(--text-main)',
                              border: isSelected ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                              transition: 'all 0.15s ease'
                            }}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            <Clock size={12} style={{ marginRight: '4px' }} /> {slot}
                          </button>
                        );
                      })
                    ) : (
                      <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: '#b91c1c', padding: '12px', background: '#fee2e2', borderRadius: '10px', textAlign: 'center' }}>
                        No slots available for this date. Please select another date.
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Mobile Number & Blood Group Intake */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={13} color="var(--primary-blue)" /> Patient Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91-98765-43210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '6px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Droplet size={13} color="#ef4444" /> Blood Group *
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '6px',
                        fontSize: '13px',
                        background: '#ffffff',
                        fontWeight: 600
                      }}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+ (A Positive)</option>
                      <option value="A-">A- (A Negative)</option>
                      <option value="B+">B+ (B Positive)</option>
                      <option value="B-">B- (B Negative)</option>
                      <option value="AB+">AB+ (AB Positive)</option>
                      <option value="AB-">AB- (AB Negative)</option>
                      <option value="O+">O+ (O Positive)</option>
                      <option value="O-">O- (O Negative)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Primary Symptoms or Reason for Visit</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Chest pain follow-up, knee pain evaluation, routine checkup..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      marginTop: '6px',
                      fontSize: '13px',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn-google-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '13px 18px',
                    fontSize: '14px',
                    fontWeight: 800,
                    borderRadius: '10px',
                    cursor: (isSubmitting || loadingSlots || !selectedSlot) ? 'not-allowed' : 'pointer',
                    opacity: (isSubmitting || loadingSlots || !selectedSlot) ? 0.7 : 1
                  }}
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting || loadingSlots || !selectedSlot}
                >
                  <Calendar size={16} />{' '}
                  {isSubmitting
                    ? 'Confirming with Hospital...'
                    : loadingSlots
                    ? 'Loading Slots...'
                    : !selectedSlot
                    ? 'Please Select a Slot'
                    : `Confirm Appointment at ${bookingDoctor.hospital_name || 'Hospital'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
