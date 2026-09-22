import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Star,
  Calendar,
  MapPin,
  Award,
  CheckCircle2,
  Lock,
  ThumbsUp,
  Tag,
  Building2
} from 'lucide-react';
import { fetchDoctorReviews, submitDoctorRating } from '../api';

export default function DoctorDrawer({ doctor, onClose, onBookClick, onChatClick }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingTags, setRatingTags] = useState(['Accurate Diagnosis', 'Compassionate Care']);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMsg, setRatingMsg] = useState('');
  const [ratingErr, setRatingErr] = useState('');

  const AVAILABLE_TAGS = [
    'Accurate Diagnosis',
    'Clear Medicine Schedule',
    'Compassionate Care',
    'Minimal Wait Time',
    'Helpful Diet Advice',
    'Detailed Explanation'
  ];

  useEffect(() => {
    if (doctor?.id) {
      loadReviews(doctor.id);
    }
  }, [doctor]);

  const loadReviews = async (docId) => {
    setLoadingReviews(true);
    try {
      const res = await fetchDoctorReviews(docId);
      if (res.success && res.data) {
        setReviewsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const toggleTag = (tag) => {
    setRatingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    setRatingErr('');
    try {
      const payload = {
        rating: ratingStars,
        comment: ratingComment || 'Excellent consultation experience.',
        tags: ratingTags
      };
      const res = await submitDoctorRating(doctor.id, payload);
      if (res.success) {
        setRatingMsg(`Rating of ${ratingStars}★ published successfully!`);
        setTimeout(() => {
          setShowRateModal(false);
          setRatingMsg('');
          loadReviews(doctor.id);
        }, 1500);
      } else {
        setRatingErr(res.message || res.detail || 'Could not submit rating.');
      }
    } catch (err) {
      setRatingErr('Error submitting doctor rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!doctor) return null;

  const avgRating = reviewsData?.average_rating || doctor.rating || 4.9;
  const totalReviews = reviewsData?.total_reviews || 0;
  const canRate = reviewsData?.can_rate || false;
  const reviewsList = reviewsData?.reviews || [];

  return (
    <div className="doctor-drawer-overlay" onClick={onClose}>
      <div className="doctor-drawer" style={{ maxWidth: '440px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
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

          {/* Specific Hospital Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700
          }}>
            <Building2 size={14} />
            <span>{doctor.hospital_name || 'Hoshiarpur Hospital'}</span>
          </div>

          {/* Rating Summary Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            background: '#fef3c7',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#b45309'
          }}>
            <Star size={16} fill="#f59e0b" color="#f59e0b" />
            <span>{avgRating} / 5.0</span>
            <span style={{ color: '#92400e', fontWeight: 500 }}>({totalReviews} verified reviews)</span>
          </div>

          <p className="drawer-bio" style={{ marginTop: '12px' }}>
            {doctor.bio || "Specialist in comprehensive care, focused on preventative protocols and clinical procedures. Dedicated to holistic patient recovery."}
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
              <MessageSquare size={16} /> AI Chat Guide
            </button>
          </div>
        </div>

        {/* Verified Patient Reviews Section */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Verified Patient Reviews
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Exclusively from completed consultations
              </div>
            </div>

            {canRate ? (
              <button
                onClick={() => setShowRateModal(true)}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Star size={13} fill="#ffffff" /> Rate Doctor
              </button>
            ) : (
              <span
                title="Only patients who completed an appointment can rate."
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '4px 10px',
                  borderRadius: '9999px'
                }}
              >
                <Lock size={11} /> Verified Patients Only
              </span>
            )}
          </div>

          {/* Rating Breakdown */}
          {reviewsData && (
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700 }}>
                <span>Overall Rating Quality</span>
                <span style={{ color: '#d97706' }}>★ {avgRating} out of 5</span>
              </div>
              {[5, 4, 3, 2, 1].map((s) => {
                const count = reviewsData.breakdown?.[String(s)] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ width: '28px', color: 'var(--text-muted)' }}>{s} ★</span>
                    <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b' }} />
                    </div>
                    <span style={{ width: '20px', textAlign: 'right', color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* List of Verified Reviews */}
          {loadingReviews ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
              Loading verified reviews...
            </div>
          ) : reviewsList.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
              No reviews yet for this doctor. Be the first verified patient to review after consultation!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {rev.patient_name}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', color: '#065f46', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', marginTop: '2px' }}>
                        <CheckCircle2 size={10} /> Verified Consultation
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontWeight: 700, fontSize: '13px' }}>
                      <Star size={13} fill="#f59e0b" /> {rev.rating}★
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: '6px 0' }}>
                    "{rev.comment}"
                  </p>

                  {rev.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                      {rev.tags.map((t) => (
                        <span key={t} style={{ fontSize: '10px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for rating doctor directly from drawer */}
        {showRateModal && (
          <div className="doctor-drawer-overlay" onClick={() => setShowRateModal(false)}>
            <div
              className="card"
              style={{ width: '400px', maxWidth: '90%', margin: 'auto', padding: '20px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>
                Rate {doctor.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Verified consultation rating for your completed appointment.
              </p>

              {ratingErr && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                  {ratingErr}
                </div>
              )}

              {ratingMsg && (
                <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                  {ratingMsg}
                </div>
              )}

              <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Score</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRatingStars(s)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <Star size={24} color="#f59e0b" fill={ratingStars >= s ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Highlights</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {AVAILABLE_TAGS.map((t) => {
                      const sel = ratingTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            background: sel ? '#2563eb' : '#f1f5f9',
                            color: sel ? '#ffffff' : '#334155',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {sel ? '✓ ' : '+ '} {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Feedback</label>
                  <textarea
                    rows={2}
                    placeholder="Feedback about doctor's diagnosis, clarity, and care..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setShowRateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submittingRating}
                    style={{ flex: 2, justifyContent: 'center', background: '#059669' }}
                  >
                    {submittingRating ? 'Saving...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
