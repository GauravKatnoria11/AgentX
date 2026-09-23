import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  Store,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Check,
  ShieldCheck,
  PackageCheck,
  Filter,
  ArrowRight
} from 'lucide-react';
import { fetchMyPrescriptions, fetchPharmacies, fetchMedicines } from '../api';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [medLoading, setMedLoading] = useState(false);
  const [reservedTokens, setReservedTokens] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prescRes, pharmRes] = await Promise.all([
        fetchMyPrescriptions(),
        fetchPharmacies()
      ]);
      if (prescRes.success) setPrescriptions(prescRes.data || []);
      if (pharmRes.success && pharmRes.data && pharmRes.data.length > 0) {
        setPharmacies(pharmRes.data);
        const defaultPharm = pharmRes.data[0];
        setSelectedPharmacy(defaultPharm);
        await loadPharmacyMedicines(defaultPharm.id, '', false);
      }
    } catch (e) {
      console.error('Error loading initial pharmacy data', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPharmacyMedicines = async (pharmacyId, search = '', stockOnly = false) => {
    if (!pharmacyId) return;
    setMedLoading(true);
    try {
      const params = {
        pharmacy_id: pharmacyId,
        in_stock_only: stockOnly
      };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const res = await fetchMedicines(params);
      if (res.success && res.data) {
        setMedicines(res.data);
      } else {
        setMedicines([]);
      }
    } catch (e) {
      console.error('Error loading medicines for pharmacy', e);
    } finally {
      setMedLoading(false);
    }
  };

  const handleSelectPharmacy = (pharm) => {
    setSelectedPharmacy(pharm);
    loadPharmacyMedicines(pharm.id, medSearch, inStockOnly);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedPharmacy) {
      loadPharmacyMedicines(selectedPharmacy.id, medSearch, inStockOnly);
    }
  };

  const handleFilterStockToggle = (val) => {
    setInStockOnly(val);
    if (selectedPharmacy) {
      loadPharmacyMedicines(selectedPharmacy.id, medSearch, val);
    }
  };

  const handleCheckPrescriptionInPharmacy = (medicineName) => {
    setMedSearch(medicineName);
    if (selectedPharmacy) {
      loadPharmacyMedicines(selectedPharmacy.id, medicineName, inStockOnly);
    }
  };

  const handleReserve = (medId) => {
    const randomToken = 'RX-' + Math.floor(1000 + Math.random() * 9000);
    setReservedTokens((prev) => ({ ...prev, [medId]: randomToken }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Prescriptions & Pharmacy Network</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Select a partner pharmacy, search medicine inventory, and verify real-time stock availability
          </div>
        </div>
      </div>

      {/* Active Prescriptions Section */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pill size={18} color="var(--primary-blue)" /> Active Doctor Prescriptions
          </h3>
          <span className="pill-badge blue" style={{ borderRadius: '3px', fontSize: '11px' }}>
            {prescriptions.length} Prescription{prescriptions.length === 1 ? '' : 's'} on File
          </span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>No active prescriptions on file.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prescriptions.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '3px',
                  padding: '14px 18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.diagnosis}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Issued by: <strong>{p.doctor_name || 'Dr. Gurinder Singh'}</strong> • Date: {p.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <span className="pill-badge green" style={{ borderRadius: '3px', fontSize: '11px' }}>
                    <ShieldCheck size={12} /> Authorized Rx
                  </span>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.medications?.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '3px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#eff6ff', color: 'var(--primary-blue)', padding: '5px 7px', borderRadius: '3px', display: 'flex', alignItems: 'center' }}>
                          <Pill size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{m.medicine_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {m.dosage} • {m.frequency} • {m.duration}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCheckPrescriptionInPharmacy(m.medicine_name)}
                        className="btn-google-outline"
                        style={{
                          fontSize: '11px',
                          padding: '5px 12px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Check Stock Availability <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {p.instructions && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '3px', lineHeight: 1.4 }}>
                    <strong>Doctor Instructions:</strong> {p.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STEP 1: Select Pharmacy */}
      <div className="card" style={{ padding: 'clamp(14px, 3vw, 20px)', borderRadius: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              background: 'var(--primary-blue)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '3px'
            }}
          >
            STEP 1
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Select Partner Pharmacy
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Choose a verified local pharmacy in Hoshiarpur to query real-time stock and pricing.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
          {pharmacies.map((ph) => {
            const isSelected = selectedPharmacy?.id === ph.id;
            return (
              <div
                key={ph.id}
                onClick={() => handleSelectPharmacy(ph)}
                style={{
                  padding: '14px 16px',
                  border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  background: isSelected ? '#f0f7ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 1px 3px rgba(37,99,235,0.1)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--primary-blue)' : 'var(--text-main)' }}>
                      {ph.name}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          background: 'var(--primary-blue)',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Check size={10} strokeWidth={3} /> Selected
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{ph.address}, {ph.city}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {ph.hours}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {ph.phone}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2 & 3: Medicine Search & Availability */}
      {selectedPharmacy && (
        <div className="card" style={{ padding: 'clamp(14px, 3vw, 20px)', borderRadius: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    background: 'var(--primary-blue)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '3px'
                  }}
                >
                  STEP 2 & 3
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Search Medicines in {selectedPharmacy.name}
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Results are sorted by availability at this store. In-stock quantities are updated continuously.
              </p>
            </div>

            {/* In-Stock Filter Toggle */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleFilterStockToggle(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: !inStockOnly ? 700 : 500,
                  background: !inStockOnly ? 'var(--primary-blue)' : '#ffffff',
                  color: !inStockOnly ? '#ffffff' : 'var(--text-main)',
                  border: '1px solid ' + (!inStockOnly ? 'var(--primary-blue)' : 'var(--border-subtle)'),
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                All Inventory
              </button>
              <button
                type="button"
                onClick={() => handleFilterStockToggle(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: inStockOnly ? 700 : 500,
                  background: inStockOnly ? '#0d904f' : '#ffffff',
                  color: inStockOnly ? '#ffffff' : 'var(--text-main)',
                  border: '1px solid ' + (inStockOnly ? '#0d904f' : 'var(--border-subtle)'),
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                In Stock Only
              </button>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 'min(100%, 200px)' }}>
              <input
                type="text"
                placeholder={`Search medicines in ${selectedPharmacy.name} (e.g. Paracetamol, Atorvastatin, Metformin)...`}
                value={medSearch}
                onChange={(e) => {
                  setMedSearch(e.target.value);
                  loadPharmacyMedicines(selectedPharmacy.id, e.target.value, inStockOnly);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  background: '#f8fafc'
                }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 20px', borderRadius: '3px', fontSize: '13px' }}
            >
              Search
            </button>
            {medSearch && (
              <button
                type="button"
                className="btn-google-outline"
                style={{ padding: '10px 14px', borderRadius: '3px', fontSize: '12px' }}
                onClick={() => {
                  setMedSearch('');
                  loadPharmacyMedicines(selectedPharmacy.id, '', inStockOnly);
                }}
              >
                Clear
              </button>
            )}
          </form>

          {/* Quick Drug Tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {['Paracetamol', 'Atorvastatin', 'Metformin', 'Amoxicillin', 'Azithromycin', 'Pantoprazole', 'Vitamin D3'].map((drug) => (
              <button
                key={drug}
                type="button"
                onClick={() => {
                  setMedSearch(drug);
                  loadPharmacyMedicines(selectedPharmacy.id, drug, inStockOnly);
                }}
                style={{
                  background: medSearch.toLowerCase() === drug.toLowerCase() ? '#eff6ff' : '#f8fafc',
                  border: '1px solid ' + (medSearch.toLowerCase() === drug.toLowerCase() ? 'var(--primary-blue)' : '#e2e8f0'),
                  color: medSearch.toLowerCase() === drug.toLowerCase() ? 'var(--primary-blue)' : '#475569',
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {drug}
              </button>
            ))}
          </div>

          {/* Medicine Inventory List */}
          {medLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Checking store availability...
            </div>
          ) : medicines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No medicines matched your criteria</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Try searching for generic names or switch to another partner pharmacy above.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Showing <strong>{medicines.length}</strong> medicine{medicines.length === 1 ? '' : 's'} available at {selectedPharmacy.name}:
              </div>

              {medicines.map((m) => {
                const isInStock = m.in_stock && (m.stock_units === undefined || m.stock_units > 0);
                const token = reservedTokens[m.id];

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      background: isInStock ? '#ffffff' : '#fcfcfd',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {m.name}
                        </span>
                        {m.prescription_required ? (
                          <span
                            style={{
                              background: '#eff6ff',
                              color: 'var(--primary-blue)',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            Rx Required
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}
                          >
                            OTC / General
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {m.generic_name} • {m.dosage_form} {m.strength ? `(${m.strength})` : ''} • {m.manufacturer || 'Approved Pharma'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                          ₹{Number(m.price || 0).toFixed(2)}
                        </div>

                        {/* Availability Status */}
                        {isInStock ? (
                          <span
                            className="pill-badge green"
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              marginTop: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontSize: '9px' }}>●</span> In Stock ({m.stock_units ?? 'Available'} units)
                          </span>
                        ) : (
                          <span
                            className="pill-badge red"
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              marginTop: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ✕ Out of Stock (0 units)
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      {token ? (
                        <div
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            padding: '6px 12px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Check size={12} strokeWidth={3} /> Pickup Token #{token}
                        </div>
                      ) : isInStock ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleReserve(m.id)}
                          style={{
                            padding: '7px 14px',
                            fontSize: '12px',
                            borderRadius: '3px'
                          }}
                        >
                          Reserve for Pickup
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="btn-secondary"
                          style={{
                            padding: '7px 14px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            opacity: 0.6,
                            cursor: 'not-allowed'
                          }}
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
