import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { fetchMyFollowups, submitFollowupResponse } from '../api';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFollowup, setActiveFollowup] = useState(null);
  const [answers, setAnswers] = useState({});
  const [severityScore, setSeverityScore] = useState(3);
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    loadFollowups();
  }, []);

  const loadFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetchMyFollowups();
      if (res.success && res.data) {
        setFollowups(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckin = (f) => {
    setActiveFollowup(f);
    setAnswers({});
    setSeverityScore(3);
    setSubmitResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitFollowupResponse(activeFollowup.id, answers, severityScore);
      if (res.success && res.data) {
        setSubmitResult(res.data);
        loadFollowups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Follow-up Care Engine</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Scheduled post-consultation health evaluations and automated recovery monitoring
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)' }}>
          Loading recovery check-in plans...
        </div>
      ) : followups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', borderRadius: '10px' }}>
          <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>All Recoveries on Track</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            No pending post-consultation check-ins at this moment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {followups.map((f) => (
            <div key={f.id} className="card" style={{ padding: 'clamp(16px, 3.5vw, 28px)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="pill-badge blue" style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>Interval: {f.interval_type.toUpperCase()}</span>
                    <span className={`pill-badge ${f.status === 'completed' ? 'green' : f.status === 'flagged' ? 'red' : 'amber'}`} style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                      ● {f.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginTop: '10px' }}>
                    Post-Consultation Health Check
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Scheduled for: <strong>{f.scheduled_at?.slice(0, 10)}</strong>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '9px 20px', borderRadius: '10px' }}
                  onClick={() => handleOpenCheckin(f)}
                >
                  {f.status === 'completed' ? 'View Responses' : 'Start Check-in'}
                </button>
              </div>

              {/* Questions preview */}
              <div style={{ marginTop: '18px', background: '#f8fafc', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Check-in Questionnaire:
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {f.questions?.map((q, idx) => (
                    <li key={idx}>{q.text}</li>
                  ))}
                </ul>
              </div>

              {f.flagged_for_review && (
                <div style={{ marginTop: '16px', padding: '12px 18px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} /> <span><strong>Clinical Flag:</strong> Responses were automatically submitted for attending physician review.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Check-in Modal */}
      {activeFollowup && (
        <div className="doctor-drawer-overlay" onClick={() => setActiveFollowup(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(540px, 94vw)', margin: 'auto', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(16px, 4vw, 28px)', borderRadius: '10px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Patient Recovery Check-in
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Please answer accurately so your care team can ensure safe recovery.
            </div>

            {submitResult ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#16a34a' }}>Check-in Logged!</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Your answers have been recorded in your clinical timeline.
                </p>
                {submitResult.flagged_for_review && (
                  <div style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '14px 18px', borderRadius: '10px', fontSize: '12px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0 }} />
                    <span><strong>Note:</strong> Because of your reported severity or symptoms, this report has been flagged for prioritized physician review.</span>
                  </div>
                )}
                <button className="btn-google-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '22px', padding: '11px 22px', borderRadius: '10px' }} onClick={() => setActiveFollowup(null)}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {activeFollowup.questions?.map((q, idx) => (
                  <div key={idx}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {q.text}
                    </label>
                    <input
                      type="text"
                      placeholder="Your response..."
                      value={answers[q.text] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.text]: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '8px',
                        fontSize: '13px',
                        background: '#f8fafc'
                      }}
                    />
                  </div>
                ))}

                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Discomfort / Symptom Severity (1 to 10)
                    </label>
                    <span className="pill-badge amber" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
                      Score: {severityScore}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severityScore}
                    onChange={(e) => setSeverityScore(parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: '12px', accentColor: 'var(--primary-blue)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                    <span>1 (Mild / Minimal)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Severe Acute)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '11px 20px', borderRadius: '10px' }} onClick={() => setActiveFollowup(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 20px', borderRadius: '10px' }}>
                    <Send size={15} /> Submit Response
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
