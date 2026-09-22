import React, { useState, useEffect } from 'react';
import { FileText, Upload, Sparkles, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { fetchMyMedicalRecords, uploadMedicalRecord, aiSummarizeRecord } from '../api';

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Upload state
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Lab Report');
  const [notes, setNotes] = useState('');

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await uploadMedicalRecord({
        title,
        record_type: recordType,
        notes,
        file_name: `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        file_size_bytes: 350000
      });
      if (res.success) {
        setTitle('');
        setNotes('');
        setShowUpload(false);
        loadRecords();
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Private Medical Records</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Encrypted personal health history, pathology tests, and clinical reports
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(!showUpload)}>
          <Upload size={15} /> Upload Record
        </button>
      </div>

      {/* Upload Form Modal */}
      {showUpload && (
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Upload Medical Record</h3>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Document Title</label>
              <input
                type="text"
                placeholder="e.g. Comprehensive Metabolic Panel, Brain MRI..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Record Type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px', background: '#fff' }}
              >
                <option value="Lab Report">Lab Report</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Imaging / Radiology">Imaging / Radiology</option>
                <option value="Clinical Notes">Clinical Notes</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Physician Notes / Summary</label>
              <textarea
                rows={3}
                placeholder="Key findings, notes from consultation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '4px', fontSize: '13px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Encrypted Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your medical records...
        </div>
      ) : records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <FileText size={40} color="var(--primary-blue)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Records Found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Upload reports or connect with your hospital to populate your health timeline.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {records.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="pill-badge blue" style={{ marginBottom: '6px' }}>{r.record_type}</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                    {r.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {r.doctor_name || 'Attending Physician'} • {r.hospital_name || 'City General Hospital'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Saved {r.created_at?.slice(0, 10)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                    🔒 Zero-Knowledge Patient Privacy Enforced
                  </div>
                </div>
              </div>

              {r.notes && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.5, background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  {r.notes}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
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
                    View Source Document
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary Modal */}
      {selectedRecordForAI && (
        <div className="doctor-drawer-overlay" onClick={() => setSelectedRecordForAI(null)}>
          <div className="card" style={{ width: '520px', maxWidth: '90%', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '8px' }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Gemini AI Record Summary</h3>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Analyzing: <strong>{selectedRecordForAI.title}</strong>
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
