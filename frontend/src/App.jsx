import React, { useState, useEffect } from 'react';
import {
  Building2,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  Activity,
  Sparkles,
  Navigation,
  Search,
  Bell,
  Settings,
  ShieldAlert,
  Flame,
  FlaskConical
} from 'lucide-react';
import './App.css';
import { initGuestAuth } from './api';

import HospitalsPage from './pages/HospitalsPage';
import HospitalDetailPage from './pages/HospitalDetailPage';
import LabsPage from './pages/LabsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import FollowupsPage from './pages/FollowupsPage';
import AIGuidePage from './pages/AIGuidePage';
import MapsPage from './pages/MapsPage';
import EmergencyPage from './pages/EmergencyPage';
import AdminPortal from './pages/AdminPortal';
import HospitalSecurePortal from './pages/HospitalSecurePortal';
import DoctorDrawer from './components/DoctorDrawer';

function App() {
  // Default to Hospitals searching page first (Dashboard removed from patient user side)
  const [currentPage, setCurrentPage] = useState('hospitals');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedHospitalDetailId, setSelectedHospitalDetailId] = useState(null);
  const [hospitalDetailTab, setHospitalDetailTab] = useState('overview');
  const [routePresetDestination, setRoutePresetDestination] = useState('');
  const [preselectedHospital, setPreselectedHospital] = useState(null);
  const [headerSearch, setHeaderSearch] = useState('');
  const [patientLocation, setPatientLocation] = useState({
    name: 'Model Town',
    formatted_address: 'Model Town, Hoshiarpur, Punjab 146001',
    lat: 31.5312,
    lon: 75.9184,
    locality: 'Model Town'
  });

  useEffect(() => {
    initGuestAuth();

    // Check secret query param, path, or hash for Hospital Authority Portal
    const urlParams = new URLSearchParams(window.location.search);
    const portalParam = urlParams.get('portal');
    if (
      portalParam === 'hospital' ||
      portalParam === 'hospital-secure' ||
      portalParam === 'facility' ||
      window.location.pathname.includes('/hospital-portal') ||
      window.location.pathname.includes('/facility-admin') ||
      window.location.pathname.includes('/hosp-login') ||
      window.location.hash.includes('hospital-portal') ||
      window.location.hash.includes('hospital-secure')
    ) {
      setCurrentPage('hospital-portal');
    } else if (window.location.pathname.includes('/admin') || window.location.hash.includes('admin')) {
      setCurrentPage('admin');
    }

    // Secret keyboard shortcuts:
    // Alt+A: Central System Admin
    // Alt+H: Isolated Hospital Authority Portal
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        setCurrentPage((prev) => (prev === 'admin' ? 'hospitals' : 'admin'));
      }
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        setCurrentPage((prev) => (prev === 'hospital-portal' ? 'hospitals' : 'hospital-portal'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHospitalForRoute = (hospital, originLoc) => {
    if (originLoc) {
      setPatientLocation(originLoc);
    }
    setRoutePresetDestination(hospital.name);
    setCurrentPage('maps');
  };

  const handleSelectHospitalForDoctors = (hospital) => {
    setPreselectedHospital(hospital);
    setCurrentPage('doctors');
  };

  const handleOpenHospitalDetail = (hospitalId, tab = 'overview') => {
    setSelectedHospitalDetailId(hospitalId);
    setHospitalDetailTab(tab || 'overview');
    setCurrentPage('hospital-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleHeaderSearch = (e) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      setCurrentPage('ai-guide');
    }
  };

  // Nav Items visible to regular patient (ZERO trace of admin, Dashboard removed)
  const navItems = [
    { id: 'hospitals', label: 'Hospitals Search', icon: Building2 },
    { id: 'emergency', label: '🚨 Emergency SOS', icon: Flame, isEmergency: true },
    { id: 'labs', label: 'Diagnostic Labs', icon: FlaskConical },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'pharmacy', label: 'Pharmacy & Rx', icon: Pill },
    { id: 'followups', label: 'Follow-ups', icon: Activity },
    { id: 'ai-guide', label: 'AI Health Guide', icon: Sparkles },
    { id: 'maps', label: 'Hospital Route', icon: Navigation }
  ];

  const getPageMeta = () => {
    switch (currentPage) {
      case 'hospitals':
        return { title: 'Find Best Hospitals & Clinics', subtitle: 'Search facilities by disease specialization, locality proximity & consultation fee' };
      case 'hospital-detail':
        return { title: 'Hospital Dossier & Transport', subtitle: 'Comprehensive clinical services, specialist staff roster, and 24/7 transportation facilities' };
      case 'emergency':
        return { title: 'Emergency SOS & Critical Triage', subtitle: '24/7 Rapid ambulance dispatch & Level-3 trauma hospital alerts' };
      case 'labs':
        return { title: 'Diagnostic Laboratories & Pathology', subtitle: 'NABL accredited test catalog, home sample collection, MRI & CT imaging' };
      case 'doctors':
        return { title: 'Doctors & Specialists', subtitle: 'Book consultation slots with verified medical practitioners' };
      case 'appointments':
        return { title: 'Appointments & Schedule', subtitle: 'Manage your confirmed consultations and clinic arrival queues' };
      case 'records':
        return { title: 'Personal Medical Records', subtitle: 'End-to-end encrypted health documents with AI summarizer' };
      case 'pharmacy':
        return { title: 'Prescriptions & Pharmacy', subtitle: 'Doctor instructions, medication schedules, and medicine stock' };
      case 'followups':
        return { title: 'Recovery Follow-up Engine', subtitle: 'Scheduled post-treatment health check-ins and symptom tracking' };
      case 'ai-guide':
        return { title: 'AI Healthcare Guide', subtitle: 'Powered by Gemini AI • Triage assistance, search, and FAQ guidance' };
      case 'maps':
        return { title: 'Hospital Navigation & ETA', subtitle: 'Google Maps turn-by-turn routing and departure calculator' };
      default:
        return { title: 'HealthNexus', subtitle: 'Healthcare Discovery & Management Platform' };
    }
  };

  // If in Hospital Authority Portal Mode, render the isolated facility console completely
  if (currentPage === 'hospital-portal' || currentPage === 'hospital-secure') {
    return <HospitalSecurePortal onExitPortal={() => setCurrentPage('hospitals')} />;
  }

  // If in Central Admin Mode, render the standalone Admin Portal layout completely
  if (currentPage === 'admin') {
    return <AdminPortal onExitAdmin={() => setCurrentPage('hospitals')} />;
  }

  const meta = getPageMeta();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        {/* Brand Header (Zero mention of admin, clicking opens hospitals page) */}
        <div
          className="brand-header"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNavigate('hospitals')}
          onDoubleClick={() => setCurrentPage('admin')}
          title="HealthNexus Patient Portal (Double click for gateway)"
        >
          <div className="brand-icon">
            <Building2 size={20} />
          </div>
          <span className="brand-title">HealthNexus</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''} ${item.isEmergency ? 'emergency-nav-item' : ''}`}
                style={item.isEmergency ? {
                  color: isActive ? '#ffffff' : '#dc2626',
                  background: isActive ? '#dc2626' : 'rgba(239, 68, 68, 0.08)',
                  fontWeight: 800
                } : {}}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => handleNavigate('records')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">{meta.title}</h1>
            <span className="page-subtitle">{meta.subtitle}</span>
          </div>

          <div className="header-right">
            {/* Global Search Bar */}
            <div className="search-bar">
              <Search size={16} color="var(--text-light)" />
              <input
                type="text"
                placeholder="Search symptoms, hospitals, tests, doctors..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleHeaderSearch}
              />
            </div>

            {/* Emergency SOS Quick Button in Top Bar */}
            <button
              onClick={() => handleNavigate('emergency')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '8px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <Flame size={15} color="#dc2626" /> Emergency SOS
            </button>

            {/* Notification Bell */}
            <button className="icon-btn" title="Appointments" onClick={() => handleNavigate('appointments')}>
              <Bell size={18} />
            </button>

            {/* User Profile Pill */}
            <div className="user-profile-btn" onClick={() => handleNavigate('records')} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">JD</div>
              <div className="user-info">
                <span className="user-name">John Doe</span>
                <span className="user-role">Patient</span>
              </div>
            </div>
          </div>
        </header>

        {/* Active Page View (each opens cleanly like a distinct page) */}
        <main className="content-area">
          {currentPage === 'hospitals' && (
            <HospitalsPage
              onSelectHospitalForRoute={handleSelectHospitalForRoute}
              onSelectHospitalForDoctors={handleSelectHospitalForDoctors}
              onOpenHospitalDetail={handleOpenHospitalDetail}
              patientLocation={patientLocation}
              onPatientLocationChange={setPatientLocation}
            />
          )}


          {currentPage === 'hospital-detail' && (
            <HospitalDetailPage
              hospitalId={selectedHospitalDetailId}
              initialTab={hospitalDetailTab}
              onBack={() => setCurrentPage('hospitals')}
              onSelectDoctor={(doc) => setSelectedDoctor(doc)}
              onNavigateToRoute={(hospName) => {
                setRoutePresetDestination(hospName);
                setCurrentPage('maps');
              }}
            />
          )}


          {currentPage === 'labs' && <LabsPage />}

          {currentPage === 'emergency' && (
            <EmergencyPage
              onNavigateToRoute={(hospName) => {
                setRoutePresetDestination(hospName);
                setCurrentPage('maps');
              }}
            />
          )}

          {currentPage === 'doctors' && (
            <DoctorsPage
              onSelectDoctor={(doc) => setSelectedDoctor(doc)}
              preselectedHospital={preselectedHospital}
            />
          )}

          {currentPage === 'appointments' && (
            <AppointmentsPage
              onNavigateToRoute={(hospName) => {
                setRoutePresetDestination(hospName);
                setCurrentPage('maps');
              }}
            />
          )}

          {currentPage === 'records' && <MedicalRecordsPage />}

          {currentPage === 'pharmacy' && <PrescriptionsPage />}

          {currentPage === 'followups' && <FollowupsPage />}

          {currentPage === 'ai-guide' && (
            <AIGuidePage
              onSelectDoctor={(doc) => setSelectedDoctor(doc)}
              onNavigateToRoute={(hospName) => {
                setRoutePresetDestination(hospName);
                setCurrentPage('maps');
              }}
            />
          )}

          {currentPage === 'maps' && (
            <MapsPage
              destinationPreset={routePresetDestination}
              patientLocation={patientLocation}
              onSelectPatientLocation={setPatientLocation}
            />
          )}

        </main>
      </div>

      {/* Slide-over Doctor Detail & Chat Drawer (matching the Dribbble view) */}
      <DoctorDrawer
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        onBookClick={(doc) => {
          setSelectedDoctor(null);
          setCurrentPage('doctors');
        }}
        onChatClick={(doc) => {
          setSelectedDoctor(null);
          setCurrentPage('ai-guide');
        }}
      />
    </div>
  );
}

export default App;
