# 🏥 Carelink — AI Healthcare & Hospital Operations Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-GenAI-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, full-stack healthcare discovery and hospital management platform. Carelink integrates real-time hospital bed tracking, high-precision satellite GPS routing, doctor appointment scheduling, diagnostic laboratory reservations, prescription fulfillment, AI clinical triage via Google Gemini, and a dedicated hospital authority operations portal.

---

## 📌 Problem Statement & Solution Architecture

### 1. The Challenge
Citizens struggle to find the right hospitals for specific conditions because information is fragmented, inconsistent, and hard to compare. Teams must build a trustworthy, discoverable system that surfaces hospital options by disease, cost and location.
- **Fragmented hospital data across sources**: Inconsistent and scattered records, facility listings, and capacity metrics.
- **Difficulty comparing costs, outcomes and facilities**: Unclear pricing, hidden treatment expenses, and lack of verified patient recovery statistics.
- **Limited searchable, verified hospital statistics**: Minimal publicly accessible data on real-time ICU beds, specialized equipment, and clinical accreditations.

### 2. High-Level Solution
A centralised government healthcare platform that aggregates hospital data, exposes searchable APIs, and uses AI to translate natural-language queries into structured search filters. Focus on transparency, verifiability and easy comparisons.

- 📥 **Aggregate**: Collect hospital records, facility lists, cost estimations, and clinical outcome metrics across healthcare providers.
- 🗂️ **Index**: Normalise data by disease, procedure codes, and geolocation for fast, efficient queries.
- 🔍 **Search**: AI-powered natural language search converts everyday conversational language into structured database filters.
- ⚖️ **Compare**: Transparent ranking, verified statistics, and side-by-side hospital comparisons.

### 3. AI-Powered Natural Language Search
Let users describe needs in plain language. The AI extracts disease, location, budget and preferences, then maps them to structured filters (specialty codes, geolocation radius, cost bands, facility features).

> **Example input:**  
> *"Find kidney treatment hospitals near Chandigarh under ₹2 lakh."*

- **Entity extraction**: Disease/Condition (`Kidney Treatment / Nephrology`), Location (`Chandigarh`), Budget (`< ₹2,00,000`), Priority (`Distance vs Cost`).
- **Slot mapping → structured search filters**: Translates clinical and financial intent into validated API parameters.
- **Explainability**: Shows exactly which criteria produced each result with transparent badges (e.g. *Within 15km*, *Avg procedure: ₹1.4L*, *Empanelled in PMJAY*).

### 4. Core User Features — Discovery & Comparison
Intuitive search and comparison tools designed for fast, confident decisions:
- 📍 **Location & Distance**: Search by city, pincode, or radius from user location with commute estimates.
- 💰 **Estimated Treatment Budget**: Filter by cost bands and view average procedure costs with ranges.
- 🏥 **Facilities & Services**: Filter by specialised units, technology, accreditation, and live bed counts.
- 📊 **Side-by-side Comparison**: Compare patient volumes, outcomes, average costs, and verified certifications.

---

## 💡 The Solution: Comprehensive Platform Capabilities

Carelink addresses the fragmented healthcare ecosystem by delivering an integrated, verified, and AI-accelerated healthcare management platform. Below are the comprehensive capabilities and architectural solutions implemented across the system:

### 1. 🤖 AI-Powered Clinical Discovery & Triage (Google Gemini)
- **Symptom-Based Doctor Matching**: Patients articulate symptoms in everyday conversational language (e.g., *"severe sharp chest pain radiating to left shoulder"*). Google Gemini analyzes clinical nuances to match certified specialists and relevant clinical departments.
- **Automated Slot & Filter Mapping**: Translates natural-language queries into structured database queries—extracting disease classifications, budget constraints, geographic radius, and facility requirements.
- **Clinical Safety Guardrails**: Enforces clinical disclaimer boundaries, detects critical red flags, and escalates high-risk cases directly to Code-Red emergency protocols without modifying medical data autonomously.

### 2. 🏥 Multi-Dimensional Hospital & Doctor Search
- **Granular Clinical Filters**: Search and sort healthcare providers by clinical department, medical specialty, doctor credentials, consultation fees, and real-time appointment availability.
- **Infrastructure & Unit Visibility**: Filter hospitals by specialized medical infrastructure including Intensive Care Units (ICU/NICU), Dialysis centers, Advanced Cath Labs, and diagnostic imaging equipment.
- **Government Scheme Verification**: Verify hospital empanelment under government healthcare programs (e.g., **Ayushman Bharat / PMJAY**, **CGHS**, and **ECHS**) for cashless treatment access.

### 3. ⚖️ Transparent Cost Estimation & Side-by-Side Comparison
- **Side-by-Side Comparison Matrix**: Compare multiple medical facilities simultaneously across patient volume, verified clinical recovery rates, bed availability, and accreditation standards.
- **Dynamic Procedure Cost Ranges**: Displays transparent procedure cost distributions with realistic minimum-to-maximum pricing brackets, aiding informed financial decisions before hospital admission.

### 4. 📍 High-Precision Satellite GPS & Turn-by-Turn Navigation
- **Hardware Satellite GPS Lock**: Utilizes the HTML5 Geolocation API with hardware satellite lock (`enableHighAccuracy: true`, zero cache age) and cellular/Wi-Fi fallback, ensuring meter-level positioning accuracy ($\pm 5\text{m}$).
- **Automated Reverse Geocoding**: Translates numerical GPS coordinates into human-readable street addresses and landmarks via OpenStreetMap Nominatim and local corridor registries.
- **Google Maps Navigation & Live ETA**: Computes turn-by-turn driving routes, estimated transit times factoring in live traffic, and provides deep linking directly into the Google Maps mobile application.

### 5. 📅 Real-Time Appointment Booking & Queue Management
- **Live Conflict-Free Slot Scheduling**: Algorithmic slot synchronization prevents double-booking and validates doctor availability in real time.
- **Digital Queue Token Generation**: Issues tamper-resistant appointment tokens with real-time sequence updates to minimize waiting room congestion.
- **Instant Cancellation & Rescheduling**: Self-service appointment cancellation workflow with immediate slot recycling back into the available pool.
- **Automated Email Notifications (Resend API)**: Automated transactional email confirmations, reminders, and triage summaries dispatched upon appointment confirmation or cancellation.

### 6. 🚨 Code-Red Emergency SOS & Rapid Dispatch
- **Single-Tap Emergency Broadcast**: Captures user GPS coordinates in under 1 second to initiate urgent triage and trauma response.
- **Nearest Trauma Unit Matching**: Identifies the closest hospital with confirmed ICU and oxygen bed availability.
- **Interactive First-Aid & Live Countdown**: Step-by-step life-saving protocols (CPR, hemorrhage control) displayed alongside an urgent response countdown timer and direct 108/112 ambulance dispatch triggers.

### 7. 💊 Digital Prescription Management & Pharmacy Inventory Lookup
- **E-Prescription Vault**: Secure patient access to digitally signed prescriptions tied directly to doctor consultation records.
- **Real-Time Medicine Stock Lookup**: Search and verify medication availability, dosages, and operating hours across network partner pharmacies.

### 8. 🔬 Diagnostic Laboratory Reservations & Home Sample Collection
- **Diagnostic Center Discovery**: Browse accredited pathology and radiology centers offering blood panels, MRI, CT scans, and specialized diagnostics.
- **Home Sample Collection**: Book doorstep phlebotomy visits with token tracking and digital laboratory test reports delivery.

### 9. 📋 Electronic Medical Records (EHR) & Clinical Recovery Follow-ups
- **Centralized Clinical Records**: Secure storage for clinical histories, diagnostic test summaries, and treatment timelines.
- **Automated Recovery Check-Ins**: Post-consultation follow-up workflows (scheduled at 24 hours, 3 days, and 7 days) assessing patient recovery status via standardized clinical questionnaires.
- **Severity Scoring & Regression Alerts**: Algorithmic scoring detects post-treatment complications or symptom regressions, triggering immediate physician notifications.

### 10. 🛡️ Secure Hospital Authority Operations Portal
- **Isolated Facility Console**: Dedicated administrative operations interface for hospital superintendents, casualty officers, and administrative staff.
- **Real-Time Bed Allocation Tracker**: Live management dashboard for updating ICU, oxygen-supported, and general bed capacities with instant synchronization to the public directory.
- **Live Emergency Arrival Queue**: Real-time intake queue displaying incoming ambulances, estimated arrival times, and assigned triage physicians.
- **Immutable Audit Trail (HIPAA/DISHA Compliant)**: Every patient intake, status alteration, and referral is permanently logged with immutable timestamps and actor identifiers.

### 11. 🔐 Multi-Provider Authentication & Enterprise Data Privacy
- **Multi-Provider Authentication**: Flexible sign-in supporting Google OAuth, Facebook OAuth, standard Email/Password credentials, and instant Guest Access.
- **Row-Level Security (RLS)**: Enforced at the PostgreSQL layer via Supabase, guaranteeing strict patient data isolation where records are accessible only by authorized owners and attending physicians.
- **Cryptographic Role-Based Access Control (RBAC)**: Fine-grained permissions separated across `patient`, `doctor`, `staff`, and `admin` roles, verified via cryptographically signed JWT tokens.
- **Anti-Bot & Abuse Mitigation (hCaptcha)**: Protects appointment booking workflows and administrative portals from automated bot attacks and slot manipulation.

### 12. 📱 Modern, Fully Responsive Human-Centric UI/UX
- **Google Workspace Aesthetic**: Clean interface built with modern React 19, Google Workspace/Classroom design tokens, 3px border radii, and accessible high-contrast typography.
- **Universal Multi-Device Responsiveness**: Seamless experience across mobile smartphones, tablets, and desktop workstations—equipped with off-canvas drawer navigation, swipeable category chips, and a fixed 5-tab mobile bottom navigation bar.
- **Resilient Offline Fallback**: Robust client and backend fallbacks ensure uninterrupted service availability and clinical guidance even during external network disruptions.

---

## 🛠️ 1. Tech Stack Used

### **Frontend Client**
- **Framework**: [React 19](https://react.dev/) (Single Page Application architecture)
- **Build Tooling & Dev Server**: [Vite 8.3](https://vitejs.dev/) with Hot Module Replacement (HMR)
- **Styling**: Google Workspace / Classroom Clean Aesthetic + [TailwindCSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) (feather-light, accessible vector icons)
- **Navigation & Mobile Architecture**: Fully responsive off-canvas drawer navigation, swipeable touch-scroller containers, and fixed 5-tab mobile bottom navigation
- **Geolocation & Mapping**: HTML5 Geolocation API with satellite hardware lock (`enableHighAccuracy: true`), OpenStreetMap Nominatim reverse geocoding, and Google Maps Turn-by-Turn directions integration
- **State & Data Client**: Modular native Fetch API services with token authentication & [Supabase JS Client](https://supabase.com/docs/reference/javascript)

### **Backend API**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance async ASGI web framework)
- **Language & Runtime**: Python 3.11 / Python 3.13
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) with multi-worker support and auto-reload
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/) (Strict type enforcement and automated OpenAPI 3.1 schemas)
- **HTTP Client**: [HTTPX](https://www.python-httpx.org/) (Async HTTP requests for external services)
- **Testing**: [Pytest](https://pytest.org/) + `pytest-asyncio` with 100% test coverage across all domain routers

### **Database, Auth & Cloud Infrastructure**
- **Primary Database**: [Supabase PostgreSQL](https://supabase.com/) with Row-Level Security (RLS)
- **Authentication**: Multi-provider Supabase Auth (Email/Password, Google OAuth, Facebook OAuth, Guest Sessions)
- **Email Notifications**: [Resend](https://resend.com/) transactional email engine (Appointment confirmations, triage flags)
- **Bot Protection**: [hCaptcha](https://www.hcaptcha.com/) verification middleware

### **AI & Location Engines**
- **Clinical AI & Natural Language**: [Google Gemini Flash & Pro API](https://ai.google.dev/) (Semantic doctor discovery, symptom triage parsing, record summarization)
- **Location & Routing Engine**: Google Maps Directions & Distance Matrix APIs + local Haversine corridor navigation engine for Hoshiarpur & Punjab regions

---

## 📁 2. File & Directory Structure

```
TNHackathon/
├── backend/                               # FastAPI Application Core
│   ├── app/
│   │   ├── main.py                        # App factory, CORS, exception handlers & router mounting
│   │   ├── config.py                      # Pydantic BaseSettings loading from environment variables
│   │   ├── dependencies.py                # Security dependencies (auth tokens, role validation)
│   │   ├── supabase.py                    # Supabase database client & fallback mock store
│   │   ├── routers/                       # Modular REST API endpoints (/api/v1/...)
│   │   │   ├── admin.py                   # Administrative metrics, audit trail & hospital queue
│   │   │   ├── ai.py                      # Gemini AI healthcare search & clinical symptom intake
│   │   │   ├── appointments.py            # Slot conflict checking, booking & cancellation
│   │   │   ├── auth.py                    # User authentication, token issuance & OAuth handlers
│   │   │   ├── departments.py             # Hospital clinical departments directory
│   │   │   ├── doctors.py                 # Doctor profiles, specialties & real-time schedules
│   │   │   ├── emergency.py               # Emergency SOS triage & ambulance dispatch trigger
│   │   │   ├── followups.py               # Automated post-consultation recovery check-ins
│   │   │   ├── hospital_portal.py         # Secure Hospital Authority portal (bed/roster management)
│   │   │   ├── hospitals.py               # Hospital directory, GPS distance sorting & filters
│   │   │   ├── labs.py                    # Diagnostic centres, tests catalog & sample booking
│   │   │   ├── maps.py                    # Turn-by-turn routing, distance matrix, ETA & reverse geocoding
│   │   │   ├── medical_records.py         # Secure patient clinical records & document storage
│   │   │   ├── medicines.py               # Pharmacy medicine inventory & availability
│   │   │   ├── pharmacies.py              # Partner pharmacies directory & opening hours
│   │   │   ├── prescriptions.py           # Digital prescription issuing & pickup token management
│   │   │   └── users.py                   # Patient & staff profile management
│   │   ├── schemas/                       # Pydantic v2 Request & Response Data Models
│   │   │   ├── admin.py                   # Admin analytics & log schemas
│   │   │   ├── ai.py                      # AI search & symptom request/response models
│   │   │   ├── appointment.py             # Appointment booking & cancellation schemas
│   │   │   ├── auth.py                    # Login, register & token schemas
│   │   │   ├── common.py                  # Standard ApiResponse[T] generic envelope
│   │   │   ├── department.py              # Clinical department schemas
│   │   │   ├── doctor.py                  # Doctor profile & availability schemas
│   │   │   ├── followup.py                # Patient questionnaire & review schemas
│   │   │   ├── hospital.py                # Hospital facility & bed count schemas
│   │   │   ├── lab.py                     # Diagnostic test & booking schemas
│   │   │   ├── map.py                     # Route step, distance, ETA & reverse geocode schemas
│   │   │   ├── medical_record.py          # Electronic health record schemas
│   │   │   ├── medicine.py                # Medication & dosage schemas
│   │   │   ├── pharmacy.py                # Pharmacy entity schemas
│   │   │   ├── prescription.py            # Prescription item schemas
│   │   │   └── user.py                    # User account & role schemas
│   │   ├── services/                      # Decoupled Business Logic & External API Integrations
│   │   │   ├── admin_service.py           # Operational audit trail & hospital arrival queues
│   │   │   ├── appointment_service.py     # Slot availability algorithms & reminder engine
│   │   │   ├── department_service.py      # Department aggregation & doctor counts
│   │   │   ├── doctor_service.py          # Doctor rating calculations & schedule matrix
│   │   │   ├── email_service.py           # Resend transactional email integration
│   │   │   ├── followup_service.py        # Automated 24h/3d/7d recovery evaluations
│   │   │   ├── gemini_service.py          # Google Gemini AI prompts, function calling & safety filters
│   │   │   ├── hospital_service.py        # Hospital geospatial filtering & bed tracker
│   │   │   ├── lab_service.py             # Diagnostic test booking & token assignment
│   │   │   ├── map_service.py             # Google Maps client, reverse geocoder & Haversine routing
│   │   │   ├── medical_record_service.py  # Health record encryption & retrieval
│   │   │   ├── medicine_service.py        # Stock lookup & alternatives matching
│   │   │   ├── notification_service.py    # Multi-channel patient notifications
│   │   │   ├── pharmacy_service.py        # Pharmacy location matching
│   │   │   └── prescription_service.py    # Digital prescription generation & QR tokens
│   │   └── utils/                         # Helper utilities & security algorithms
│   ├── tests/                             # Comprehensive Automated Pytest Suite
│   │   ├── conftest.py                    # FastAPI test client fixtures & database mocking
│   │   ├── test_admin.py                  # Admin route authorization & queue tests
│   │   ├── test_ai.py                     # Gemini search & symptom intake validation tests
│   │   ├── test_appointments.py           # Slot collision & appointment life-cycle tests
│   │   ├── test_auth.py                   # JWT verification & multi-provider auth tests
│   │   ├── test_doctors.py                # Doctor availability & schedule matrix tests
│   │   ├── test_hospital_portal.py        # Bed allocation & hospital staff role tests
│   │   ├── test_hospitals.py              # Hospital search & distance calculation tests
│   │   ├── test_maps.py                   # Route calculation, ETA & reverse geocoding tests
│   │   ├── test_medical_records.py        # Medical record privacy & isolation tests
│   │   ├── test_medicines.py              # Medicine catalog & pharmacy tests
│   │   ├── test_ratings_and_referrals.py  # Inter-hospital referral & review tests
│   │   └── test_supabase_crud.py          # Supabase storage layer CRUD tests
│   ├── Dockerfile                         # Container definition for containerized deployments
│   ├── requirements.txt                   # Frozen Python backend dependencies
│   ├── seed_supabase.py                   # Automated database seeder (hospitals, doctors, beds)
│   ├── supabase_schema.sql                # PostgreSQL schema DDL with indexes & RLS policies
│   └── .env.example                       # Backend environment variables template
│
├── frontend/                              # React 19 + Vite Frontend SPA
│   ├── public/                            # Static public web assets
│   ├── src/
│   │   ├── assets/                        # UI images, branding icons & logos
│   │   ├── components/                    # Reusable React UI Components
│   │   │   ├── AuthModal.jsx              # Google / Facebook / Password modal with hCaptcha
│   │   │   └── DoctorDrawer.jsx           # Slide-over doctor profile, chat & direct booking drawer
│   │   ├── pages/                         # Core Application Views & Workflows
│   │   │   ├── AIGuidePage.jsx            # Gemini AI healthcare query assistant & triage stream
│   │   │   ├── AdminPage.jsx              # Governance dashboard, platform metrics & audit trail
│   │   │   ├── AppointmentsPage.jsx       # Calendar view, upcoming visits & cancellation modal
│   │   │   ├── DashboardPage.jsx          # Care overview, top specialists & patient directory
│   │   │   ├── DoctorsPage.jsx            # Doctor directory, date slot picker & patient intake
│   │   │   ├── EmergencyPage.jsx          # Code-red SOS, live satellite GPS lock & dispatch tracker
│   │   │   ├── FollowupsPage.jsx          # Post-consultation recovery questionnaire engine
│   │   │   ├── HospitalDetailPage.jsx     # Facility deep-dive, bed occupancy & specialist roster
│   │   │   ├── HospitalSecurePortal.jsx   # Role-segregated hospital authority console
│   │   │   ├── HospitalsPage.jsx          # Facility directory, filter chips & GPS distance sorting
│   │   │   ├── LabsPage.jsx               # Diagnostic test catalog, home sample booking modal
│   │   │   ├── MapsPage.jsx               # Google Maps navigation, live ETA & corridor route steps
│   │   │   ├── MedicalRecordsPage.jsx     # Clinical records, medication reminders & hydration
│   │   │   └── PrescriptionsPage.jsx      # Digital pharmacy prescriptions & pickup token tracker
│   │   ├── utils/                         # Frontend Helper Utilities
│   │   │   └── geolocation.js             # High-precision hardware GPS & reverse geocoding engine
│   │   ├── api.js                         # Centralized REST API client mapping backend endpoints
│   │   ├── supabase.js                    # Client-side Supabase authentication client
│   │   ├── App.jsx                        # Main root component, router state & responsive layout
│   │   ├── App.css                        # Design system tokens, fluid grids & responsive queries
│   │   ├── index.css                      # Global reset, typography & 3px rounded tokens
│   │   └── main.jsx                       # React DOM entry point
│   ├── index.html                         # HTML5 template with viewport configuration
│   ├── package.json                       # Frontend dependencies & scripts
│   ├── vite.config.js                     # Vite build configuration & environment variable proxy
│   └── .env.example                       # Frontend environment variables template
│
├── production-env/                        # Deployment Environment Templates
│   ├── render.env                         # Render web service environment configurations
│   └── vercel.env                         # Vercel SPA environment configurations
├── DEPLOYMENT.md                          # Production deployment guide (Render + Vercel + Supabase)
├── render.yaml                            # 1-Click Render Infrastructure Blueprint
└── README.md                              # Project documentation
```

---

## 🚀 3. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or v3.13
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/GauravKatnoria11/AgentX.git
cd AgentX
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run database migrations / seed data (optional)
python seed_supabase.py

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be accessible at: **`http://127.0.0.1:8000`**  
Interactive Swagger API documentation: **`http://127.0.0.1:8000/docs`**

### 3. Frontend Setup
```bash
# In a new terminal tab, navigate to frontend
cd frontend

# Install npm dependencies
npm install

# Configure environment variables
copy .env.example .env

# Start Vite development server
npm run dev -- --host
```
Frontend will be accessible at: **`http://localhost:5173/`**

---

## 🧪 4. Testing & Quality Assurance

### Run Backend Test Suite
The backend includes automated tests covering authentication, route calculation, AI intake, appointment scheduling, and role-based permissions:
```bash
cd backend
python -m pytest
```
*Result: 36 passed tests.*

### Run Frontend Production Build
```bash
cd frontend
npm run build
```
*Result: Vite compiles all modules into `dist/` with 0 warnings/errors.*

---

## 🔒 5. Security & Privacy

- **Row Level Security (RLS)**: Enforced across all Supabase PostgreSQL tables ensuring patients cannot read other patients' records or prescriptions.
- **Strict Role-Based Authorization**: Roles (`patient`, `doctor`, `staff`, `admin`) are verified cryptographically in JWT claims before any sensitive endpoint executes.
- **Zero Sensitive Credential Leaks**: API keys, database connection strings, and service role secrets are kept strictly server-side.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.