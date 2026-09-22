import React from 'react';
import { X, Phone, MessageSquare, Star, Calendar, MapPin, Award } from 'lucide-react';

export default function DoctorDrawer({ doctor, onClose, onBookClick, onChatClick }) {
  if (!doctor) return null;

  return (
    <div className="doctor-drawer-overlay" onClick={onClose}>
      <div className="doctor-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-profile">
          <img
            src={doctor.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80"}
            alt={doctor.name}
            className="drawer-avatar"
          />
          <h2 className="drawer-name">{doctor.name}</h2>
          <div className="drawer-handle">@{doctor.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}</div>

          <p className="drawer-bio">
            {doctor.bio || "Specialist in cardiovascular health, focused on preventative care and clinical procedures. Dedicated to holistic patient recovery."}
          </p>

          <div className="drawer-tags">
            <span className="drawer-tag">{doctor.specialization || "General Medicine"}</span>
            <span className="drawer-tag">Consultation: ₹{doctor.consultation_fee || 500}</span>
            <span className="drawer-tag">{doctor.experience_years || 10}+ Yrs Exp</span>

          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '20px' }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onBookClick(doctor)}>
              <Calendar size={16} /> Book Appointment
            </button>
            <button className="open-chat-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => onChatClick(doctor)}>
              <MessageSquare size={16} /> Open Full Chat ↗
            </button>
          </div>
        </div>

        {/* Chat Preview matching Dribbble */}
        <div className="drawer-chat-preview">
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Recent Consultation Messages
          </div>
          <div className="chat-bubble">
            Hi, I have great news. The latest test results came back within normal ranges. Please continue the prescribed care plan.
            <div className="chat-bubble-time">8:29 AM</div>
          </div>
          <div className="chat-bubble">
            Be sure to log your blood pressure reading in the follow-up section before tomorrow morning.
            <div className="chat-bubble-time">8:30 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
