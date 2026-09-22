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
  Mail,
  Send,
  Check,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import {
  fetchMyAppointments,
  cancelAppointment,
  sendAppointmentReminder,
  submitDoctorRating
} from '../api';

export default function AppointmentsPage({ onNavigateToRoute }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Rating Modal State
  const [ratingAppt, setRatingAppt] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Accurate Diagnosis', 'Clear Medicine Schedule']);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');

  // Resend Reminder State
  const [reminderSendingId, setReminderSendingId] = useState(null);
  const [reminderToast, setReminderToast] = useState('');

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
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetchMyAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error(e);
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


  const handleSendReminder = async (appt) => {
    setReminderSendingId(appt.id);
    try {
      const res = await sendAppointmentReminder(appt.id);
      if (res.success) {
        setReminderToast(`🔔 Resend reminder email sent for consultation with ${appt.doctor_name || 'your doctor'}!`);
        setTimeout(() => setReminderToast(''), 4500);
        loadAppointments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReminderSendingId(null);
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
        setRatingSuccess(`Review submitted successfully! ${res.data?.doctor?.name} rating updated to ${res.data?.doctor?.rating}★.`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast alert for Resend */}
      {reminderToast && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 16px rgba(37,99,235,0.2)',
          fontWeight: 600,
          fontSize: '13px'
        }}>
          <Mail size={18} color="#93c5fd" />
          <span>{reminderToast}</span>
        </div>
      )}

      <div className="section-header">
        <div>
          <h2 className="section-title">My Appointments & Verified Reviews</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track consultation schedules, receive automatic Resend date reminders, and rate completed doctor visits
          </div>
        </div>
        <button className="btn-secondary" onClick={loadAppointments}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Calendar size={40} color="var(--primary-blue)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Appointments Yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Book a consultation with our verified doctors to start your healthcare journey.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {appointments.map((a) => {
            const isCompleted = a.status === 'completed';
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

                      {a.reminder_sent && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#ecfdf5',
                          color: '#065f46',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          border: '1px solid #a7f3d0'
                        }}>
                          <Mail size={12} /> Resend Reminder Sent
                        </span>
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
                          borderRadius: '9999px'
                        }}>
                          <Star size={12} fill="#d97706" color="#d97706" /> Rated {a.patient_rating}★
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '10px' }}>
                      {a.doctor_name || 'Specialist Consultation'}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {a.department_name} • <strong>{a.hospital_name}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                      📅 {a.appointment_date}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ⏰ {a.appointment_time?.slice(0, 5)}
                    </div>
                  </div>
                </div>

                {a.reason && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
                    <strong>Clinical Reason:</strong> {a.reason}
                  </div>
                )}

                {a.notes && (
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #cbd5e1' }}>
                    <strong>Facility Desk Note:</strong> {a.notes}
                  </div>
                )}

                {isCancelled && a.cancellation_reason && (
                  <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
                    Cancelled: {a.cancellation_reason}
                  </div>
                )}

                {/* Bottom Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                  {/* Route & ETA */}
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                    onClick={() => onNavigateToRoute(a.hospital_name || 'Ivy Hospital Hoshiarpur')}
                  >
                    <Navigation size={14} /> Get Route & ETA
                  </button>

                  {/* Rating button - strictly enabled when appointment is completed */}
                  {isCompleted ? (
                    <button
                      onClick={() => openRatingModal(a)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: a.patient_rating ? '#fef3c7' : '#059669',
                        color: a.patient_rating ? '#92400e' : '#ffffff',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Star size={14} fill={a.patient_rating ? '#d97706' : '#ffffff'} />
                      {a.patient_rating ? `Update Rating (${a.patient_rating}★)` : '⭐ Rate Doctor (Verified Consultation)'}
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
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <Info size={13} /> Rating unlocks after consultation is completed
                    </div>
                  )}

                  {/* Resend Reminder Email trigger */}
                  {!isCancelled && (
                    <button
                      onClick={() => handleSendReminder(a)}
                      disabled={reminderSendingId === a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid #bfdbfe',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Send size={13} />
                      {reminderSendingId === a.id ? 'Sending Resend...' : 'Email Reminder (Resend)'}
                    </button>
                  )}


                  {/* Cancel Slot */}
                  {!isCancelled && !isCompleted && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '8px 16px', color: '#b91c1c', marginLeft: 'auto' }}
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
            style={{ width: '480px', maxWidth: '92%', margin: 'auto', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> {ratingError}
              </div>
            )}

            {ratingSuccess && (
              <div style={{ padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} /> {ratingSuccess}
              </div>
            )}

            <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Star Rating Picker */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                  Select Consultation Score
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          background: active ? '#2563eb' : '#f1f5f9',
                          color: active ? '#ffffff' : '#334155',
                          border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {active ? '✓ ' : '+ '} {tag}
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
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setRatingAppt(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingRating}
                  style={{ flex: 2, justifyContent: 'center', background: '#059669' }}
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
          <div className="card" style={{ width: '400px', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
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
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setCancellingId(null)}>
                Keep Slot
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: '#dc2626' }}
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
