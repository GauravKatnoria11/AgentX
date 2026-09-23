import React, { useState, useEffect } from 'react';
import { Pill, Clock, Store, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchMyPrescriptions, fetchPharmacies, fetchMedicines } from '../api';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prescRes, pharmRes, medRes] = await Promise.all([
        fetchMyPrescriptions(),
        fetchPharmacies(),
        fetchMedicines()
      ]);
      if (prescRes.success) setPrescriptions(prescRes.data || []);
      if (pharmRes.success) setPharmacies(pharmRes.data || []);
      if (medRes.success) setMedicines(medRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMedSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchMedicines({ search: medSearch });
      if (res.success) setMedicines(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Prescriptions & Pharmacy</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Doctor-issued medication schedules, partner pharmacy stock, and refill management
          </div>
        </div>
      </div>

      {/* Active Prescriptions */}
      <div className="card" style={{ padding: '26px 28px', borderRadius: '10px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px' }}>
          Active Prescriptions
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '24px 0' }}>No active prescriptions on file.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {prescriptions.map((p) => (
              <div key={p.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.diagnosis}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Issued by: <strong>{p.doctor_name || 'Dr. Sarah Adams'}</strong> • {p.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <span className="pill-badge blue" style={{ padding: '5px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>Authorized Rx</span>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {p.medications?.map((m, idx) => (
                    <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#eff6ff', color: 'var(--primary-blue)', padding: '6px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                          <Pill size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{m.medicine_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {m.dosage} • {m.frequency} • {m.duration}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: '#f8fafc', padding: '4px 10px', borderRadius: '10px' }}>
                        {m.instructions}
                      </span>
                    </div>
                  ))}
                </div>

                {p.instructions && (
                  <div style={{ marginTop: '16px', fontSize: '13px', color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '10px', lineHeight: 1.5 }}>
                    <strong>Doctor Instructions:</strong> {p.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partner Pharmacies & Medicine Search */}
      <div className="dashboard-columns">
        {/* Pharmacy Locator */}
        <div className="card" style={{ padding: '26px 28px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={20} color="var(--primary-blue)" /> Partner Pharmacies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pharmacies.map((ph) => (
              <div key={ph.id} style={{ padding: '16px 18px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{ph.name}</span>
                  <span className="pill-badge green" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px' }}>{ph.hours}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                  {ph.address}, {ph.city}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '4px', fontWeight: 600 }}>
                  Tel: {ph.phone}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Inventory */}
        <div className="card" style={{ padding: '26px 28px', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px' }}>
            Search Medicine Inventory
          </h3>
          <form onSubmit={handleMedSearch} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            <input
              type="text"
              placeholder="Search generic or brand name..."
              value={medSearch}
              onChange={(e) => setMedSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '13px', background: '#f8fafc' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>Search</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {medicines.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: '#ffffff', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {m.generic_name} • {m.dosage_form}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>₹{m.price.toFixed(2)}</div>
                  <span className={`pill-badge ${m.in_stock ? 'green' : 'red'}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', marginTop: '3px', display: 'inline-block' }}>
                    {m.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
