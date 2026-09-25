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
import { fetchRoute, searchLocation } from '../api';
import { getAccurateGPSLocation } from '../utils/geolocation';

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
  { name: 'Civil Hospital Hoshiarpur (General Hospital)', address: 'Jalandhar Road, Hoshiarpur, Punjab' },
  { name: 'IVY Hospital', address: 'Opposite St. Joseph School, Chandigarh Road, Hoshiarpur' },
  { name: 'K.D.M. Hospital', address: 'Near Tanda Bye Pass Chowk, Hoshiarpur' },
  { name: 'St. Joseph Hospital', address: 'Ram Colony Camp, Hoshiarpur' },
  { name: 'New Saini Hospital', address: '11 Fatehgarh Road, Hoshiarpur' },
  { name: 'Central Hospital', address: 'Sutheri Road, Hoshiarpur' },
  { name: 'Bariana Eye Hospital', address: '1-R Model Town, Hoshiarpur' }
];

const hospitalRouteQuery = (hospital) => `${hospital.name}, ${hospital.address}, Punjab, India`;

export default function MapsPage({
  destinationPreset,
  originPreset,
  patientLocation,
  onSelectPatientLocation
}) {
  const [origin, setOrigin] = useState(
    originPreset || patientLocation?.formatted_address || patientLocation?.name || 'Model Town, Hoshiarpur, Punjab'
  );
  const [originCoords, setOriginCoords] = useState(
    patientLocation?.isExactGPS && patientLocation?.lat && patientLocation?.lon
      ? { lat: patientLocation.lat, lon: patientLocation.lon }
      : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');
  const [gpsAccuracyInfo, setGpsAccuracyInfo] = useState(
    patientLocation?.isExactGPS ? `±${patientLocation.accuracy || 8}m (${patientLocation.accuracy_label || 'GPS Lock'})` : null
  );
  const [destination, setDestination] = useState(
    destinationPreset || hospitalRouteQuery(HOSHIARPUR_HOSPITALS[0])
  );
  const [mode, setMode] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Live Location Search for Origin
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const dropdownRef = useRef(null);

  // Sync destination if preset changes
  useEffect(() => {
    if (destinationPreset) {
      setDestination(destinationPreset);
      setRouteData(null);
      setEtaData(null);
    }
  }, [destinationPreset]);

  // Sync origin if preset or patientLocation changes
  useEffect(() => {
    if (originPreset) {
      setOrigin(originPreset);
      setOriginCoords(null);
      setRouteData(null);
      setEtaData(null);
    } else if (patientLocation?.formatted_address || patientLocation?.name) {
      setOrigin(patientLocation.formatted_address || patientLocation.name);
      setOriginCoords(
        patientLocation.isExactGPS && patientLocation.lat && patientLocation.lon
          ? { lat: patientLocation.lat, lon: patientLocation.lon }
          : null
      );
      setRouteData(null);
      setEtaData(null);
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

  const calculateNavigation = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setRouteError('');
    setRouteData(null);
    setEtaData(null);
    try {
      const routeOrigin = originCoords ? `${originCoords.lat},${originCoords.lon}` : origin;
      const routeRes = await fetchRoute(routeOrigin, destination, mode);
      if (!routeRes?.success || !routeRes.data) {
        throw new Error(routeRes?.detail || routeRes?.message || 'Could not calculate a route. Check the location and try again.');
      }
      setRouteData(routeRes.data);
      const departure = new Date();
      const arrival = new Date(departure.getTime() + routeRes.data.duration_minutes * 60000);
      const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
      setEtaData({
        suggested_departure_time: timeFormat.format(departure),
        eta_timestamp: timeFormat.format(arrival)
      });
    } catch (e) {
      console.error('Route calculation error:', e);
      setRouteError(e.message || 'Could not calculate a route. Check the location and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOriginChange = async (val) => {
    setOrigin(val);
    setOriginCoords(null);
    setGpsAccuracyInfo(null);
    setRouteData(null);
    setEtaData(null);
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
    // Search suggestions may be neighborhood-level only; geocode the selected address on route submit.
    setOriginCoords(null);
    setGpsAccuracyInfo(null);
    setRouteData(null);
    setEtaData(null);
    setShowOriginDropdown(false);
  };

  const handleUseGPS = async () => {
    setGpsLoading(true);
    setGpsStatusMsg('Acquiring high-accuracy GPS fix...');
    try {
      const loc = await getAccurateGPSLocation((msg) => setGpsStatusMsg(msg));
      setOrigin(loc.formatted_address || loc.name);
      setOriginCoords({ lat: loc.lat, lon: loc.lon });
      setRouteData(null);
      setEtaData(null);
      setGpsAccuracyInfo(`±${loc.accuracy}m (${loc.accuracy_label})`);
      if (onSelectPatientLocation) {
        onSelectPatientLocation(loc);
      }
    } catch (err) {
      console.warn('Geolocation error:', err);
      alert(err.message || 'Could not access device GPS.');
    } finally {
      setGpsLoading(false);
      setGpsStatusMsg('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    calculateNavigation();
  };

  // Use coordinates only for a fresh, exact GPS fix; typed addresses resolve when the route is requested.
  const originParam = routeData?.origin_lat != null && routeData?.origin_lon != null
    ? `${routeData.origin_lat},${routeData.origin_lon}`
    : originCoords ? `${originCoords.lat},${originCoords.lon}` : origin;
  const destinationParam = routeData?.destination_lat != null && routeData?.destination_lon != null
    ? `${routeData.destination_lat},${routeData.destination_lon}`
    : destination;

  // Google Maps preview starts from the same provider-resolved endpoints.
  const googleMapsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(
    originParam
  )}&daddr=${encodeURIComponent(destinationParam)}&output=embed`;

  useEffect(() => {
    setIsMapLoading(true);
  }, [googleMapsEmbedUrl]);

  // Direct link to launch Google Maps Turn-by-Turn GPS App
  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    originParam
  )}&destination=${encodeURIComponent(destinationParam)}&travelmode=${mode}`;

  const cleanInstruction = (htmlStr) => {
    if (!htmlStr) return 'Proceed on route toward hospital destination';
    return htmlStr.replace(/<[^>]*>?/gm, ' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Hospital Routes & Directions</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Road routes and travel estimates for the addresses you enter. Live traffic is shown when available.
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
      <div className="card" style={{ padding: 'clamp(14px, 3.5vw, 24px)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            {/* Origin with Live Google Maps Autocomplete */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PATIENT STARTING LOCATION (ANYWHERE IN HOSHIARPUR)
                </label>
                <button
                  type="button"
                  onClick={handleUseGPS}
                  disabled={gpsLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    background: 'transparent',
                    color: gpsLoading ? 'var(--text-muted)' : 'var(--primary-blue)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: gpsLoading ? 'wait' : 'pointer'
                  }}
                >
                  <Crosshair size={12} /> {gpsLoading ? 'Locking GPS...' : 'My Live GPS'}
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

              {gpsStatusMsg && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                  🛰️ {gpsStatusMsg}
                </div>
              )}

              {gpsAccuracyInfo && !gpsStatusMsg && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="#16a34a" /> Live GPS Accurate to {gpsAccuracyInfo}
                </div>
              )}

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
                      setOriginCoords(null);
                      setRouteData(null);
                      setEtaData(null);
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
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setRouteData(null);
                    setEtaData(null);
                  }}
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
                    <option key={idx} value={hospitalRouteQuery(hosp)}>
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
                    onClick={() => {
                      setDestination(hospitalRouteQuery(h));
                      setRouteData(null);
                      setEtaData(null);
                    }}
                    style={{
                      background: destination === hospitalRouteQuery(h) ? '#fef2f2' : '#f1f5f9',
                      border: destination === hospitalRouteQuery(h) ? '1px solid #fecaca' : 'none',
                      color: destination === hospitalRouteQuery(h) ? '#dc2626' : '#475569',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    onClick={() => {
                      setMode(m.id);
                      setRouteData(null);
                      setEtaData(null);
                    }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
        <div className="map-location-frame" style={{ width: '100%', height: 'clamp(300px, 50vh, 480px)', background: '#e2e8f0' }}>
          <iframe
            title="Google Maps Hospital Route"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            onLoad={() => setIsMapLoading(false)}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={googleMapsEmbedUrl}
          />
          {isMapLoading && (
            <div className="map-location-loading" role="status" aria-live="polite">
              <span className="map-location-spinner" aria-hidden="true" />
              <span>Updating map…</span>
            </div>
          )}
        </div>
      </div>

      {routeError && (
        <div role="alert" className="card" style={{ padding: '14px 16px', color: '#9a342e', background: '#fbf5f3', borderColor: '#ead8d4', fontSize: '13px' }}>
          {routeError}
        </div>
      )}

      {/* Route & ETA Telemetry Cards */}
      {routeData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {/* Left: Journey Metrics */}
          <div className="card" style={{ padding: 'clamp(16px, 3.5vw, 24px)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              Route Telemetry: Journey Overview & Corridor Telemetry
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                  Road Distance
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--primary-blue)', marginTop: '4px' }}>
                  {routeData.distance_text}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {routeData.routing_source === 'google' ? 'Google Maps route' : 'OpenStreetMap road route'}
                </div>
                {routeData.routing_source === 'openstreetmap' && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    © OpenStreetMap contributors
                  </div>
                )}
              </div>

              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  Driving ETA
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                  {routeData.duration_text}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {routeData.traffic_aware ? 'Live traffic estimate' : 'Traffic conditions not provided'}
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
                  Estimated arrival: <strong>{etaData.eta_timestamp}</strong>
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
