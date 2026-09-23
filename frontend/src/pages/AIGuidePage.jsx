import React, { useState } from 'react';
import { Sparkles, Search, MessageSquare, AlertTriangle, Send, CheckCircle, ShieldAlert, ShieldCheck, Check } from 'lucide-react';
import { aiSearch, aiSymptomIntake, aiChat } from '../api';

export default function AIGuidePage({ onSelectDoctor, onNavigateToRoute }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'symptoms' | 'chat'

  // Natural Language Search State
  const [searchQuery, setSearchQuery] = useState('Find a hospital for heart care');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Symptom Intake State
  const [symptomText, setSymptomText] = useState('');
  const [duration, setDuration] = useState('2 days');
  const [severity, setSeverity] = useState('medium');
  const [intakeResult, setIntakeResult] = useState(null);
  const [intakeLoading, setIntakeLoading] = useState(false);

  // FAQ Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Healthcare Guide. How can I help you today with hospital services, doctor specialties, or appointment procedures?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await aiSearch(searchQuery);
      if (res.success && res.data) {
        setSearchResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    if (!symptomText.trim()) return;
    setIntakeLoading(true);
    try {
      const res = await aiSymptomIntake(symptomText, duration, severity);
      if (res.success && res.data) {
        setIntakeResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIntakeLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: msg }]);
    setChatLoading(true);

    try {
      const res = await aiChat(msg);
      if (res.success && res.data) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: res.data.reply,
            isEmergency: res.data.is_emergency_detected,
            links: res.data.suggested_links
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">AI Health Guide</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Instant search with disease cost prediction, symptom intake triage, and clinical guidance
          </div>
        </div>
      </div>

      {/* Sub-nav switcher */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className={`pill-badge ${activeTab === 'search' ? 'blue' : ''}`}
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'search' ? 700 : 500,
            background: activeTab === 'search' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'search' ? '#ffffff' : 'var(--text-main)',
            border: activeTab === 'search' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('search')}
        >
          <Search size={15} /> Natural Language Search
        </button>

        <button
          className={`pill-badge ${activeTab === 'symptoms' ? 'blue' : ''}`}
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'symptoms' ? 700 : 500,
            background: activeTab === 'symptoms' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'symptoms' ? '#ffffff' : 'var(--text-main)',
            border: activeTab === 'symptoms' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('symptoms')}
        >
          <Sparkles size={15} /> Symptom Intake Triage
        </button>

        <button
          className={`pill-badge ${activeTab === 'chat' ? 'blue' : ''}`}
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'chat' ? 700 : 500,
            background: activeTab === 'chat' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'chat' ? '#ffffff' : 'var(--text-main)',
            border: activeTab === 'chat' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={15} /> Healthcare FAQ Chat
        </button>
      </div>

      {/* 1. Natural Language Search & Cost Prediction */}
      {activeTab === 'search' && (
        <div className="card" style={{ padding: '24px 26px', borderRadius: '3px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Natural Language Hospital & Disease Search
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Describe your clinical condition or query in plain English. The AI predicts estimated costs, matches local hospital departments, and highlights government scheme subsidies.
          </p>

          <form onSubmit={handleAISearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Find hospital for heart bypass or stent, knee arthritis surgery, normal delivery..."
              style={{
                flex: 1,
                minWidth: '260px',
                padding: '11px 16px',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                background: '#f8fafc'
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '11px 22px', borderRadius: '3px', fontSize: '13px' }}
              disabled={searchLoading}
            >
              <Sparkles size={15} /> {searchLoading ? 'Analyzing...' : 'Search with AI'}
            </button>
          </form>

          {/* Quick Disease Sample Queries */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {[
              'Heart treatment and bypass',
              'Knee replacement surgery',
              'Acute brain stroke emergency',
              'Pregnancy delivery and C-section',
              'Gallbladder stone laparoscopy',
              'Diabetes sugar management',
              'Cataract eye surgery',
              'Dengue viral fever treatment'
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchQuery(sample);
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          {searchResult && (
            <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#eff6ff',
                  padding: '14px 18px',
                  borderRadius: '3px',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                  border: '1px solid #bfdbfe',
                  lineHeight: 1.5
                }}
              >
                <strong>AI Clinical Routing:</strong> {searchResult.ai_guidance}
              </div>

              {/* AI Estimated Treatment Cost & Scheme Coverage Card */}
              {searchResult.estimated_cost && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderLeft: '4px solid var(--primary-blue)',
                    borderRadius: '3px',
                    padding: '20px 22px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: 'var(--primary-blue)',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '3px',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          AI ESTIMATED TREATMENT COST
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {searchResult.estimated_cost.disease_category}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                        {searchResult.estimated_cost.condition_or_procedure}
                      </h4>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Total Range</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0d904f', marginTop: '2px' }}>
                        {searchResult.estimated_cost.estimated_total_range}
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>OPD Doctor Consultation</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                        {searchResult.estimated_cost.opd_consultation}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Diagnostic Investigations</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                        {searchResult.estimated_cost.diagnostic_tests}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Treatment & Procedures</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                        {searchResult.estimated_cost.treatment_or_procedure}
                      </div>
                    </div>

                    {searchResult.estimated_cost.hospitalization_per_day && (
                      <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Hospital Inpatient Stay</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                          {searchResult.estimated_cost.hospitalization_per_day}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Government Schemes Cashless Subsidies */}
                  {searchResult.estimated_cost.government_schemes_coverage?.length > 0 && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '3px', padding: '12px 16px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#065f46', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} color="#059669" /> Government Scheme Cashless Coverage Available:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {searchResult.estimated_cost.government_schemes_coverage.map((scheme, sIdx) => (
                          <div key={sIdx} style={{ fontSize: '12px', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#059669', fontWeight: 800 }}>✓</span> {scheme}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savings Tips & Disclaimer */}
                  {searchResult.estimated_cost.savings_tips && (
                    <div style={{ fontSize: '12px', color: '#1e40af', background: '#eff6ff', padding: '8px 12px', borderRadius: '3px', marginBottom: '6px', border: '1px solid #bfdbfe' }}>
                      <strong>Smart Cost Savings Tip:</strong> {searchResult.estimated_cost.savings_tips}
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                    * {searchResult.estimated_cost.disclaimer}
                  </div>
                </div>
              )}

              {/* Matched Hospitals */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Verified Matching Hospitals</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {searchResult.hospitals?.map((h) => (
                    <div key={h.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '16px 18px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{h.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{h.city} • {h.type}</div>
                        {h.fee_tier && (
                          <div style={{ fontSize: '12px', color: '#0d904f', fontWeight: 600, marginTop: '2px' }}>
                            OPD Fee: ₹{h.consultation_fee || 50}
                          </div>
                        )}
                      </div>
                      <button className="link-btn" style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => onNavigateToRoute(h.name)}>
                        Get Route & ETA &rsaquo;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Doctors */}
              {searchResult.doctors?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Recommended Specialists</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {searchResult.doctors?.map((d) => (
                      <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '16px 18px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '3px', fontWeight: 600 }}>{d.specialization}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Consultation: ₹{d.consultation_fee || 450}</div>
                        </div>
                        <button className="btn-primary" style={{ marginTop: '12px', fontSize: '12px', padding: '7px 14px', borderRadius: '3px' }} onClick={() => onSelectDoctor(d)}>
                          Book Appointment
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Symptom Intake Triage */}
      {activeTab === 'symptoms' && (
        <div className="card" style={{ padding: '24px 26px', borderRadius: '3px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Structured Symptom Intake Triage
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Enter your symptoms for organized clinical intake preparation before consulting a physician.
          </p>

          <form onSubmit={handleSymptomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Describe Symptoms in Your Own Words</label>
              <textarea
                rows={3}
                placeholder="e.g. I have had a recurring sharp headache and mild dizziness since yesterday morning..."
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                required
                style={{ width: '100%', padding: '11px 14px', borderRadius: '3px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', resize: 'none', background: '#f8fafc' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 days, 1 week..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '3px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', background: '#f8fafc' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Estimated Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '3px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', background: '#fff' }}
                >
                  <option value="low">Mild (Low)</option>
                  <option value="medium">Moderate (Medium)</option>
                  <option value="severe">Severe / Acute (High)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', borderRadius: '3px', fontSize: '13px', marginTop: '4px' }} disabled={intakeLoading}>
              <Sparkles size={15} /> {intakeLoading ? 'Processing...' : 'Prepare Intake Profile'}
            </button>
          </form>

          {intakeResult && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: intakeResult.urgency_level === 'emergency' ? '#fee2e2' : '#f0fdf4', padding: '14px 18px', borderRadius: '3px', border: intakeResult.urgency_level === 'emergency' ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: intakeResult.urgency_level === 'emergency' ? '#b91c1c' : '#15803d' }}>
                  <ShieldAlert size={18} />
                  Urgency Level: {intakeResult.urgency_level.toUpperCase()}
                </div>
                <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {intakeResult.warning_notice}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Recommended Clinical Specialties & Departments
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {intakeResult.suggested_departments?.map((d, i) => (
                    <span key={i} className="pill-badge blue" style={{ padding: '5px 12px', borderRadius: '3px', fontSize: '12px' }}>{d}</span>
                  ))}
                  {intakeResult.suggested_specializations?.map((s, i) => (
                    <span key={i} className="drawer-tag" style={{ padding: '5px 12px', borderRadius: '3px', fontSize: '12px' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '3px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)' }}>Intake Summary for Doctor:</strong> {intakeResult.prepared_intake_summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Healthcare FAQ Chat */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '24px 26px', borderRadius: '3px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Healthcare & Platform Assistant
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Ask questions about visiting hours, lab preparation, booking guidelines, and services.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 16px', background: '#f8fafc', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'user' ? 'var(--primary-blue)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  padding: '11px 16px',
                  borderRadius: '3px',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '13px',
                  lineHeight: 1.5
                }}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 12px' }}>
                AI Guide is thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about hospital timings, fasting for blood tests, etc..."
              style={{ flex: 1, padding: '11px 16px', borderRadius: '3px', border: '1px solid var(--border-subtle)', fontSize: '13px', background: '#ffffff' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '11px 20px', borderRadius: '3px' }} disabled={chatLoading}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
