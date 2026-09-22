import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Navigation, AlertTriangle } from 'lucide-react';
import { fetchMyAppointments, cancelAppointment } from '../api';

export default function AppointmentsPage({ onNavigateToRoute }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">My Appointments</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track consultation schedule, live queue positions, and arrival instructions
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {appointments.map((a) => (
            <div key={a.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className={`pill-badge ${
                        a.status === 'confirmed' ? 'green' : a.status === 'cancelled' ? 'red' : 'blue'
                      }`}
                    >
                      ● {a.status.toUpperCase()}
                    </span>
                    {a.queue_number && (
                      <span className="pill-badge amber">Queue Position: #{a.queue_number}</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
                    {a.doctor_name || 'Specialist Consultation'}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {a.department_name} • {a.hospital_name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    📅 {a.appointment_date}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ⏰ {a.appointment_time?.slice(0, 5)}
                  </div>
                </div>
              </div>

              {a.reason && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
                  <strong>Reason:</strong> {a.reason}
                </div>
              )}

              {a.status === 'cancelled' && a.cancellation_reason && (
                <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '10px', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
                  Cancelled: {a.cancellation_reason}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                  onClick={() => onNavigateToRoute(a.hospital_name || 'City General Hospital')}
                >
                  <Navigation size={14} /> Get Route & ETA
                </button>

                {a.status !== 'cancelled' && (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 16px', color: '#b91c1c' }}
                    onClick={() => setCancellingId(a.id)}
                  >
                    Cancel Slot
                  </button>
                )}
              </div>
            </div>
          ))}
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
