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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-nav switcher */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className={`pill-badge ${activeTab === 'search' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            background: activeTab === 'search' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'search' ? '#ffffff' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}
          onClick={() => setActiveTab('search')}
        >
          <Search size={15} /> Natural Language Search
        </button>

        <button
          className={`pill-badge ${activeTab === 'symptoms' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            background: activeTab === 'symptoms' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'symptoms' ? '#ffffff' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}
          onClick={() => setActiveTab('symptoms')}
        >
          <Sparkles size={15} /> Symptom Intake Triage
        </button>

        <button
          className={`pill-badge ${activeTab === 'chat' ? 'blue' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            background: activeTab === 'chat' ? 'var(--primary-blue)' : '#ffffff',
            color: activeTab === 'chat' ? '#ffffff' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={15} /> Healthcare FAQ Chat
        </button>
      </div>

      {/* 1. Natural Language Search */}
      {activeTab === 'search' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            Natural Language Healthcare Search
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Describe your clinical need in plain English. Gemini extracts intent and finds real matching hospital facilities.
          </p>

          <form onSubmit={handleAISearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Find a nearby clinic for heart treatment and checkup..."
              style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '13px', background: '#f8fafc' }}
            />
            <button type="submit" className="btn-primary" disabled={searchLoading}>
              <Sparkles size={16} /> {searchLoading ? 'Analyzing...' : 'Search with AI'}
            </button>
          </form>

          {searchResult && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#eff6ff', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', color: 'var(--text-main)', border: '1px solid #bfdbfe' }}>
                <strong>AI Search Intent:</strong> {searchResult.ai_guidance}
              </div>

              {/* Matched Hospitals */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Verified Matching Hospitals</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {searchResult.hospitals?.map((h) => (
                    <div key={h.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px', background: '#ffffff' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{h.city} • {h.type}</div>
                      <button className="link-btn" style={{ marginTop: '10px' }} onClick={() => onNavigateToRoute(h.name)}>
                        Get Route & ETA &rsaquo;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Doctors */}
              {searchResult.doctors?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Recommended Specialists</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {searchResult.doctors?.map((d) => (
                      <div key={d.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px', background: '#ffffff' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '2px' }}>{d.specialization}</div>
                        <button className="btn-primary" style={{ marginTop: '10px', fontSize: '12px', padding: '6px 14px' }} onClick={() => onSelectDoctor(d)}>
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
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            Structured Symptom Intake Triage
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Enter your symptoms for organized clinical intake preparation before consulting a physician.
          </p>

          <form onSubmit={handleSymptomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Describe Symptoms in Your Own Words</label>
              <textarea
                rows={3}
                placeholder="e.g. I have had a recurring sharp headache and mild dizziness since yesterday morning..."
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '6px', fontSize: '13px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 days, 1 week..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Estimated Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '6px', fontSize: '13px', background: '#fff' }}
                >
                  <option value="low">Mild (Low)</option>
                  <option value="medium">Moderate (Medium)</option>
                  <option value="severe">Severe / Acute (High)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={intakeLoading}>
              <Sparkles size={16} /> {intakeLoading ? 'Processing...' : 'Prepare Intake Profile'}
            </button>
          </form>

          {intakeResult && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: intakeResult.urgency_level === 'emergency' ? '#fee2e2' : '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: intakeResult.urgency_level === 'emergency' ? '#b91c1c' : '#15803d' }}>
                  <ShieldAlert size={18} />
                  Urgency Level: {intakeResult.urgency_level.toUpperCase()}
                </div>
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-main)' }}>
                  {intakeResult.warning_notice}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Recommended Clinical Specialties & Departments
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {intakeResult.suggested_departments?.map((d, i) => (
                    <span key={i} className="pill-badge blue">{d}</span>
                  ))}
                  {intakeResult.suggested_specializations?.map((s, i) => (
                    <span key={i} className="drawer-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>Intake Summary for Doctor:</strong> {intakeResult.prepared_intake_summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Healthcare FAQ Chat */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Healthcare & Platform Assistant
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Ask questions about visiting hours, lab preparation, booking guidelines, and services.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', background: '#f8fafc', borderRadius: '12px' }}>
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'user' ? 'var(--primary-blue)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '13px',
                  lineHeight: 1.4
                }}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
              style={{ flex: 1, padding: '10px 16px', borderRadius: '9999px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
            />
            <button type="submit" className="btn-primary" disabled={chatLoading}>
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
