import React, { useState } from 'react';
import { Sparkles, Search, MessageSquare, AlertTriangle, Send, CheckCircle, ShieldAlert } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">AI Healthcare Guide & Clinical Triage</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Intelligent natural language navigation, structured symptom triage intake, and real-time care assistant
          </div>
        </div>
      </div>

      {/* Sub-nav switcher */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          className={`pill-badge ${activeTab === 'search' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: activeTab === 'search' ? 700 : 500,
            background: activeTab === 'search' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'search' ? '#ffffff' : 'var(--text-muted)',
            border: activeTab === 'search' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('search')}
        >
          <Search size={16} /> Natural Language Search
        </button>

        <button
          className={`pill-badge ${activeTab === 'symptoms' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: activeTab === 'symptoms' ? 700 : 500,
            background: activeTab === 'symptoms' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'symptoms' ? '#ffffff' : 'var(--text-muted)',
            border: activeTab === 'symptoms' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('symptoms')}
        >
          <Sparkles size={16} /> Symptom Intake Triage
        </button>

        <button
          className={`pill-badge ${activeTab === 'chat' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: activeTab === 'chat' ? 700 : 500,
            background: activeTab === 'chat' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'chat' ? '#ffffff' : 'var(--text-muted)',
            border: activeTab === 'chat' ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} /> Healthcare FAQ Chat
        </button>
      </div>

      {/* 1. Natural Language Search */}
      {activeTab === 'search' && (
        <div className="card" style={{ padding: '26px 28px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
            Natural Language Healthcare Search
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Describe your clinical need in plain English. Gemini extracts intent and finds real matching hospital facilities.
          </p>

          <form onSubmit={handleAISearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Find a nearby clinic for heart treatment and checkup..."
              style={{ flex: 1, minWidth: '260px', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px', background: '#f8fafc' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 22px', borderRadius: '10px', fontSize: '13px' }} disabled={searchLoading}>
              <Sparkles size={16} /> {searchLoading ? 'Analyzing...' : 'Search with AI'}
            </button>
          </form>

          {searchResult && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#eff6ff', padding: '16px 20px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid #bfdbfe', lineHeight: 1.5 }}>
                <strong>AI Search Intent:</strong> {searchResult.ai_guidance}
              </div>

              {/* Matched Hospitals */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>Verified Matching Hospitals</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {searchResult.hospitals?.map((h) => (
                    <div key={h.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px 20px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{h.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{h.city} • {h.type}</div>
                      </div>
                      <button className="link-btn" style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-blue)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => onNavigateToRoute(h.name)}>
                        Get Route & ETA &rsaquo;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Doctors */}
              {searchResult.doctors?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>Recommended Specialists</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {searchResult.doctors?.map((d) => (
                      <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px 20px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>{d.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '4px', fontWeight: 600 }}>{d.specialization}</div>
                        </div>
                        <button className="btn-primary" style={{ marginTop: '14px', fontSize: '12px', padding: '8px 16px', borderRadius: '10px' }} onClick={() => onSelectDoctor(d)}>
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
        <div className="card" style={{ padding: '26px 28px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
            Structured Symptom Intake Triage
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Enter your symptoms for organized clinical intake preparation before consulting a physician.
          </p>

          <form onSubmit={handleSymptomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Describe Symptoms in Your Own Words</label>
              <textarea
                rows={3}
                placeholder="e.g. I have had a recurring sharp headache and mild dizziness since yesterday morning..."
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', resize: 'none', background: '#f8fafc' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 days, 1 week..."
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', background: '#f8fafc' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Estimated Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '8px', fontSize: '13px', background: '#fff' }}
                >
                  <option value="low">Mild (Low)</option>
                  <option value="medium">Moderate (Medium)</option>
                  <option value="severe">Severe / Acute (High)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '11px 22px', borderRadius: '10px', fontSize: '13px', marginTop: '4px' }} disabled={intakeLoading}>
              <Sparkles size={16} /> {intakeLoading ? 'Processing...' : 'Prepare Intake Profile'}
            </button>
          </form>

          {intakeResult && (
            <div style={{ marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: intakeResult.urgency_level === 'emergency' ? '#fee2e2' : '#f0fdf4', padding: '16px 20px', borderRadius: '10px', border: intakeResult.urgency_level === 'emergency' ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '14px', color: intakeResult.urgency_level === 'emergency' ? '#b91c1c' : '#15803d' }}>
                  <ShieldAlert size={20} />
                  Urgency Level: {intakeResult.urgency_level.toUpperCase()}
                </div>
                <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {intakeResult.warning_notice}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                  Recommended Clinical Specialties & Departments
                </h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {intakeResult.suggested_departments?.map((d, i) => (
                    <span key={i} className="pill-badge blue" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '12px' }}>{d}</span>
                  ))}
                  {intakeResult.suggested_specializations?.map((s, i) => (
                    <span key={i} className="drawer-tag" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '12px' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-main)' }}>Intake Summary for Doctor:</strong> {intakeResult.prepared_intake_summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Healthcare FAQ Chat */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '26px 28px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
            Healthcare & Platform Assistant
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Ask questions about visiting hours, lab preparation, booking guidelines, and services.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'user' ? 'var(--primary-blue)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  padding: '12px 18px',
                  borderRadius: '10px',
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

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about hospital timings, fasting for blood tests, etc..."
              style={{ flex: 1, padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px', background: '#ffffff' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 22px', borderRadius: '10px' }} disabled={chatLoading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
