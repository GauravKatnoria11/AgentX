import React from 'react';
import { Users, DollarSign, Calendar, Activity, Phone, MessageSquare, MoreVertical, ArrowUpRight, Star } from 'lucide-react';

export default function DashboardPage({ onSelectDoctor, onNavigate }) {
  const upcomingAppointments = [
    {
      id: 1,
      initials: 'AR',
      initialsColor: '#dbeafe',
      textColor: '#1e40af',
      patientName: 'Alex Rivera',
      type: 'Checkup',
      typeColor: 'var(--text-muted)',
      time: '09:00 AM',
      doctor: 'Dr. Michael Chen',
      isHighlight: true
    },
    {
      id: 2,
      initials: 'EG',
      initialsColor: '#fee2e2',
      textColor: '#991b1b',
      patientName: 'Elena Gilbert',
      type: 'Emergency',
      typeColor: '#dc2626',
      time: '09:00 AM',
      doctor: 'Dr. Michael Chen',
      isHighlight: false
    },
    {
      id: 3,
      initials: 'MW',
      initialsColor: '#dcfce7',
      textColor: '#166534',
      patientName: 'Marcus Wright',
      type: 'Consultation',
      typeColor: 'var(--text-muted)',
      time: '09:00 AM',
      doctor: 'Dr. Michael Chen',
      isHighlight: false
    }
  ];

  const specialists = [
    {
      id: 'doc-1',
      name: 'Dr. Michael Chen',
      specialization: 'Cardiology',
      status: 'AVAILABLE',
      statusClass: 'available',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      bio: 'Specialist in cardiovascular health, preventative cardiology, and clinical rhythm management.',
      consultation_fee: 120,
      experience_years: 12
    },
    {
      id: 'doc-2',
      name: 'Dr. Sarah Johnson',
      specialization: 'Pediatrics',
      status: 'ON BREAK',
      statusClass: 'on-break',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1594824813588-43d99e0df340?w=150&auto=format&fit=crop&q=80',
      bio: 'Dedicated pediatrician with deep expertise in neonatal wellness and child health.',
      consultation_fee: 95,
      experience_years: 9
    },
    {
      id: 'doc-3',
      name: 'Dr. James Wilson',
      specialization: 'Neurology',
      status: 'IN SURGERY',
      statusClass: 'in-surgery',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      bio: 'Board-certified neurologist focusing on complex neurological diagnostics and recovery.',
      consultation_fee: 150,
      experience_years: 15
    }
  ];

  const directoryPatients = [
    { id: '#P-001', name: 'Nescafe Chai', age: 28, gender: 'Male', blood: 'O+' },
    { id: '#P-002', name: 'Saleem Bhai', age: 29, gender: 'Male', blood: 'B+' },
    { id: '#P-003', name: 'Aisha Noor', age: 24, gender: 'Female', blood: 'A+' },
    { id: '#P-004', name: 'David Miller', age: 41, gender: 'Male', blood: 'AB+' }
  ];

  return (
    <>
      {/* Metric Cards Grid matching Dribbble */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: 'var(--primary-blue)' }}>
              <Users size={22} />
            </div>
            <span className="pill-badge green">+12.5%</span>
          </div>
          <div className="stat-body">
            <div className="stat-label">Total Patients</div>
            <div className="stat-value">2,845</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <DollarSign size={22} />
            </div>
            <span className="pill-badge red">-3.4%</span>
          </div>
          <div className="stat-body">
            <div className="stat-label">Monthly Services</div>
            <div className="stat-value">₹84,200</div>
          </div>

        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Calendar size={22} />
            </div>
            <span className="pill-badge blue">Active</span>
          </div>
          <div className="stat-body">
            <div className="stat-label">Appointments</div>
            <div className="stat-value">482</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Activity size={22} />
            </div>
            <span className="pill-badge green">99.8%</span>
          </div>
          <div className="stat-body">
            <div className="stat-label">Clinical Satisfaction</div>
            <div className="stat-value">98.4%</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout matching Dribbble */}
      <div className="dashboard-columns">
        {/* Left Column: Upcoming Appointments */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Upcoming Appointments</h2>
            <button className="link-btn" onClick={() => onNavigate('appointments')}>
              View Calendar &rsaquo;
            </button>
          </div>

          <div className="appointments-list">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                className={`appointment-item ${app.isHighlight ? 'active-highlight' : ''}`}
              >
                <div className="appointment-left">
                  <div
                    className="avatar-badge"
                    style={{ background: app.initialsColor, color: app.textColor }}
                  >
                    {app.initials}
                  </div>
                  <div className="appointment-meta">
                    <div className="appointment-meta-top">
                      <span className="patient-name-text">{app.patientName}</span>
                      <span className="appointment-type-tag" style={{ color: app.typeColor, fontWeight: app.type === 'Emergency' ? 700 : 500 }}>
                        {app.type}
                      </span>
                    </div>
                    <div className="appointment-meta-bottom">
                      <span>🕒 {app.time}</span>
                      <span>•</span>
                      <span>{app.doctor}</span>
                    </div>
                  </div>
                </div>

                <div className="appointment-actions">
                  <button className="round-action-btn" title="Call">
                    <Phone size={15} />
                  </button>
                  <button className="round-action-btn" title="Message" onClick={() => onNavigate('ai-guide')}>
                    <MessageSquare size={15} />
                  </button>
                  <button className="round-action-btn" title="Options">
                    <MoreVertical size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top Rated Specialists */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Top Rated Specialists</h2>
            <button className="link-btn" onClick={() => onNavigate('doctors')}>
              View All &rsaquo;
            </button>
          </div>

          <div className="specialists-list">
            {specialists.map((doc) => (
              <div
                key={doc.id}
                className="specialist-item"
                onClick={() => onSelectDoctor(doc)}
              >
                <div className="specialist-left">
                  <img src={doc.image} alt={doc.name} className="specialist-img" />
                  <div className="specialist-details">
                    <span className="specialist-name">{doc.name}</span>
                    <span className="specialist-dept">{doc.specialization}</span>
                    <span className={`status-dot-indicator ${doc.statusClass}`}>
                      ● {doc.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#eab308', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    ★ {doc.rating}
                  </span>
                  <button className="round-action-btn" title="Call Doctor" onClick={(e) => { e.stopPropagation(); onSelectDoctor(doc); }}>
                    <Phone size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Directory Table matching Dribbble */}
      <div className="table-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Patient Directory</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Manage and track patient information
            </div>
          </div>
          <button className="link-btn" onClick={() => onNavigate('records')}>
            View All Records &rsaquo;
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>PATIENT ID</th>
                <th>NAME</th>
                <th>AGE</th>
                <th>GENDER</th>
                <th>BLOOD GROUP</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {directoryPatients.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>
                    <span className="pill-badge blue">{p.blood}</span>
                  </td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => onNavigate('records')}
                    >
                      View Profile &rsaquo;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
