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
  Menu,
  ShieldAlert,
  FlaskConical,
  LogIn,
  LogOut,
  ChevronDown,
  User,
  ShieldCheck
} from 'lucide-react';
import './App.css';
import { initGuestAuth, fetchCurrentUser, logoutUser, getStoredUser } from './api';
import { initOAuthRedirectListener } from './supabase';

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
import HospitalSecurePortal from './pages/HospitalSecurePortal';
import DoctorDrawer from './components/DoctorDrawer';
import AuthModal from './components/AuthModal';

function App() {
  // Authentication State (genuine user or null)
  const [currentUser, setCurrentUser] = useState(() => {
    const u = getStoredUser();
    return u && u.email !== 'patient@example.com' ? u : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Default to AI Search as main page
  const [currentPage, setCurrentPage] = useState('ai-guide');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedHospitalDetailId, setSelectedHospitalDetailId] = useState('hosp-1');
  const [hospitalDetailTab, setHospitalDetailTab] = useState('overview');
  const [routePresetDestination, setRoutePresetDestination] = useState('');
  const [preselectedHospital, setPreselectedHospital] = useState(null);
  const [headerSearch, setHeaderSearch] = useState('');
  const [doctorToBook, setDoctorToBook] = useState(null);
  const [patientLocation, setPatientLocation] = useState({
    name: 'Model Town',
    formatted_address: 'Model Town, Hoshiarpur, Punjab 146001',
    lat: 31.5312,
    lon: 75.9184,
    locality: 'Model Town'
  });

  useEffect(() => {
    const isOAuthRedirect =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('id_token') ||
      window.location.search.includes('code=');

    if (!isOAuthRedirect) {
      initGuestAuth().then(user => {
        if (user && !currentUser) setCurrentUser(user);
      });
    }

    initOAuthRedirectListener((user) => {
      if (user) setCurrentUser(user);
    });

    fetchCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    });

    // Check secret query param, path, or hash for Hospital Authority Portal
    const urlParams = new URLSearchParams(window.location.search);
    const portalParam = urlParams.get('portal');
    if (
      portalParam === 'hospital' ||
      portalParam === 'hospital-secure' ||
      portalParam === 'facility' ||
      portalParam === 'admin' ||
      window.location.pathname.includes('/hospital-portal') ||
      window.location.pathname.includes('/facility-admin') ||
      window.location.pathname.includes('/hosp-login') ||
      window.location.pathname.includes('/admin') ||
      window.location.hash.includes('hospital-portal') ||
      window.location.hash.includes('hospital-secure') ||
      window.location.hash.includes('admin')
    ) {
      setCurrentPage('hospital-portal');
    }

    // Secret keyboard shortcut:
    // Alt+H: Isolated Hospital Authority Portal
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        setCurrentPage((prev) => (prev === 'hospital-portal' ? 'ai-guide' : 'hospital-portal'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page) => {
    if (page !== 'doctors') {
      setDoctorToBook(null);
    }
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

  // Nav Items relocated strictly to requested sequence without any loss:
  // AI Search (main page) -> Emergency -> Hospital Search -> Doctors -> Appointments -> Medical Records -> Pharmacy & Rx -> Follow-ups -> Diagnostics Labs -> Hospital Routes
  const navItems = [
    { id: 'ai-guide', label: 'AI Search', icon: Sparkles },
    { id: 'emergency', label: 'Emergency', icon: ShieldAlert, isEmergency: true },
    { id: 'hospitals', label: 'Hospital Search', icon: Building2 },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'records', label: 'Medical Records', icon: FileText },
    { id: 'pharmacy', label: 'Pharmacy & Rx', icon: Pill },
    { id: 'followups', label: 'Follow-ups', icon: Activity },
    { id: 'labs', label: 'Diagnostics Labs', icon: FlaskConical },
    { id: 'maps', label: 'Hospital Routes', icon: Navigation }
  ];

  const getPageMeta = () => {
    switch (currentPage) {
      case 'ai-guide':
        return { title: 'AI Search & Clinical Triage', subtitle: 'Instant symptom analysis, disease triage, and cost prediction' };
      case 'emergency':
        return { title: 'Emergency Care', subtitle: '24/7 direct ambulance dispatch, casualty units, and emergency triage' };
      case 'hospitals':
        return { title: 'Hospital Search', subtitle: 'Browse verified hospitals, live ICU beds, and empanelled government schemes' };
      case 'hospital-detail':
        return { title: 'Hospital Overview', subtitle: 'Specialists, clinical services, and route guidance' };
      case 'doctors':
        return { title: 'Doctors & Specialists', subtitle: 'Book appointments with verified specialists and consultants' };
      case 'appointments':
        return { title: 'Appointments & History', subtitle: 'Manage upcoming consultations, queue tokens, and past records' };
      case 'records':
        return { title: 'Medical Records', subtitle: 'Prescriptions, schedules, diet plans, and clinical summaries' };
      case 'pharmacy':
        return { title: 'Pharmacy & Rx', subtitle: 'Select partner pharmacy and search live medicine stock availability' };
      case 'followups':
        return { title: 'Follow-ups', subtitle: 'Post-treatment recovery check-ins, questionnaires, and clinical scores' };
      case 'labs':
        return { title: 'Diagnostics Labs', subtitle: 'Book pathology tests, imaging, and home sample collection' };
      case 'maps':
        return { title: 'Hospital Routes & GPS', subtitle: 'Turn-by-turn navigation and estimated road travel times' };
      default:
        return { title: 'Carelink', subtitle: 'Healthcare Discovery & Management Platform' };
    }
  };

  // If in Hospital Authority Portal Mode, render the isolated facility console completely
  if (currentPage === 'hospital-portal' || currentPage === 'hospital-secure') {
    return <HospitalSecurePortal onExitPortal={() => setCurrentPage('ai-guide')} />;
  }

  const meta = getPageMeta();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div
          className="brand-header"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNavigate('ai-guide')}
          title="Carelink"
        >
          <div className="brand-icon">
            <Building2 size={20} />
          </div>
          <span className="brand-title">Carelink</span>
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
                  color: isActive ? '#ffffff' : '#d93025',
                  background: isActive ? '#d93025' : 'var(--google-red-light)',
                  fontWeight: 700
                } : {}}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">{meta.title}</h1>
          </div>

          <div className="header-right">

            {/* Emergency SOS Quick Button in Top Bar */}
            <button
              onClick={() => handleNavigate('emergency')}
              className="btn-google-danger"
              style={{ padding: '6px 14px', borderRadius: '3px', fontSize: '12px' }}
            >
              <ShieldAlert size={15} /> Emergency SOS
            </button>

            {/* Notification Bell */}
            <button className="icon-btn" title="Appointments" onClick={() => handleNavigate('appointments')}>
              <Bell size={18} />
            </button>

            {/* User Profile Pill / Auth Button */}
            {currentUser ? (
              <div style={{ position: 'relative' }}>
                <div
                  className="user-profile-btn"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      style={{ width: '32px', height: '32px', borderRadius: '3px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="user-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '12px', borderRadius: '3px' }}>
                      {currentUser.full_name
                        ? currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : 'US'}
                    </div>
                  )}
                  <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span className="user-name" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {currentUser.full_name || 'My Account'}
                    </span>
                  </div>
                  <ChevronDown size={14} color="var(--text-light)" />
                </div>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '240px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '3px',
                      padding: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                      zIndex: 1000,
                      color: '#ffffff'
                    }}
                  >
                    <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid #1e293b' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>
                        {currentUser.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all', marginTop: '2px' }}>
                        {currentUser.email}
                      </div>
                      <div style={{ display: 'inline-block', marginTop: '6px', fontSize: '10px', background: '#1e293b', border: '1px solid #334155', padding: '2px 8px', borderRadius: '3px', color: '#38bdf8', fontWeight: 700 }}>
                        {currentUser.role === 'patient' ? 'Verified Account' : (currentUser.role || 'Verified Account')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 0' }}>
                      <button
                        onClick={() => { handleNavigate('records'); setIsProfileMenuOpen(false); }}
                        style={{ textAlign: 'left', background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <FileText size={14} color="#60a5fa" /> Personal Health Records
                      </button>

                      <button
                        onClick={() => { handleNavigate('appointments'); setIsProfileMenuOpen(false); }}
                        style={{ textAlign: 'left', background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Calendar size={14} color="#34d399" /> My Appointments
                      </button>

                      <button
                        onClick={() => { setIsAuthModalOpen(true); setIsProfileMenuOpen(false); }}
                        style={{ textAlign: 'left', background: 'none', border: 'none', color: '#cbd5e1', padding: '8px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sparkles size={14} color="#f59e0b" /> Switch / Add Account
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                      <button
                        onClick={() => {
                          logoutUser();
                          setCurrentUser(null);
                          setIsProfileMenuOpen(false);
                        }}
                        style={{ width: '100%', textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '8px 10px', borderRadius: '3px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn-google-primary"
                style={{ padding: '8px 18px', borderRadius: '3px', fontSize: '13px' }}
              >
                <LogIn size={15} /> Sign In
              </button>
            )}
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
              onSelectDoctor={(doc) => {
                setDoctorToBook(doc);
                setCurrentPage('doctors');
              }}
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
              currentUser={currentUser}
              onSelectDoctor={(doc) => setSelectedDoctor(doc)}
              preselectedHospital={preselectedHospital}
              initialDoctorToBook={doctorToBook}
              onClearDoctorToBook={() => setDoctorToBook(null)}
              onNavigateToAppointments={() => handleNavigate('appointments')}
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
              onSelectHospitalForRoute={handleSelectHospitalForRoute}
              onSelectHospitalForDoctors={handleSelectHospitalForDoctors}
              onOpenHospitalDetail={handleOpenHospitalDetail}
              patientLocation={patientLocation}
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
          setDoctorToBook(doc);
          setCurrentPage('doctors');
        }}
        onChatClick={(doc) => {
          setSelectedDoctor(null);
          setCurrentPage('ai-guide');
        }}
      />

      {/* Patient Authentication Modal (Google, Facebook, Email/Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        onEmergencyClick={() => {
          setIsAuthModalOpen(false);
          handleNavigate('emergency');
        }}
      />
    </div>
  );
}

export default App;
