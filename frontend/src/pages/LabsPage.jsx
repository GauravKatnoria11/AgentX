import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Home,
  Building,
  ShieldCheck,
  Phone,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  Star,
  AlertTriangle
} from 'lucide-react';
import { fetchLabs, fetchLabTests, bookLabTest } from '../api';

const TEST_CATEGORIES = [
  { id: 'all', label: 'All Diagnostic Tests' },
  { id: 'pathology', label: 'Blood & Pathology', query: 'Pathology' },
  { id: 'cardiology', label: 'Cardiac Biomarkers', query: 'Cardiology' },
  { id: 'radiology', label: 'MRI & CT Scans', query: 'Radiology' },
  { id: 'ultrasound', label: 'Ultrasound & Echo', query: 'Ultrasound' },
  { id: 'package', label: 'Full Body Packages', query: 'Package' }
];

export default function LabsPage({ currentUser, onRequireSignIn }) {
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('tests'); // 'tests' | 'labs'

  // Booking Modal State
  const [selectedTestToBook, setSelectedTestToBook] = useState(null);
  const [patientName, setPatientName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [collectionType, setCollectionType] = useState('home_collection');
  const [preferredDate, setPreferredDate] = useState('2026-09-25');
  const [preferredTime, setPreferredTime] = useState('08:00 AM');
  const [homeAddress, setHomeAddress] = useState('Model Town, Hoshiarpur, Punjab');
  const [bookingResult, setBookingResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  useEffect(() => {
    if (currentUser) {
      setPatientName(currentUser.full_name || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const catQuery = selectedCategory !== 'all' ? (TEST_CATEGORIES.find(c => c.id === selectedCategory)?.query || '') : '';
      const [labsRes, testsRes] = await Promise.all([
        fetchLabs(),
        fetchLabTests(catQuery, searchQuery)
      ]);
      if (labsRes?.success) setLabs(labsRes.data || []);
      if (testsRes?.success) setTests(testsRes.data || []);
    } catch (e) {
      console.error('Error fetching labs data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenBookModal = (testItem) => {
    if (!currentUser) {
      onRequireSignIn?.('Sign in to book a diagnostic test. Your contact details are needed to confirm the booking.', 'labs');
      return;
    }
    setSelectedTestToBook(testItem);
    setBookingResult(null);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireSignIn?.('Sign in to book a diagnostic test.', 'labs');
      return;
    }
    if (!selectedTestToBook) return;
    setIsSubmitting(true);
    try {
      const payload = {
        lab_id: selectedTestToBook.lab_id,
        test_name: selectedTestToBook.name,
        patient_name: patientName,
        phone: phone,
        collection_type: collectionType,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        address: collectionType === 'home_collection' ? homeAddress : 'Lab Walk-in Centre'
      };

      const res = await bookLabTest(payload);
      if (res?.success && res.data) {
        setBookingResult(res.data);
      }
    } catch (e) {
      console.error('Failed to book lab test:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search & Mode Header Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Diagnostic Laboratories
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Book pathology tests, imaging, and home sample collection
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('tests')}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'tests' ? '#ffffff' : 'transparent',
                color: viewMode === 'tests' ? 'var(--primary-blue)' : 'var(--text-muted)',
                boxShadow: viewMode === 'tests' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Test Catalog ({tests.length})
            </button>
            <button
              onClick={() => setViewMode('labs')}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewMode === 'labs' ? '#ffffff' : 'transparent',
                color: viewMode === 'labs' ? 'var(--primary-blue)' : 'var(--text-muted)',
                boxShadow: viewMode === 'labs' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Verified Labs ({labs.length})
            </button>
          </div>
        </div>

        {/* Search Bar & Category Pills */}
        <div style={{ marginTop: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by test name (e.g. CBC, MRI, Lipid, Dengue, HbA1c, Thyroid)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  background: '#f8fafc'
                }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '8px 24px', flex: '0 1 auto' }}>
              Search Tests
            </button>
          </form>

          {/* Categories */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', marginTop: '14px' }}>
            {TEST_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    background: isSelected ? 'var(--primary-blue)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: INDIVIDUAL TEST CATALOG */}
      {viewMode === 'tests' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading diagnostic test directory...
            </div>
          ) : tests.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No diagnostic tests found matching your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
              {tests.map((t, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '22px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="pill-badge blue" style={{ fontSize: '11px' }}>
                        {t.category}
                      </span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: t.price === 0 ? '#16a34a' : 'var(--primary-blue)' }}>
                        {t.price === 0 ? 'FREE / Subsidized' : `₹${t.price}`}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0 4px 0' }}>
                      {t.name}
                    </h3>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {t.description}
                    </div>

                    {/* Test Info Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      <span style={{ fontSize: '11px', background: '#f8fafc', padding: '4px 8px', borderRadius: '10px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {t.turnaround_hours}h Report TAT
                      </span>
                      <span style={{ fontSize: '11px', background: t.fasting_required ? '#fef2f2' : '#f0fdf4', color: t.fasting_required ? '#dc2626' : '#16a34a', padding: '4px 8px', borderRadius: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {t.fasting_required ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {t.fasting_required ? '10-12h Fasting' : 'No Fasting Needed'}
                      </span>
                      {t.home_collection && (
                        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1a73e8', padding: '4px 8px', borderRadius: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Home size={12} /> Home Collection Free
                        </span>
                      )}
                    </div>

                    {/* Lab Facility */}
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FlaskConical size={13} color="var(--primary-blue)" />
                        Laboratory: <strong style={{ color: 'var(--text-main)' }}>{t.lab_name}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={11} /> {t.lab_address}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <button
                      className="btn-google-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleOpenBookModal(t)}
                    >
                      Book Test / Schedule Collection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: LAB CENTRES DIRECTORY */}
      {viewMode === 'labs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {labs.map((lab) => (
            <div key={lab.id} className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="pill-badge green" style={{ marginBottom: '6px' }}>
                      {lab.accreditation || 'NABL Accredited'}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
                      {lab.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} fill="#d97706" color="#d97706" /> {lab.rating || 4.8}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <MapPin size={15} color="var(--primary-blue)" /> {lab.address}, {lab.city}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <Phone size={15} /> {lab.contact_phone} • {lab.hours}
                </div>

                {/* Available Tests Preview */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Diagnostic Capabilities ({lab.tests?.length || lab.test_types?.length} Tests):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(lab.test_types || []).map((type, i) => (
                      <span key={i} style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '4px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: lab.home_collection ? '#059669' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {lab.home_collection ? <CheckCircle2 size={13} color="#059669" /> : null}
                  {lab.home_collection ? 'Home Sample Pickup Available' : 'Centre Walk-in Only'}
                </span>
                <button
                  className="btn-google-outline"
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                  onClick={() => {
                    setViewMode('tests');
                    setSearchQuery(lab.name.split(' ')[0]);
                  }}
                >
                  View Tests & Prices
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedTestToBook && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'clamp(10px, 3vw, 20px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '10px', width: '100%', maxWidth: 'min(540px, 94vw)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="pill-badge blue">Hoshiarpur Diagnostic Desk</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-main)' }}>
                  Schedule Diagnostic Test
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestToBook(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {bookingResult ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#166534', margin: 0 }}>
                  Booking Confirmed!
                </h3>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Your Diagnostic Token Number: <strong style={{ color: 'var(--primary-blue)', fontSize: '16px' }}>{bookingResult.token_number}</strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginTop: '20px', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Test:</strong> {bookingResult.test_name}</div>
                  <div><strong>Laboratory:</strong> {bookingResult.lab_name}</div>
                  <div><strong>Schedule:</strong> {bookingResult.scheduled_at}</div>
                  <div><strong>Collection Mode:</strong> {bookingResult.collection_type === 'home_collection' ? 'Home Sample Collection' : 'Lab Walk-in'}</div>
                  <div><strong>Total Amount:</strong> ₹{bookingResult.total_price} (Pay online or on sample pickup)</div>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '6px' }}>
                    Preparation Guidelines:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
                    {bookingResult.instructions?.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>

                <button
                  className="btn-google-primary"
                  style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
                  onClick={() => setSelectedTestToBook(null)}
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Summary Banner */}
                <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase' }}>Selected Test</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{selectedTestToBook.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedTestToBook.lab_name}</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-blue)' }}>
                    ₹{selectedTestToBook.price}
                  </div>
                </div>

                {/* Collection Type Selector */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    SAMPLE COLLECTION PREFERENCE
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                    <div
                      onClick={() => setCollectionType('home_collection')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${collectionType === 'home_collection' ? 'var(--primary-blue)' : 'var(--border-subtle)'}`,
                        background: collectionType === 'home_collection' ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <Home size={18} color={collectionType === 'home_collection' ? 'var(--primary-blue)' : '#64748b'} style={{ margin: '0 auto 4px auto' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Home Collection</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phlebotomist visits home</div>
                    </div>

                    <div
                      onClick={() => setCollectionType('lab_visit')}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${collectionType === 'lab_visit' ? 'var(--primary-blue)' : 'var(--border-subtle)'}`,
                        background: collectionType === 'lab_visit' ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <Building size={18} color={collectionType === 'lab_visit' ? 'var(--primary-blue)' : '#64748b'} style={{ margin: '0 auto 4px auto' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Visit Centre</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Priority walk-in slot</div>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      PATIENT NAME
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      PHONE NUMBER
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      COLLECTION DATE
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      TIME SLOT
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    >
                      <option value="06:30 AM">06:30 AM (Fasting Slot)</option>
                      <option value="07:30 AM">07:30 AM (Fasting Slot)</option>
                      <option value="08:30 AM">08:30 AM (Morning Slot)</option>
                      <option value="10:00 AM">10:00 AM (Morning Slot)</option>
                      <option value="12:00 PM">12:00 PM (Noon Slot)</option>
                      <option value="04:00 PM">04:00 PM (Evening Slot)</option>
                    </select>
                  </div>
                </div>

                {/* Address if home collection */}
                {collectionType === 'home_collection' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      HOME ADDRESS IN HOSHIARPUR
                    </label>
                    <input
                      type="text"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      required
                      placeholder="House/Plot no., Street, Locality, Hoshiarpur"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTestToBook(null)}
                    className="btn-google-outline"
                    style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-google-primary"
                    style={{ flex: 2, padding: '12px', justifyContent: 'center' }}
                  >
                    {isSubmitting ? 'Confirming...' : 'Confirm Test Booking'}
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
