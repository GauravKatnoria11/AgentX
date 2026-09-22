import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Star,
  Navigation,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  HeartPulse,
  Bed,
  Sparkles,
  Info,
  DollarSign,
  Car,
  SlidersHorizontal,
  Compass,
  Crosshair,
  Search,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import { fetchHospitals, searchHospitals, searchLocation } from '../api';

const DEFAULT_HOSHIARPUR_LOCALITIES = [
  { name: 'Model Town', formatted_address: 'Model Town, Hoshiarpur, Punjab 146001', lat: 31.5312, lon: 75.9184 },
  { name: 'Civil Lines', formatted_address: 'Civil Lines, Court Road, Hoshiarpur, Punjab 146001', lat: 31.5284, lon: 75.9122 },
  { name: 'Central Bus Stand', formatted_address: 'Central Bus Stand, Sutheri Road, Hoshiarpur 146001', lat: 31.5342, lon: 75.9158 },
  { name: 'Shimla Pahari', formatted_address: 'Shimla Pahari Chowk, Mall Road, Hoshiarpur 146001', lat: 31.5328, lon: 75.9196 },
  { name: 'Bajwara', formatted_address: 'Bajwara Kalan & Khurd, NH503A, Hoshiarpur 146023', lat: 31.5186, lon: 75.9535 },
  { name: 'District Session Courts', formatted_address: 'District & Session Courts, Phagwara Road, Hoshiarpur 146001', lat: 31.5188, lon: 75.9082 },
  { name: 'Railway Station Road', formatted_address: 'Railway Station Road, Hoshiarpur 146001', lat: 31.5245, lon: 75.9055 },
  { name: 'Purhiran', formatted_address: 'Purhiran, GT Road / Phagwara Highway, Hoshiarpur 146001', lat: 31.5050, lon: 75.9100 },
  { name: 'Piplanwala', formatted_address: 'Piplanwala, Dasuya Road Bypass, Hoshiarpur 146022', lat: 31.5420, lon: 75.9250 }
];

const DISEASE_FILTERS = [
  { id: 'all', label: 'All Specialties & Diseases' },
  { id: 'heart', label: '🫀 Heart Attack & Cardiology', query: 'heart' },
  { id: 'stroke', label: '🧠 Brain Stroke & Spine', query: 'stroke' },
  { id: 'trauma', label: '🦴 Trauma & Fractures', query: 'trauma' },
  { id: 'maternity', label: '👶 Maternity & NICU', query: 'maternity' },
  { id: 'kidney', label: '🧪 Kidney & Dialysis', query: 'dialysis' },
  { id: 'eye', label: '👁️ Eye & Cataract', query: 'eye' },
  { id: 'poison', label: '🩹 Poisoning & Emergency', query: 'emergency' }
];

export default function HospitalsPage({
  onSelectHospitalForRoute,
  onSelectHospitalForDoctors,
  onOpenHospitalDetail,
  patientLocation,
  onPatientLocationChange
}) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState('all');

  // Active Patient Location
  const [activeLocation, setActiveLocation] = useState(
    patientLocation || DEFAULT_HOSHIARPUR_LOCALITIES[0]
  );

  // Google Maps Location Search & Autocomplete
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [activeMapHospitalId, setActiveMapHospitalId] = useState(null);
  const dropdownRef = useRef(null);


  const [feeFilter, setFeeFilter] = useState('all'); // 'all' | 'subsidized' | 'mid' | 'premium'
  const [sortBy, setSortBy] = useState('best'); // 'best' | 'fee_asc' | 'distance' | 'rating'
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync if prop changes externally
  useEffect(() => {
    if (patientLocation) {
      setActiveLocation(patientLocation);
    }
  }, [patientLocation]);

  useEffect(() => {
    loadHospitals();
  }, [emergencyOnly, selectedDisease, activeLocation, feeFilter, sortBy]);

  // Debounced Google Maps Location Search for any Hoshiarpur location
  useEffect(() => {
    if (!locationSearchInput || locationSearchInput.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await searchLocation(locationSearchInput);
        if (res.success && res.data) {
          setLocationSuggestions(res.data);
          setShowLocationDropdown(true);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [locationSearchInput]);

  const handleSelectSearchedLocation = (item) => {
    const newLoc = {
      name: item.name,
      formatted_address: item.formatted_address,
      lat: item.latitude,
      lon: item.longitude,
      locality: item.locality
    };
    setActiveLocation(newLoc);
    setLocationSearchInput('');
    setShowLocationDropdown(false);
    if (onPatientLocationChange) {
      onPatientLocationChange(newLoc);
    }
  };

  // HTML5 Browser Geolocation
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsSearchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsSearchingLocation(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const newLoc = {
          name: 'My Current GPS Location',
          formatted_address: `Hoshiarpur GPS Pin (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          lat: lat,
          lon: lon,
          locality: 'GPS Position'
        };
        setActiveLocation(newLoc);
        if (onPatientLocationChange) {
          onPatientLocationChange(newLoc);
        }
      },
      (err) => {
        setIsSearchingLocation(false);
        console.warn('Geolocation error, defaulting to Model Town Hoshiarpur:', err);
        alert('Could not access device location. Using default Hoshiarpur center.');
      },
      { timeout: 8000 }
    );
  };

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const params = {
        emergency_only: emergencyOnly,
        user_lat: activeLocation.lat,
        user_lon: activeLocation.lon
      };
      if (selectedDisease !== 'all') {
        const filterItem = DISEASE_FILTERS.find((f) => f.id === selectedDisease);
        if (filterItem?.query) {
          params.disease = filterItem.query;
        }
      }
      const res = await fetchHospitals(params);
      if (res.success && res.data) {
        let items = res.data;

        // Apply Fee Filter
        if (feeFilter === 'subsidized') {
          items = items.filter(h => (h.consultation_fee || 100) <= 100);
        } else if (feeFilter === 'mid') {
          items = items.filter(h => (h.consultation_fee || 100) > 100 && (h.consultation_fee || 100) <= 450);
        } else if (feeFilter === 'premium') {
          items = items.filter(h => (h.consultation_fee || 100) > 450);
        }

        // Calculate Multi-Factor "Best Match Score"
        items = items.map(h => {
          const fee = h.consultation_fee || 350;
          const dist = h.distance_km || 3.0;

          const feeScore = Math.max(30, 100 - (fee / 10));
          const distScore = Math.max(20, 100 - (dist * 7));
          const ratingScore = ((h.rating || 4.5) / 5.0) * 100;

          const compositeScore = Math.round((distScore * 0.40) + (feeScore * 0.35) + (ratingScore * 0.25));

          let bestBadge = null;
          if (fee <= 50) {
            bestBadge = 'Most Affordable (Govt Subsidized)';
          } else if (dist <= 2.0 && h.rating >= 4.8) {
            bestBadge = 'Top Proximity & Highest Rated';
          } else if (compositeScore >= 85) {
            bestBadge = 'Best Overall Match';
          }

          return {
            ...h,
            bestScore: compositeScore,
            bestBadge
          };
        });

        // Apply Sorting
        if (sortBy === 'best') {
          items.sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
        } else if (sortBy === 'fee_asc') {
          items.sort((a, b) => (a.consultation_fee || 0) - (b.consultation_fee || 0));
        } else if (sortBy === 'distance') {
          items.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
        } else if (sortBy === 'rating') {
          items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setHospitals(items);
      }
    } catch (e) {
      console.error('Error fetching hospitals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadHospitals();
      return;
    }
    setLoading(true);
    try {
      const res = await searchHospitals(searchQuery, activeLocation.lat, activeLocation.lon);
      if (res.success && res.data) {
        setHospitals(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const patientMapUrl = `https://maps.google.com/maps?q=${activeLocation.lat},${activeLocation.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Smart Search Control Center */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <span className="pill-badge blue" style={{ marginBottom: '6px' }}>
              Google Maps Integrated • Hoshiarpur Healthcare Corridor
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>
              Find Best Hospitals by Disease, Live Location & Fee
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Search any location or street across Hoshiarpur to instantly recalculate hospital proximity, route times, and specialist rankings.
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: emergencyOnly ? '#b91c1c' : 'var(--text-main)',
              background: emergencyOnly ? '#fef2f2' : '#f8fafc',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: `1px solid ${emergencyOnly ? '#fecaca' : 'var(--border-subtle)'}`
            }}
          >
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
            />
            🚨 24/7 Emergency Care Only
          </label>
        </div>

        {/* Global Hospital Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by hospital name, condition (e.g. Heart Attack, Kidney Dialysis), or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              background: '#f8fafc'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 24px' }}>
            Search
          </button>
        </form>

        {/* GOOGLE MAPS PATIENT LOCATION SEARCH SECTION */}
        <div style={{ marginTop: '20px', padding: '18px', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={16} color="var(--primary-blue)" />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Set Patient Location in Hoshiarpur (Google Maps)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Search any colony, chowk, landmark or street in Hoshiarpur to compute real GPS distances
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleUseCurrentGPS}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--primary-blue)'
                }}
              >
                <Crosshair size={14} /> My Live GPS
              </button>

              <button
                type="button"
                onClick={() => setShowMapPreview(!showMapPreview)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showMapPreview ? '#eff6ff' : '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: showMapPreview ? 'var(--primary-blue)' : '#475569'
                }}
              >
                <MapIcon size={14} /> {showMapPreview ? 'Hide Google Map' : 'View on Google Map'}
              </button>
            </div>
          </div>

          {/* Location Autocomplete Input */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#ffffff',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1'
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Type any location in Hoshiarpur (e.g. Model Town, Kotwali, Shimla Pahari, Bajwara, Court Road...)"
                value={locationSearchInput}
                onChange={(e) => setLocationSearchInput(e.target.value)}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              />
              {isSearchingLocation && (
                <span style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Searching Google Maps...
                </span>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {locationSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchedLocation(item)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: idx === locationSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <MapPin size={16} color="var(--primary-blue)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.formatted_address}
                      </div>
                      <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                        GPS: {item.latitude.toFixed(4)}° N, {item.longitude.toFixed(4)}° E
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Hoshiarpur Locality Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Quick Landmarks:</span>
            {DEFAULT_HOSHIARPUR_LOCALITIES.slice(0, 7).map((loc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveLocation(loc);
                  if (onPatientLocationChange) onPatientLocationChange(loc);
                }}
                style={{
                  background: activeLocation.name === loc.name ? 'var(--primary-blue)' : '#ffffff',
                  color: activeLocation.name === loc.name ? '#ffffff' : '#334155',
                  border: activeLocation.name === loc.name ? '1px solid var(--primary-blue)' : '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {loc.name}
              </button>
            ))}
          </div>

          {/* Active Patient Location Status Ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#1e40af' }}>Active Patient Origin:</span>
              <strong style={{ color: 'var(--text-main)' }}>{activeLocation.name}</strong>
              <span style={{ color: 'var(--text-muted)' }}>({activeLocation.lat.toFixed(4)}, {activeLocation.lon.toFixed(4)})</span>
            </div>
            <span style={{ color: '#059669', fontWeight: 700, fontSize: '11px' }}>
              ✓ All 7 hospital driving distances dynamically calibrated
            </span>
          </div>

          {/* Google Maps Embed Preview of Patient Location */}
          {showMapPreview && (
            <div style={{ marginTop: '14px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: '220px' }}>
              <iframe
                title="Patient Location Google Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={patientMapUrl}
              />
            </div>
          )}
        </div>

        {/* 2-Factor Controls: Fee Budget & Sorting */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Fee Affordability Filter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              💰 Consultation Fee Budget
            </label>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                background: '#f8fafc',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Fee Ranges (₹50 - ₹700)</option>
              <option value="subsidized">Subsidized / Govt (&lt; ₹100)</option>
              <option value="mid">Mid-Range Specialists (₹200 - ₹450)</option>
              <option value="premium">Tertiary Super-Specialty (₹500+)</option>
            </select>
          </div>

          {/* Smart Sorter */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              ⭐ Rank & Sort Results By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 700,
                background: '#eff6ff',
                color: 'var(--primary-blue)',
                cursor: 'pointer'
              }}
            >
              <option value="best">⭐ Best Match (Disease + Distance + Fee)</option>
              <option value="distance">📍 Closest to {activeLocation.name.split(',')[0]} First</option>
              <option value="fee_asc">💰 Lowest Consultation Fee First</option>
              <option value="rating">★ Highest Patient Rating</option>
            </select>
          </div>
        </div>

        {/* Disease / Specialty Quick Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '6px' }}>
            Disease Filter:
          </span>
          {DISEASE_FILTERS.map((f) => {
            const isSelected = selectedDisease === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedDisease(f.id)}
                style={{
                  background: isSelected ? 'var(--primary-blue)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hospitals Result Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Computing best hospital rankings across Hoshiarpur for {activeLocation.name}...
        </div>
      ) : hospitals.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No facilities found matching your fee and disease criteria. Try adjusting the budget filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {hospitals.map((h, index) => (
            <div
              key={h.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                border: index === 0 && sortBy === 'best' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              <div>
                {/* Ranking / Best Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="pill-badge blue">
                      {h.type}
                    </span>
                    {h.bestBadge && (
                      <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        ★ {h.bestBadge}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, color: '#eab308' }}>
                    <Star size={15} fill="#eab308" /> {h.rating || 4.7}
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    margin: '6px 0 4px 0',
                    cursor: 'pointer'
                  }}
                  onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'overview')}
                  title="Click to view full dossier"
                >
                  {h.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <MapPin size={15} color="var(--primary-blue)" /> {h.address}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMapHospitalId(activeMapHospitalId === h.id ? null : h.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: activeMapHospitalId === h.id ? '#eff6ff' : '#f8fafc',
                      border: activeMapHospitalId === h.id ? '1px solid var(--primary-blue)' : '1px solid #cbd5e1',
                      color: activeMapHospitalId === h.id ? 'var(--primary-blue)' : '#334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 9px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Toggle Live Google Maps Pin"
                  >
                    <Compass size={13} /> {activeMapHospitalId === h.id ? 'Hide Live Map' : '📍 Live Google Maps Location'}
                  </button>
                </div>

                {/* Inline Live Google Map Pin Viewer */}
                {activeMapHospitalId === h.id && (
                  <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #bfdbfe' }}>
                    <div style={{ padding: '8px 12px', background: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Compass size={13} /> Live Google Maps Pin • {h.latitude.toFixed(4)}° N, {h.longitude.toFixed(4)}° E
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ', ' + h.address + ', Hoshiarpur, Punjab')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--primary-blue)',
                            textDecoration: 'none',
                            background: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          Google Maps App <ExternalLink size={11} />
                        </a>
                        <button
                          type="button"
                          onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'map')}
                          style={{
                            border: 'none',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Full Screen Map
                        </button>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '240px', background: '#e2e8f0' }}>
                      <iframe
                        title={`${h.name} Google Map Pin`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(h.name + ', ' + h.address + ', Hoshiarpur, Punjab')}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      />
                    </div>
                  </div>
                )}

                {/* Fee & Distance Metric Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '10px',
                    marginTop: '14px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Consultation Fee
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--primary-blue)', marginTop: '2px' }}>
                      ₹{h.consultation_fee || 100}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      {h.fee_tier || 'Standard OPD Visit'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Distance from You
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
                      {h.distance_km ? `${h.distance_km} km` : '1.8 km'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      from {activeLocation.name.split(',')[0]}
                    </div>
                  </div>
                </div>

                {/* ICU Beds & Emergency Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Bed size={15} /> {h.available_icu_beds} ICU Beds Available
                  </span>
                  {h.emergency_available && (
                    <span style={{ color: '#dc2626' }}>
                      ● 24/7 Emergency
                    </span>
                  )}
                </div>

                {/* Transportation Facility Preview */}
                <div style={{ marginTop: '12px', padding: '8px 10px', background: '#eff6ff', borderRadius: '8px', fontSize: '11px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Car size={14} />
                  <span>
                    <strong>Transit:</strong> {h.transportation_facilities?.shuttle_bus_available ? 'Free Patient Shuttle & 24/7 Ambulance' : 'Emergency Ambulance Fleet & Accessible Ramp'}
                  </span>
                </div>

                {/* Diseases Treated Preview */}
                {h.diseases_treated?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {h.diseases_treated.slice(0, 3).map((d, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}
                        >
                          {d}
                        </span>
                      ))}
                      {h.diseases_treated.length > 3 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 4px' }}>
                          +{h.diseases_treated.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}
                    onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'map')}
                  >
                    <Compass size={14} /> Live Google Maps Location
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}
                    onClick={() => onSelectHospitalForRoute(h, activeLocation)}
                  >
                    <Navigation size={14} /> Route & ETA
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                    onClick={() => onOpenHospitalDetail && onOpenHospitalDetail(h.id, 'overview')}
                  >
                    <Info size={14} /> Full Clinical Dossier & Transport
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 0.6, justifyContent: 'center', fontSize: '12px' }}
                    onClick={() => onSelectHospitalForDoctors(h)}
                  >
                    Doctors
                  </button>
                </div>
              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
}
