import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Check,
  Building2,
  MapPin,
  Bed,
  CreditCard,
  Star,
  Navigation,
  Stethoscope,
  Info,
  Landmark,
  ArrowUp,
  HeartPulse,
  MapPinned,
  WalletCards,
  ClipboardPlus
} from 'lucide-react';
import { aiSearch, aiSymptomIntake, aiChat, fetchHospitals } from '../api';
import './AIGuidePage.css';
import AiMark from '../components/AiMark';

export default function AIGuidePage({
  onSelectDoctor,
  onNavigateToRoute,
  onSelectHospitalForRoute,
  onSelectHospitalForDoctors,
  onOpenHospitalDetail,
  onNavigatePage,
  patientLocation
}) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'symptoms' | 'chat'

  // Natural Language Search State
  const [searchQuery, setSearchQuery] = useState('Find a hospital for heart care');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allHospitals, setAllHospitals] = useState([]);

  // Load all regional network hospitals on mount
  useEffect(() => {
    fetchHospitals({
      user_lat: patientLocation?.lat || 31.5312,
      user_lon: patientLocation?.lon || 75.9184
    }).then(res => {
      if (res.success && res.data) {
        setAllHospitals(res.data);
      }
    }).catch(err => console.error('Failed to load regional hospitals:', err));
  }, [patientLocation]);

  // Initial auto-search on mount
  useEffect(() => {
    handleAISearch();
  }, []);

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
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await aiSearch(
        searchQuery,
        patientLocation?.lat || 31.5312,
        patientLocation?.lon || 75.9184
      );
      if (res.success && res.data) {
        setSearchResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSuggestedSearch = async (query) => {
    setSearchQuery(query);
    setSearchLoading(true);
    try {
      const res = await aiSearch(query, patientLocation?.lat || 31.5312, patientLocation?.lon || 75.9184);
      if (res.success && res.data) setSearchResult(res.data);
    } catch (err) {
      console.error(err);
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
      const res = await aiChat(msg, chatMessages);
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
      } else {
        setChatMessages((prev) => [...prev, {
          sender: 'ai',
          text: res.message || 'I could not get an answer just now. Please try again.'
        }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages((prev) => [...prev, {
        sender: 'ai',
        text: 'I could not connect to the care assistant. Please check your connection and try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const matchedHospitalIds = new Set((searchResult?.hospitals || []).map(h => String(h.id)));
  const otherRecommendedHospitals = allHospitals.filter(h => !matchedHospitalIds.has(String(h.id)));

  const getHospitalBannerTheme = (hospital, index) => {
    const themes = ['banner-theme-blue', 'banner-theme-emerald', 'banner-theme-purple', 'banner-theme-teal'];
    if (hospital.type === 'Super-Specialty' || hospital.type === 'Tertiary Care') return 'banner-theme-blue';
    if (hospital.type === 'Trauma & Orthopedic') return 'banner-theme-purple';
    if (hospital.type === 'Maternity & Surgical') return 'banner-theme-teal';
    return themes[index % themes.length];
  };

  const renderHospitalCard = (h, index, badgeLabel) => {
    return (
      <div key={h.id || index} className="classroom-card" style={{ borderRadius: '3px' }}>
        {/* Thematic Banner Cover */}
        <div
          className={`classroom-card-banner ${getHospitalBannerTheme(h, index)}`}
          onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'overview')}
          title="Click to view full hospital dossier"
          style={{ borderRadius: '3px 3px 0 0' }}
        >
          <div className="banner-top-row">
            <span className="banner-badge" style={{ borderRadius: '3px' }}>{h.type}</span>
            <div className="banner-rating-pill" style={{ borderRadius: '3px' }}>
              <Star size={13} fill="#ffffff" color="#ffffff" />
              <span>{h.rating || 4.7}</span>
            </div>
          </div>

          <div>
            <h3 className="banner-title">{h.name}</h3>
            <div className="banner-subtitle">
              {badgeLabel || h.bestBadge || 'Verified Facility'}
            </div>
          </div>

          {/* Overlapping Facility Avatar */}
          <div className="classroom-card-avatar" style={{ borderRadius: '3px' }}>
            <Building2 size={22} color="var(--primary-blue)" />
          </div>
        </div>

        {/* Card Body */}
        <div className="classroom-card-body">
          {/* Location & Distance */}
          <div className="classroom-meta-row">
            <MapPin size={16} color="var(--primary-blue)" />
            <span style={{ fontWeight: 500, fontSize: '13px' }}>
              {h.address?.split(',')[0]} • <strong>{h.distance_km ? `${h.distance_km} km` : '1.8 km'}</strong> away
            </span>
          </div>

          {/* ICU Bed Capacity & Emergency Service */}
          <div className="classroom-meta-row">
            <Bed size={16} color="#188038" />
            <span style={{ color: '#137333', fontWeight: 600, fontSize: '13px' }}>
              {h.available_icu_beds ?? h.icu_beds ?? 0} ICU Beds Available
            </span>
            {h.emergency_available && (
              <span className="classroom-chip red" style={{ marginLeft: 'auto', borderRadius: '3px' }}>
                <ShieldAlert size={12} /> 24/7 Emergency
              </span>
            )}
          </div>

          {/* Consultation Fee */}
          <div className="classroom-meta-row">
            <CreditCard size={16} color="var(--primary-blue)" />
            <span style={{ fontSize: '13px' }}>
              Consultation Fee: <strong style={{ color: 'var(--primary-blue)', fontSize: '14px' }}>₹{h.consultation_fee || 50}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>({h.fee_tier || 'OPD'})</span>
            </span>
          </div>

          {/* Clinical Specialties */}
          {h.diseases_treated?.length > 0 && (
            <div className="classroom-chip-container">
              {h.diseases_treated.slice(0, 3).map((d, idx) => (
                <span key={idx} className="classroom-chip" style={{ borderRadius: '3px' }}>
                  {d}
                </span>
              ))}
              {h.diseases_treated.length > 3 && (
                <span className="classroom-chip" style={{ color: 'var(--text-muted)', borderRadius: '3px' }}>
                  +{h.diseases_treated.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Empanelled Government Schemes */}
          {h.government_schemes?.length > 0 && (
            <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                <Landmark size={12} color="#059669" />
                <span>Empanelled Govt Schemes:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {h.government_schemes.slice(0, 2).map((sch, sIdx) => (
                  <span key={sIdx} className="ai-scheme-name">
                    <Landmark size={12} /> {sch}
                  </span>
                ))}
                {h.government_schemes.length > 2 && (
                  <span className="ai-scheme-more">
                    +{h.government_schemes.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Action Footer */}
        <div className="classroom-card-footer" style={{ borderRadius: '0 0 3px 3px' }}>
          <button
            type="button"
            className="btn-google-primary"
            onClick={() => onSelectHospitalForDoctors && onSelectHospitalForDoctors(h)}
            style={{ flex: 1.2, borderRadius: '3px' }}
          >
            <Stethoscope size={15} /> View Doctors
          </button>

          <button
            type="button"
            className="btn-google-outline"
            onClick={() => {
              if (onSelectHospitalForRoute) {
                onSelectHospitalForRoute(h, patientLocation);
              } else if (onNavigateToRoute) {
                onNavigateToRoute(h.name);
              }
            }}
            title="Route & Directions"
            style={{ flex: 1, borderRadius: '3px' }}
          >
            <Navigation size={15} /> Directions
          </button>

          <button
            type="button"
            className="btn-google-outline"
            onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'overview')}
            title="Full Dossier"
            style={{ padding: '8px 12px', borderRadius: '3px' }}
          >
            <Info size={15} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`ai-guide-page ai-workflow-${activeTab}`}>
      <section className="ai-welcome">
        <div className="ai-orb"><AiMark size={26} /></div>
        <span className="ai-eyebrow">CARELINK AI</span>
        <h2>{activeTab === 'symptoms' ? 'Let’s understand what you’re feeling.' : activeTab === 'chat' ? 'How can I help with your care?' : 'What can I help you find?'}</h2>
        <p>{activeTab === 'symptoms' ? 'Share a few details to prepare for your next step.' : activeTab === 'chat' ? 'Ask about care, services, or appointments.' : 'Search trusted care, symptoms, and treatment costs.'}</p>
      </section>

      <div className="ai-mode-switcher" role="tablist" aria-label="AI care tools">
        <button
          className={`ai-mode ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          role="tab" aria-selected={activeTab === 'search'}
        >
          <Search size={16} /> Care search
        </button>

        <button
          className={`ai-mode ${activeTab === 'symptoms' ? 'active' : ''}`}
          onClick={() => setActiveTab('symptoms')}
          role="tab" aria-selected={activeTab === 'symptoms'}
        >
          <HeartPulse size={16} /> Symptom check
        </button>

        <button
          className={`ai-mode ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          role="tab" aria-selected={activeTab === 'chat'}
        >
          <MessageSquare size={16} /> Ask Carelink
        </button>
      </div>

      {/* 1. Natural Language Search & Cost Prediction */}
      {activeTab === 'search' && (
        <div className="ai-search-workspace">
          <div className={`ai-prompt-shell ${searchLoading ? 'is-searching' : ''}`} aria-busy={searchLoading}>
          <form onSubmit={handleAISearch} className="ai-prompt-form">
            <div className="ai-prompt-leading"><AiMark size={20} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Describe the care you’re looking for..."
              aria-label="Search for care"
            />
            <button
              type="submit"
              className="ai-submit"
              disabled={searchLoading || !searchQuery.trim()}
              aria-label="Search with Carelink AI"
            >
              {searchLoading ? <span className="ai-spinner" /> : <ArrowUp size={19} />}
            </button>
          </form>
          {searchLoading && <span className="ai-search-progress" aria-hidden="true" />}
          <div className="ai-prompt-footer"><span><MapPinned size={14} /> Near {patientLocation?.locality || 'you'}</span><span><ShieldCheck size={14} /> Care guidance</span></div>
          </div>

          {/* Quick Disease Sample Queries */}
          <div className="ai-suggestions" aria-label="Suggested searches">
            {[
              { label: 'Heart care', icon: HeartPulse, query: 'Heart treatment and bypass' },
              { label: 'Nearby hospitals', icon: MapPinned, query: 'Find nearby hospitals for my care' },
              { label: 'Treatment costs', icon: WalletCards, query: 'Treatment cost and available government schemes' },
              { label: 'Find a specialist', icon: Stethoscope, query: 'Find a specialist near me' }
            ].map(({ label, icon: SuggestionIcon, query: sample }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSuggestedSearch(sample)}
                disabled={searchLoading}
                className="ai-suggestion"
              >
                <SuggestionIcon size={15} /> {label}
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
                  className="treatment-cost-card"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e3e5df',
                    borderRadius: '14px',
                    padding: '22px',
                    boxShadow: '0 8px 24px rgba(31, 39, 32, 0.055)'
                  }}
                >
                  <div className="cost-card-heading">
                    <div className="cost-card-title">
                      <div className="cost-card-meta">
                        <span className="cost-ai-tag"><AiMark size={13} /> AI COST ESTIMATE</span>
                        <span className="cost-category">{searchResult.estimated_cost.disease_category}</span>
                      </div>
                      <h4>{searchResult.estimated_cost.condition_or_procedure}</h4>
                    </div>
                    <div className="cost-total">
                      <span>Estimated total range</span>
                      <strong>{searchResult.estimated_cost.estimated_total_range}</strong>
                    </div>
                  </div>

                  {/* Cost Breakdown Grid */}
                  <div className="cost-breakdown-grid">
                    <div className="cost-breakdown-item">
                      <div className="cost-item-label">OPD Doctor Consultation</div>
                      <div className="cost-item-value">
                        {searchResult.estimated_cost.opd_consultation}
                      </div>
                    </div>

                    <div className="cost-breakdown-item">
                      <div className="cost-item-label">Diagnostic Investigations</div>
                      <div className="cost-item-value">
                        {searchResult.estimated_cost.diagnostic_tests}
                      </div>
                    </div>

                    <div className="cost-breakdown-item">
                      <div className="cost-item-label">Treatment & Procedures</div>
                      <div className="cost-item-value">
                        {searchResult.estimated_cost.treatment_or_procedure}
                      </div>
                    </div>

                    {searchResult.estimated_cost.hospitalization_per_day && (
                      <div className="cost-breakdown-item">
                        <div className="cost-item-label">Hospital Inpatient Stay</div>
                        <div className="cost-item-value">
                          {searchResult.estimated_cost.hospitalization_per_day}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Government Schemes Cashless Subsidies */}
                  {searchResult.estimated_cost.government_schemes_coverage?.length > 0 && (
                    <div className="cost-coverage-panel">
                      <div className="cost-panel-title">
                        <ShieldCheck size={15} /> Government scheme coverage
                      </div>
                      <div className="cost-coverage-list">
                        {searchResult.estimated_cost.government_schemes_coverage.map((scheme, sIdx) => (
                          <div key={sIdx} className="cost-coverage-item">
                            <Check size={14} /> <span>{scheme}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savings Tips & Disclaimer */}
                  {searchResult.estimated_cost.savings_tips && (
                    <div className="cost-savings-panel">
                      <span className="cost-savings-label">Cost saving tip</span>
                      <span>{searchResult.estimated_cost.savings_tips}</span>
                    </div>
                  )}

                  <div className="cost-disclaimer">
                    * {searchResult.estimated_cost.disclaimer}
                  </div>
                </div>
              )}

              {/* 1. Verified Matching Hospitals */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} color="#188038" /> Verified Matching Hospitals
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Directly matching clinical condition, departments, and procedural requirements
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#137333', fontWeight: 700, background: '#e6f4ea', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '3px' }}>
                    {searchResult.hospitals?.length || 0} Direct Matches
                  </span>
                </div>

                {searchResult.hospitals?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                    {searchResult.hospitals.map((h, idx) => renderHospitalCard(h, idx, 'AI Verified Match'))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '3px', border: '1px solid #e2e8f0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No specific hospital matched your exact search query. Showing recommended facilities below.
                  </div>
                )}
              </div>

              {/* 2. Matched Doctors */}
              {searchResult.doctors?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>Recommended Specialists</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '14px' }}>
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

              {/* 3. Other Recommended Hospitals in Regional Network */}
              {otherRecommendedHospitals.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} color="var(--primary-blue)" /> Other Recommended Hospitals in Regional Network
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Alternative accredited hospitals, emergency trauma centres, and multi-specialty facilities in Hoshiarpur
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--primary-blue)', fontWeight: 700, background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '3px' }}>
                      {otherRecommendedHospitals.length} Available Facilities
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                    {otherRecommendedHospitals.map((h, idx) => renderHospitalCard(h, idx + 10, 'Regional Facility'))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback when search has not run yet */}
          {!searchResult && allHospitals.length > 0 && (
            <div style={{ marginTop: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="var(--primary-blue)" /> Recommended Regional Hospitals & Healthcare Network
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Browse accredited hospitals, multi-specialty centers, and emergency units across Hoshiarpur
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                {allHospitals.map((h, idx) => renderHospitalCard(h, idx, 'Regional Facility'))}
              </div>
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
              <div key={idx} className={`ai-chat-message ${m.sender === 'user' ? 'user' : 'assistant'} ${m.isEmergency ? 'emergency' : ''}`}>
                <div>{m.text}</div>
                {m.links?.length > 0 && (
                  <div className="ai-chat-links">
                    {m.links.map((link, linkIndex) => (
                      <button
                        key={`${link.url}-${linkIndex}`}
                        type="button"
                        onClick={() => {
                          const path = link.url.split(/[?#]/)[0];
                          const page = path.includes('hospital') ? 'hospitals'
                            : path.includes('doctor') ? 'doctors'
                              : path.includes('appointment') ? 'appointments'
                                : path.includes('lab') ? 'labs'
                                  : path.includes('pharmacy') ? 'pharmacy'
                                    : path.includes('emergency') ? 'emergency' : null;
                          if (page && onNavigatePage) onNavigatePage(page);
                        }}
                      >
                        {link.title} <ArrowUp size={12} />
                      </button>
                    ))}
                  </div>
                )}
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
