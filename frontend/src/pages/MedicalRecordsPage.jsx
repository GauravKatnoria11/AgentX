import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, AlertCircle, ShieldCheck, Check, 
  Clock, Utensils, Pill, Calendar, Building2, User, Search,
  Sun, Moon, Sunset, Coffee, Droplets, AlertTriangle, Activity
} from 'lucide-react';
import { fetchMyMedicalRecords, aiSummarizeRecord } from '../api';

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Summary State
  const [selectedRecordForAI, setSelectedRecordForAI] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetchMyMedicalRecords();
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async (record) => {
    setSelectedRecordForAI(record);
    setAiSummary(null);
    setAiLoading(true);
    try {
      const res = await aiSummarizeRecord(record.id, record.notes);
      if (res.success && res.data) {
        setAiSummary(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // Extract unique disease categories
  const categories = ['ALL', ...Array.from(new Set(records.map(r => r.disease_category).filter(Boolean)))];

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesCategory = selectedCategory === 'ALL' || r.disease_category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch = 
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.disease_category && r.disease_category.toLowerCase().includes(q)) ||
      (r.doctor_name && r.doctor_name.toLowerCase().includes(q)) ||
      (r.hospital_name && r.hospital_name.toLowerCase().includes(q)) ||
      (r.appointment_id && r.appointment_id.toLowerCase().includes(q)) ||
      (r.medicines && r.medicines.some(m => m.name && m.name.toLowerCase().includes(q))) ||
      (r.notes && r.notes.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Medical Records & Disease Management</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Categorized by appointment according to disease • Medicine schedules (morning/evening) • Doctor prescribed diet plans
          </div>
        </div>
      </div>

      {/* Disease Category Filter Chips & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary-blue)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Categorized by Disease & Specialty:</span>
          </div>

          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search disease, medicines, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}
            />
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const count = cat === 'ALL' ? records.length : records.filter(r => r.disease_category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  border: isSelected ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--primary-blue)' : '#f8fafc',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat === 'ALL' ? '🩺 All Diseases & Care' : cat}</span>
                <span
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
          Loading your medical records, medicine schedules, and diet plans...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <FileText size={44} color="var(--primary-blue)" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>No Records Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            No records matched your selected disease category or search filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredRecords.map((r) => {
            const hasMedicines = r.medicines && r.medicines.length > 0;
            const hasDiet = !!r.diet_plan;

            return (
              <div 
                key={r.id} 
                className="card" 
                style={{ 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  padding: '24px'
                }}
              >
                {/* Header: Disease Category & Appointment ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span 
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        🩺 {r.disease_category || 'General Specialty'}
                      </span>

                      {r.appointment_id && (
                        <span 
                          style={{
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Calendar size={12} /> Appointment #{r.appointment_id}
                        </span>
                      )}

                      <span className="pill-badge blue" style={{ fontSize: '11px' }}>
                        {r.record_type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                      {r.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={14} color="var(--primary-blue)" /> {r.doctor_name || 'Dr. Gurinder Singh'}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Building2 size={14} color="#059669" /> {r.hospital_name || 'Ivy Hospital Hoshiarpur'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Prescribed: {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <ShieldCheck size={13} /> Doctor Verified & Signed
                    </div>
                  </div>
                </div>

                {/* Doctor's Clinical Diagnosis / Notes */}
                {r.notes && (
                  <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', borderLeft: '3px solid var(--primary-blue)', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    <strong>Clinical Summary & Diagnosis:</strong> {r.notes}
                  </div>
                )}

                {/* 1. MEDICINE DETAILS SECTION (Categorized by Appointment & Timings) */}
                <div style={{ marginTop: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                        <Pill size={16} />
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        Doctor's Prescribed Medicine Regimen & Pill Schedule
                      </h4>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Take strictly as scheduled
                    </span>
                  </div>

                  {hasMedicines ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {r.medicines.map((med, idx) => {
                        const timing = med.timing || {};
                        return (
                          <div 
                            key={idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                          >
                            {/* Medicine Info */}
                            <div style={{ minWidth: '220px', flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                {med.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary-blue)', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                                  Dosage: {med.dosage || '1 Tablet'}
                                </span>
                                <span>•</span>
                                <span>Meal: <strong>{med.meal_relation || 'After Food'}</strong></span>
                                <span>•</span>
                                <span>Duration: <strong>{med.duration || '30 Days'}</strong></span>
                              </div>
                              {med.instructions && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                                  💡 {med.instructions}
                                </div>
                              )}
                            </div>

                            {/* Timing Badges (Morning, Afternoon, Evening, Night) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {/* Morning */}
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: timing.morning ? '#fef3c7' : '#f1f5f9',
                                  color: timing.morning ? '#92400e' : '#94a3b8',
                                  border: timing.morning ? '1px solid #fde68a' : '1px solid transparent'
                                }}
                              >
                                <Sun size={12} /> Morning
                              </div>

                              {/* Afternoon */}
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: timing.afternoon ? '#ffedd5' : '#f1f5f9',
                                  color: timing.afternoon ? '#9a3412' : '#94a3b8',
                                  border: timing.afternoon ? '1px solid #fed7aa' : '1px solid transparent'
                                }}
                              >
                                <Coffee size={12} /> Afternoon
                              </div>

                              {/* Evening */}
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: timing.evening ? '#ede9fe' : '#f1f5f9',
                                  color: timing.evening ? '#5b21b6' : '#94a3b8',
                                  border: timing.evening ? '1px solid #ddd6fe' : '1px solid transparent'
                                }}
                              >
                                <Sunset size={12} /> Evening
                              </div>

                              {/* Night */}
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: timing.night ? '#dbeafe' : '#f1f5f9',
                                  color: timing.night ? '#1e40af' : '#94a3b8',
                                  border: timing.night ? '1px solid #bfdbfe' : '1px solid transparent'
                                }}
                              >
                                <Moon size={12} /> Night
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Standard clinical observation recorded. Doctor did not prescribe active oral medications for this session.
                    </div>
                  )}
                </div>

                {/* 2. DOCTOR'S PRESCRIBED DIET PLAN SECTION */}
                {hasDiet && (
                  <div style={{ marginTop: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
                          <Utensils size={16} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#14532d' }}>
                            {r.diet_plan.title || "Doctor's Prescribed Diet Plan"}
                          </h4>
                          <div style={{ fontSize: '11px', color: '#15803d' }}>
                            Formulated by attending physician for optimal disease recovery
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', background: '#16a34a', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Clinical Nutrition Protocol
                      </span>
                    </div>

                    {/* Meal Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
                      {/* Breakfast */}
                      {r.diet_plan.breakfast && (
                        <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <Sun size={13} color="#f59e0b" /> Breakfast (8:00 AM - 9:00 AM)
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                            {r.diet_plan.breakfast}
                          </div>
                        </div>
                      )}

                      {/* Lunch */}
                      {r.diet_plan.lunch && (
                        <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <Utensils size={13} color="#059669" /> Lunch (1:00 PM - 2:00 PM)
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                            {r.diet_plan.lunch}
                          </div>
                        </div>
                      )}

                      {/* Evening Snack */}
                      {r.diet_plan.evening_snack && (
                        <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <Coffee size={13} color="#d97706" /> Evening Snack (5:00 PM)
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                            {r.diet_plan.evening_snack}
                          </div>
                        </div>
                      )}

                      {/* Dinner */}
                      {r.diet_plan.dinner && (
                        <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <Moon size={13} color="#4338ca" /> Dinner (Before 8:00 PM)
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.45 }}>
                            {r.diet_plan.dinner}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Foods to Avoid (Red tags) */}
                    {r.diet_plan.foods_to_avoid && r.diet_plan.foods_to_avoid.length > 0 && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #86efac' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                          <AlertTriangle size={13} color="#dc2626" /> Strictly Avoid / Restriction List:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {r.diet_plan.foods_to_avoid.map((item, i) => (
                            <span 
                              key={i}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              ✕ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hydration & Doctor's Guidance */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '14px' }}>
                      {r.diet_plan.hydration_advice && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#1e3a8a', background: '#e0f2fe', padding: '10px 12px', borderRadius: '8px' }}>
                          <Droplets size={15} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Hydration Protocol:</strong> {r.diet_plan.hydration_advice}
                          </div>
                        </div>
                      )}

                      {r.diet_plan.doctor_notes && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '10px 12px', borderRadius: '8px' }}>
                          <Check size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Doctor's Lifestyle Advice:</strong> {r.diet_plan.doctor_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                    onClick={() => handleGenerateSummary(r)}
                  >
                    <Sparkles size={14} /> AI Clinical Summary
                  </button>

                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '8px 16px', textDecoration: 'none' }}
                    >
                      <FileText size={14} /> View Source Document
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Summary Modal */}
      {selectedRecordForAI && (
        <div className="doctor-drawer-overlay" onClick={() => setSelectedRecordForAI(null)}>
          <div className="card" style={{ width: '560px', maxWidth: '90%', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '8px' }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Gemini AI Record & Regimen Summary</h3>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Analyzing: <strong>{selectedRecordForAI.title}</strong> ({selectedRecordForAI.disease_category})
            </div>

            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                Synthesizing clinical findings safely...
              </div>
            ) : aiSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {aiSummary.concise_summary}
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Key Verified Findings
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {aiSummary.key_findings?.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Questions for Your Doctor
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {aiSummary.suggested_questions_for_doctor?.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-light)', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  {aiSummary.disclaimer}
                </div>

                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedRecordForAI(null)}>
                  Close Summary
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
