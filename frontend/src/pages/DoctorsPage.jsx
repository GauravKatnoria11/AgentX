import React, { useState, useEffect } from 'react';
import { Stethoscope, Star, Calendar, Clock, DollarSign, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchDoctors, fetchDoctorAvailability, bookAppointment } from '../api';

export default function DoctorsPage({ onSelectDoctor, preselectedHospital }) {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState('All');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('2026-09-28');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, [specialization, preselectedHospital]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (specialization !== 'All') {
        params.specialization = specialization;
      }
      if (preselectedHospital) {
        params.hospital_id = preselectedHospital.id;
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

  const openBookingModal = async (doc) => {
    setBookingDoctor(doc);
    setBookingSuccess(null);
    setBookingError('');
    setSelectedSlot('');
    setReason('');
    await loadSlots(doc.id, appointmentDate);
  };

  const loadSlots = async (docId, date) => {
    try {
      const res = await fetchDoctorAvailability(docId, date);
      if (res.success && res.data) {
        setAvailableSlots(res.data.available_slots || []);
      }
    } catch (e) {
      console.error(e);
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
    setIsSubmitting(true);
    setBookingError('');
    try {
      const res = await bookAppointment({
        doctor_id: bookingDoctor.id,
        hospital_id: bookingDoctor.hospital_id,
        department_id: bookingDoctor.department_id,
        appointment_date: appointmentDate,
        appointment_time: selectedSlot + ':00',
        reason: reason || 'General Consultation'
      });

      if (res.success && res.data) {
        setBookingSuccess(res.data);
      } else {
        setBookingError(res.message || 'Failed to book appointment. Please try another slot.');
      }
    } catch (e) {
      setBookingError('An error occurred during booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['All', 'Cardiology', 'Neurology', 'Pediatrics'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSpecialization(cat)}
            className={`pill-badge ${specialization === cat ? 'blue' : ''}`}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              cursor: 'pointer',
              background: specialization === cat ? 'var(--primary-blue)' : '#ffffff',
              color: specialization === cat ? '#ffffff' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              boxShadow: specialization === cat ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'var(--shadow-sm)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {preselectedHospital && (
        <div style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 600 }}>
          Showing doctors affiliated with: {preselectedHospital.name}
        </div>
      )}

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading specialists...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {doctors.map((doc) => (
            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"
                    alt={doc.name}
                    style={{ width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{doc.name}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 500 }}>
                      {doc.specialization} • {doc.department_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#eab308', marginTop: '2px' }}>
                      <Star size={13} fill="#eab308" /> {doc.rating || 4.9} ({doc.experience_years || 10}+ years exp)
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.4 }}>
                  {doc.bio || 'Compassionate care specialist dedicated to evidence-based healthcare delivery.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Consultation Fee</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-blue)' }}>₹{doc.consultation_fee}</span>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => openBookingModal(doc)}
                >
                  <Calendar size={15} /> Book Slot
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => onSelectDoctor(doc)}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Booking Modal */}
      {bookingDoctor && (
        <div className="doctor-drawer-overlay" onClick={() => setBookingDoctor(null)}>
          <div
            className="card"
            style={{ width: '480px', maxWidth: '90%', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Schedule Appointment with {bookingDoctor.name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              {bookingDoctor.specialization} • {bookingDoctor.hospital_name || 'Hoshiarpur Medical Center'} • Consultation Fee: <strong>₹{bookingDoctor.consultation_fee}</strong>
            </div>


            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#16a34a' }}>Booking Confirmed!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Your appointment is confirmed for {bookingSuccess.appointment_date} at {bookingSuccess.appointment_time.slice(0, 5)}.
                </p>
                <div style={{ margin: '14px 0', padding: '10px', background: '#eff6ff', borderRadius: '10px', fontSize: '13px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  Queue Number: #{bookingSuccess.queue_number || 1}
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={() => setBookingDoctor(null)}>
                  Done
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookingError && (
                  <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} /> {bookingError}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Select Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={handleDateChange}
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
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Available Time Slots</label>
                  {availableSlots.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      No available slots for this date. Please pick another day.
                    </div>
                  ) : (
                    <div className="slots-grid">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-chip ${selectedSlot === slot ? 'selected' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Reason for Visit (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your symptoms or visit reason..."
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

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setBookingDoctor(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
