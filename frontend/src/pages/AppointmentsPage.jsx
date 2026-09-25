import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  AlertTriangle,
  Star,
  Check,
  Award,
  Sparkles,
  Info,
  Phone,
  Droplet
} from 'lucide-react';
import {
  fetchMyAppointments,
  cancelAppointment,
  submitDoctorRating
} from '../api';

export default function AppointmentsPage({ onNavigateToRoute }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'upcoming' | 'done'

  // Rating Modal State
  const [ratingAppt, setRatingAppt] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Accurate Diagnosis', 'Clear Medicine Schedule']);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');

  const AVAILABLE_TAGS = [
    'Accurate Diagnosis',
    'Clear Medicine Schedule',
    'Compassionate Care',
    'Minimal Wait Time',
    'Explained Treatment Well',
    'Helpful Diet Advice',
    'Thorough Checkup'
  ];

  useEffect(() => {
    // Clear stale cached appointment data on mount
    localStorage.removeItem('carelink_customer_appointments_history');
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // 1. Read cached historical appointments
      const cachedRaw = localStorage.getItem('carelink_customer_appointments_history');
      let cachedList = [];
      if (cachedRaw) {
        try {
          cachedList = JSON.parse(cachedRaw);
        } catch (e) {
          console.error('Error parsing appointment cache', e);
        }
      }

      // 2. Fetch server appointments
      const res = await fetchMyAppointments();
      if (!res?.success || !Array.isArray(res.data)) {
        throw new Error(res?.detail || res?.message || 'Could not load appointments. Please sign in again and retry.');
      }
      const serverList = res.data;

      // 3. Merge server list with cached history by appointment ID
      const map = new Map();
      if (Array.isArray(cachedList)) {
        cachedList.forEach((a) => {
          if (a && a.id) map.set(a.id, a);
        });
      }
      if (Array.isArray(serverList)) {
        serverList.forEach((a) => {
          if (a && a.id) {
            // Merge with existing properties
            const existing = map.get(a.id) || {};
            map.set(a.id, { ...existing, ...a });
          }
        });
      }

      const merged = Array.from(map.values());
      // Show the most recently booked appointment first.
      merged.sort((a, b) => {
        const bookedAtA = a.created_at || '';
        const bookedAtB = b.created_at || '';
        const bookedOrder = bookedAtB.localeCompare(bookedAtA);
        if (bookedOrder !== 0) return bookedOrder;

        const dateOrder = (b.appointment_date || '').localeCompare(a.appointment_date || '');
        if (dateOrder !== 0) return dateOrder;
        return (b.appointment_time || '').localeCompare(a.appointment_time || '');
      });

      setAppointments(merged);
      localStorage.setItem('carelink_customer_appointments_history', JSON.stringify(merged));
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'Could not load appointments. Please sign in again and retry.');
      // Fallback cache
      const cachedRaw = localStorage.getItem('carelink_customer_appointments_history');
      if (cachedRaw) {
        try {
          setAppointments(JSON.parse(cachedRaw));
        } catch (err) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await cancelAppointment(id, cancelReason);
      if (res.success) {
        setCancellingId(null);
        setCancelReason('');
        loadAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openRatingModal = (appt) => {
    setRatingAppt(appt);
    setSelectedStars(appt.patient_rating || 5);
    setReviewComment('');
    setSelectedTags(['Accurate Diagnosis', 'Clear Medicine Schedule']);
    setRatingError('');
    setRatingSuccess('');
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingAppt) return;
    setIsSubmittingRating(true);
    setRatingError('');
    try {
      const payload = {
        appointment_id: ratingAppt.id,
        rating: selectedStars,
        comment: reviewComment || 'Consultation completed. Excellent clinical guidance.',
        tags: selectedTags
      };
      const res = await submitDoctorRating(ratingAppt.doctor_id, payload);
      if (res.success) {
        // Update local appointment state immediately
        const updatedList = appointments.map((a) =>
          a.id === ratingAppt.id ? { ...a, patient_rating: selectedStars, notes: payload.comment } : a
        );
        setAppointments(updatedList);
        localStorage.setItem('carelink_customer_appointments_history', JSON.stringify(updatedList));

        setRatingSuccess(`Review submitted successfully! ${res.data?.doctor?.name || 'Doctor'} rating updated to ${res.data?.doctor?.rating || selectedStars}.`);
        setTimeout(() => {
          setRatingAppt(null);
          loadAppointments();
        }, 1500);
      } else {
        setRatingError(res.message || res.detail || 'Failed to submit rating.');
      }
    } catch (err) {
      setRatingError('An error occurred submitting your review.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const upcomingAppointments = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const doneAppointments = appointments.filter((a) => ['completed', 'done', 'settled', 'cancelled'].includes(a.status));
  const displayedAppointments = activeFilter === 'upcoming'
    ? upcomingAppointments
    : activeFilter === 'done'
    ? doneAppointments
    : appointments;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">My Appointments & Clinical History</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track your consultation schedules, review verified past visits, and rate completed doctor appointments
          </div>
        </div>
        <button className="btn-google-outline" style={{ borderRadius: '3px' }} onClick={loadAppointments}>
          Refresh
        </button>
      </div>

      {/* Segmented Filter Controls — Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: activeFilter === 'all' ? 700 : 500,
            background: activeFilter === 'all' ? 'var(--primary-blue)' : '#ffffff',
            color: activeFilter === 'all' ? '#ffffff' : 'var(--text-main)',
            border: '1px solid ' + (activeFilter === 'all' ? 'var(--primary-blue)' : 'var(--border-subtle)'),
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          All ({appointments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('upcoming')}
          style={{
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: activeFilter === 'upcoming' ? 700 : 500,
            background: activeFilter === 'upcoming' ? 'var(--primary-blue)' : '#ffffff',
            color: activeFilter === 'upcoming' ? '#ffffff' : 'var(--text-main)',
            border: '1px solid ' + (activeFilter === 'upcoming' ? 'var(--primary-blue)' : 'var(--border-subtle)'),
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Upcoming ({upcomingAppointments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('done')}
          style={{
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: activeFilter === 'done' ? 700 : 500,
            background: activeFilter === 'done' ? 'var(--primary-blue)' : '#ffffff',
            color: activeFilter === 'done' ? '#ffffff' : 'var(--text-main)',
            border: '1px solid ' + (activeFilter === 'done' ? 'var(--primary-blue)' : 'var(--border-subtle)'),
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Done ({doneAppointments.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your appointments...
        </div>
      ) : loadError ? (
        <div className="card" role="alert" style={{ textAlign: 'center', padding: '32px', borderRadius: '5px' }}>
          <AlertTriangle size={32} color="#9a6b37" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Appointments could not be loaded</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 14px' }}>{loadError}</p>
          <button className="btn-google-outline" onClick={loadAppointments}>Try again</button>
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', borderRadius: '3px' }}>
          <Calendar size={40} color="var(--primary-blue)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            {activeFilter === 'upcoming'
              ? 'No Upcoming Consultations'
              : activeFilter === 'done'
              ? 'No Completed Appointments'
              : 'No Appointments Found'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeFilter === 'upcoming'
              ? 'You do not have any pending or confirmed upcoming consultations.'
              : 'Book a consultation with our verified doctors to start your healthcare journey.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedAppointments.map((a) => {
            const isCompleted = ['completed', 'done', 'settled'].includes(a.status);
            const isCancelled = a.status === 'cancelled';
            const isConfirmed = a.status === 'confirmed';

            return (
              <div
                key={a.id}
                className="card"
                style={{
                  padding: '22px',
                  borderLeft: isCompleted
                    ? '4px solid #10b981'
                    : isConfirmed
                    ? '4px solid #2563eb'
                    : isCancelled
                    ? '4px solid #ef4444'
                    : '4px solid #f59e0b'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span
                        className={`pill-badge ${
                          isCompleted ? 'green' : isConfirmed ? 'blue' : isCancelled ? 'red' : 'amber'
                        }`}
                      >
                        ● {a.status.toUpperCase()}
                      </span>

                      {a.queue_number && (
                        <span className="pill-badge amber">Queue Token: #{a.queue_number}</span>
                      )}
                      {a.patient_rating && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#fef3c7',
                          color: '#92400e',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '3px'
                        }}>
                          <Star size={12} fill="#d97706" color="#d97706" /> Rated {a.patient_rating}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '10px' }}>
                      {a.doctor_name || 'Specialist Consultation'}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {a.department_name} • <strong>{a.hospital_name}</strong> • <span style={{ color: '#b45309', fontWeight: 600 }}>📍 {a.room_number || 'Room 101, Main OPD'}</span>
                    </div>

                    {(a.patient_phone || a.blood_group) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', flexWrap: 'wrap' }}>
                        {a.patient_phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                            <Phone size={12} color="var(--primary-blue)" /> {a.patient_phone}
                          </span>
                        )}
                        {a.blood_group && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', color: '#b91c1c', padding: '2px 8px', borderRadius: '3px', fontWeight: 700, border: '1px solid #fee2e2' }}>
                            <Droplet size={12} color="#ef4444" /> Blood: {a.blood_group}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                    <div style={{ minWidth: '130px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--primary-blue)" /> {a.appointment_date}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} /> {a.appointment_time?.slice(0, 5)}
                      </div>
                    </div>
                  </div>

                  {a.reason && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '3px' }}>
                      <strong>Clinical Reason:</strong> {a.reason}
                    </div>
                  )}

                  {a.notes && (
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '3px', borderLeft: '3px solid #cbd5e1' }}>
                      <strong>Facility Desk Note:</strong> {a.notes}
                    </div>
                  )}

                  {isCancelled && a.cancellation_reason && (
                    <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '3px' }}>
                      Cancelled: {a.cancellation_reason}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Route & ETA */}
                    <button
                      className="btn-google-outline"
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                      onClick={() => onNavigateToRoute(a.hospital_name || 'Ivy Hospital Hoshiarpur')}
                    >
                      <Navigation size={14} /> Get Route & ETA
                    </button>

                    {/* Rating button - strictly enabled when appointment is completed */}
                    {isCompleted ? (
                      <button
                        className="btn-google-primary"
                        onClick={() => openRatingModal(a)}
                        style={{
                          fontSize: '12px',
                          padding: '8px 16px',
                          background: a.patient_rating ? '#fef3c7' : '#0d904f',
                          color: a.patient_rating ? '#92400e' : '#ffffff',
                          borderColor: a.patient_rating ? '#fde68a' : '#0d904f'
                        }}
                      >
                        <Star size={14} fill={a.patient_rating ? '#d97706' : '#ffffff'} color={a.patient_rating ? '#d97706' : '#ffffff'} />
                        {a.patient_rating ? `Update Rating (${a.patient_rating} / 5)` : 'Rate Doctor (Verified Consultation)'}
                      </button>
                    ) : (
                    <div
                      title="Doctor rating is strictly allowed only after consultation is completed."
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        color: '#64748b',
                        background: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <Info size={13} /> Rating unlocks after consultation is completed
                    </div>
                  )}

                  {/* Cancel Slot */}
                  {!isCancelled && !isCompleted && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '8px 16px', color: '#b91c1c', borderRadius: '3px' }}
                      onClick={() => setCancellingId(a.id)}
                    >
                      Cancel Slot
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verified Doctor Rating Modal */}
      {ratingAppt && (
        <div className="doctor-drawer-overlay" onClick={() => setRatingAppt(null)}>
          <div
            className="card"
            style={{ width: '480px', maxWidth: 'min(480px, 94vw)', margin: 'auto', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '3px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> Verified Completed Consultation
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
              Rate {ratingAppt.doctor_name || 'Attending Doctor'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Consultation completed on {ratingAppt.appointment_date} at {ratingAppt.hospital_name}.
            </p>

            {ratingError && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '3px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {ratingError}
              </div>
            )}

            {ratingSuccess && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: '3px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} /> {ratingSuccess}
              </div>
            )}

            <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Star Rating Picker */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                  Select Consultation Score
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: (hoverStars || selectedStars) >= star ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <Star
                        size={32}
                        color="#f59e0b"
                        fill={(hoverStars || selectedStars) >= star ? '#f59e0b' : 'none'}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', marginLeft: '6px' }}>
                    {selectedStars} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Experience Tags */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                  Consultation Highlights
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {AVAILABLE_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: active ? 'var(--primary-blue)' : '#f1f3f4',
                          color: active ? '#ffffff' : 'var(--text-main)',
                          border: active ? '1px solid var(--primary-blue)' : '1px solid #dadce0',
                          padding: '6px 12px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {active && <Check size={12} strokeWidth={3} />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Feedback / Consultation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details about the doctor's explanation, bedside manner, or treatment efficacy..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-google-outline"
                  style={{ flex: 1, minWidth: '100px', justifyContent: 'center', borderRadius: '3px' }}
                  onClick={() => setRatingAppt(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-google-primary"
                  disabled={isSubmittingRating}
                  style={{ flex: 2, minWidth: '160px', justifyContent: 'center', background: '#0d904f', borderColor: '#0d904f', borderRadius: '3px' }}
                >
                  {isSubmittingRating ? 'Publishing...' : 'Submit Verified Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {cancellingId && (
        <div className="doctor-drawer-overlay" onClick={() => setCancellingId(null)}>
          <div className="card" style={{ width: '400px', maxWidth: 'min(400px, 94vw)', margin: 'auto', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '3px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Cancel Appointment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Are you sure you want to cancel this appointment? Please state a reason:
            </p>
            <input
              type="text"
              placeholder="e.g. Rescheduling, feeling better, conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-google-outline" style={{ flex: 1, minWidth: '100px', justifyContent: 'center', borderRadius: '3px' }} onClick={() => setCancellingId(null)}>
                Keep Slot
              </button>
              <button
                className="btn-google-danger"
                style={{ flex: 1, minWidth: '120px', justifyContent: 'center', borderRadius: '3px' }}
                onClick={() => handleCancel(cancellingId)}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
