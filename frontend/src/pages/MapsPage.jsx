import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  Car,
  Footprints,
  Bus,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Compass,
  Building2,
  CheckCircle2,
  RefreshCw,
  Crosshair,
  Search
} from 'lucide-react';
import { fetchRoute, fetchETA, searchLocation } from '../api';

const HOSHIARPUR_ORIGINS = [
  'Model Town, Hoshiarpur, Punjab',
  'Civil Lines, Court Road, Hoshiarpur, Punjab',
  'Central Bus Stand, Sutheri Road, Hoshiarpur',
  'Shimla Pahari, Mall Road, Hoshiarpur',
  'Bajwara, NH503A, Hoshiarpur',
  'District Session Courts, Phagwara Road, Hoshiarpur',
  'Railway Station Road, Hoshiarpur',
  'Chandigarh Road Bypass, Hoshiarpur',
  'Purhiran, GT Road, Hoshiarpur',
  'Rayat Bahra Professional University, Bohan, Hoshiarpur'
];

const HOSHIARPUR_HOSPITALS = [
  { name: 'Civil Hospital Hoshiarpur (General Hospital)', address: 'Court Road, Civil Lines, Hoshiarpur' },
  { name: 'Ivy Hospital Hoshiarpur', address: 'Chandigarh-Hoshiarpur Highway, Near Rama Mandi Bypass' },
  { name: 'Vasal Hospital', address: 'Mall Road, Model Town, Hoshiarpur' },
  { name: 'Saini Hospital', address: 'Sutheri Road, Hoshiarpur' },
  { name: 'Apex Hospital & Critical Care', address: 'Sutheri Road, Near Central Bus Stand, Hoshiarpur' },
  { name: 'Lifeline Heart Hospital', address: 'Phagwara Road, Opposite Session Courts, Hoshiarpur' },
  { name: 'Grover Eye Hospital & Laser Centre', address: 'Model Town Road, Near Sessions Chowk, Hoshiarpur' }
];

export default function MapsPage({
  destinationPreset,
  originPreset,
  patientLocation,
  onSelectPatientLocation
}) {
  const [origin, setOrigin] = useState(
    originPreset || patientLocation?.formatted_address || patientLocation?.name || 'Model Town, Hoshiarpur, Punjab'
  );
  const [destination, setDestination] = useState(
    destinationPreset || 'Civil Hospital Hoshiarpur (General Hospital)'
  );
  const [mode, setMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Live Location Search for Origin
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const dropdownRef = useRef(null);

  // Sync destination if preset changes
  useEffect(() => {
    if (destinationPreset) {
      setDestination(destinationPreset);
    }
  }, [destinationPreset]);

  // Sync origin if preset or patientLocation changes
  useEffect(() => {
    if (originPreset) {
      setOrigin(originPreset);
    } else if (patientLocation?.formatted_address || patientLocation?.name) {
      setOrigin(patientLocation.formatted_address || patientLocation.name);
    }
  }, [originPreset, patientLocation]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOriginDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate route whenever origin, destination or mode changes
  useEffect(() => {
    calculateNavigation();
  }, [origin, destination, mode]);

  const calculateNavigation = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const [routeRes, etaRes] = await Promise.all([
        fetchRoute(origin, destination, mode),
        fetchETA(origin, destination, mode)
      ]);
      if (routeRes?.success) setRouteData(routeRes.data);
      if (etaRes?.success) setEtaData(etaRes.data);
    } catch (e) {
      console.error('Route calculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOriginChange = async (val) => {
    setOrigin(val);
    if (val.trim().length >= 2) {
      setIsSearchingOrigin(true);
      try {
        const res = await searchLocation(val);
        if (res.success && res.data) {
          setOriginSuggestions(res.data);
          setShowOriginDropdown(true);
        }
      } catch (err) {
        console.error('Origin search error:', err);
      } finally {
        setIsSearchingOrigin(false);
      }
    } else {
      setOriginSuggestions([]);
      setShowOriginDropdown(false);
    }
  };

  const handleSelectOrigin = (item) => {
    setOrigin(item.formatted_address || item.name);
    setShowOriginDropdown(false);
    if (onSelectPatientLocation) {
      onSelectPatientLocation({
        name: item.name,
        formatted_address: item.formatted_address,
        lat: item.latitude,
        lon: item.longitude,
        locality: item.locality
      });
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const gpsStr = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setOrigin(`My GPS Location (${gpsStr})`);
        if (onSelectPatientLocation) {
          onSelectPatientLocation({
            name: 'My GPS Location',
            formatted_address: `GPS Pin (${gpsStr})`,
            lat: lat,
            lon: lon
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not access device location. Using default Hoshiarpur center.');
      },
      { timeout: 8000 }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    calculateNavigation();
  };

  // REAL WORKING GOOGLE MAPS EMBED DIRECTIONS URL
  // Uses Google Maps embed directions with zero billing/quota restrictions!
  const googleMapsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(
    origin
  )}&daddr=${encodeURIComponent(destination)}&output=embed`;

  // Direct link to launch Google Maps Turn-by-Turn GPS App
  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;

  const cleanInstruction = (htmlStr) => {
    if (!htmlStr) return 'Proceed on route toward hospital destination';
    return htmlStr.replace(/<[^>]*>?/gm, ' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Hospital Route & Live Google Maps Navigation</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time GPS turn-by-turn routing across Hoshiarpur, travel duration, traffic conditions, and departure planner
          </div>
        </div>

        <a
          href={googleMapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ExternalLink size={16} /> Open in Google Maps App
        </a>
      </div>

      {/* Input Route Controls Form */}
      <div className="card" style={{ padding: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Origin with Live Google Maps Autocomplete */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PATIENT STARTING LOCATION (ANYWHERE IN HOSHIARPUR)
                </label>
                <button
                  type="button"
                  onClick={handleUseGPS}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--primary-blue)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Crosshair size={12} /> My Live GPS
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <MapPin size={18} color="var(--primary-blue)" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onFocus={() => {
                    if (originSuggestions.length > 0) setShowOriginDropdown(true);
                  }}
                  placeholder="Type any locality, landmark or address in Hoshiarpur..."
                  style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
                />
                {isSearchingOrigin && (
                  <span style={{ fontSize: '10px', color: 'var(--primary-blue)', fontWeight: 700 }}>
                    Searching...
                  </span>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showOriginDropdown && originSuggestions.length > 0 && (
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
                    maxHeight: '240px',
                    overflowY: 'auto'
                  }}
                >
                  {originSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectOrigin(item)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: idx === originSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <MapPin size={15} color="var(--primary-blue)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.formatted_address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Origin Landmarks */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick:</span>
                {HOSHIARPUR_ORIGINS.slice(0, 5).map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOrigin(loc);
                      setShowOriginDropdown(false);
                    }}
                    style={{
                      background: origin === loc ? '#eff6ff' : '#f1f5f9',
                      border: origin === loc ? '1px solid #bfdbfe' : 'none',
                      color: origin === loc ? 'var(--primary-blue)' : '#475569',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                DESTINATION HOSPITAL (HOSHIARPUR)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Building2 size={18} color="#dc2626" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {HOSHIARPUR_HOSPITALS.map((hosp, idx) => (
                    <option key={idx} value={hosp.name}>
                       {hosp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Hospital Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Hospitals:</span>
                {HOSHIARPUR_HOSPITALS.slice(0, 4).map((h, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDestination(h.name)}
                    style={{
                      background: destination === h.name ? '#fef2f2' : '#f1f5f9',
                      border: destination === h.name ? '1px solid #fecaca' : 'none',
                      color: destination === h.name ? '#dc2626' : '#475569',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {h.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selector & Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '6px' }}>
                Travel Mode:
              </span>
              {[
                { id: 'driving', label: 'Driving (Car/Ambulance)', icon: Car },
                { id: 'transit', label: 'Bus / Transit', icon: Bus },
                { id: 'walking', label: 'Walking', icon: Footprints }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary-blue)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 22px' }}>
              <Navigation size={15} /> {loading ? 'Computing Route...' : 'Recalculate Route'}
            </button>
          </div>
        </form>
      </div>

      {/* REAL WORKING GOOGLE MAP CONTAINER */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ padding: '16px 22px', background: '#ffffff', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} color="var(--primary-blue)" />
            <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
              Interactive Google Maps Navigation View
            </strong>
            <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', color: '#475569', fontWeight: 600 }}>
              Live Hoshiarpur Corridor
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {origin.split(',')[0]} to {destination.split('(')[0]}
            </span>
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                textDecoration: 'none'
              }}
            >
              Full Screen Map <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Real Embedded Google Map with Turn-by-Turn Route */}
        <div style={{ width: '100%', height: '480px', position: 'relative', background: '#e2e8f0' }}>
          <iframe
            title="Google Maps Hospital Route"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={googleMapsEmbedUrl}
          />
        </div>
      </div>

      {/* Route & ETA Telemetry Cards */}
      {routeData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Left: Journey Metrics */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              Route Telemetry: Journey Overview & Corridor Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                  Road Distance
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary-blue)', marginTop: '4px' }}>
                  {routeData.distance_text}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Via Hoshiarpur City Route
                </div>
              </div>

              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  Driving ETA
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                  {routeData.duration_text}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Normal Traffic Flow
                </div>
              </div>
            </div>

            {etaData && (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  <Clock size={16} color="var(--primary-blue)" /> Suggested Departure Window
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '6px' }}>
                  Depart at: {etaData.suggested_departure_time}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Estimated Arrival: <strong>{etaData.eta_timestamp}</strong> (includes hospital OPD registration buffer)
                </div>
              </div>
            )}
          </div>

          {/* Right: Step-by-Step Directions */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              Navigation Steps: Step-by-Step Navigation Instructions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
              {routeData.steps?.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '10px',
                      background: 'var(--primary-blue)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {cleanInstruction(step.instruction)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {step.distance_text} • {step.duration_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
