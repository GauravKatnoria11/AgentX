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
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
          Active Prescriptions
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active prescriptions on file.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {prescriptions.map((p) => (
              <div key={p.id} style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {p.diagnosis}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Issued by: {p.doctor_name || 'Dr. Sarah Adams'} • {p.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <span className="pill-badge blue">Authorized Rx</span>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.medications?.map((m, idx) => (
                    <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Pill size={18} color="var(--primary-blue)" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{m.medicine_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {m.dosage} • {m.frequency} • {m.duration}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {m.instructions}
                      </span>
                    </div>
                  ))}
                </div>

                {p.instructions && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px' }}>
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
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} color="var(--primary-blue)" /> Partner Pharmacies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pharmacies.map((ph) => (
              <div key={ph.id} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{ph.name}</span>
                  <span className="pill-badge green">{ph.hours}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {ph.address}, {ph.city}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--primary-blue)', marginTop: '2px' }}>
                  📞 {ph.phone}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Inventory */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Search Medicine Inventory
          </h3>
          <form onSubmit={handleMedSearch} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Search generic or brand name..."
              value={medSearch}
              onChange={(e) => setMedSearch(e.target.value)}
              style={{ flex: 1, padding: '8px 14px', borderRadius: '9999px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Search</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {medicines.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {m.generic_name} • {m.dosage_form}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>₹{m.price.toFixed(2)}</div>
                  <span className={`pill-badge ${m.in_stock ? 'green' : 'red'}`} style={{ fontSize: '10px' }}>

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
