# AI Healthcare & Hospital Platform — Backend API

Production-ready, modular FastAPI backend built for an AI-powered healthcare discovery, management, and hospital operations platform.

## Features
- **Patient Healthcare Journey**: Hospital discovery, department filtering, doctor availability, appointment scheduling, routing & ETA, diagnostic lab bookings, pharmacy & prescription lookup, medical record storage, and automated recovery follow-up plans.
- **AI-Powered Services (Gemini)**:
  - Natural Language Healthcare Search (`/api/v1/ai/search`)
  - Structured Clinical Symptom Intake (`/api/v1/ai/symptoms`)
  - Medical Record Summaries (`/api/v1/ai/summarize`)
  - Interactive Healthcare FAQ Assistant (`/api/v1/ai/chat`)
  - *Strict clinical safety*: Zero autonomous diagnoses, zero direct DB writes, zero medication alterations.
- **Location & Route Services (Google Maps)**: Real-time turn-by-turn routing, distance matrix, and ETA with suggested departure times (`/api/v1/maps/*`).
- **Hospital & Administrative Portal**:
  - Isolated Admin API (`/api/v1/admin/*`) with server-side role enforcement (`require_role(["admin", "staff"])`).
  - No administrative information or metrics leaked to the patient-facing views.
  - Live patient queues, resource management, and audit log inspection.
- **Authentication & Security**:
  - Supabase Auth + JWT validation.
  - Multi-provider authentication: Email, Google OAuth, Facebook OAuth, and hCaptcha bot protection.
  - Role-based authorization (`patient`, `doctor`, `staff`, `admin`).
  - Strict Patient Data Isolation (Patient A cannot access Patient B's records or prescriptions).
  - Hospital operational segregation (Hospital Staff cannot modify other facilities' private operations).
  - Standardized JSON responses and clean error handling without exposing stack traces.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                     # App entry point, CORS, error handlers, router registration
│   ├── config.py                   # Pydantic Settings configuration from .env
│   ├── supabase.py                 # Centralized Supabase client & resilient storage engine
│   ├── dependencies.py             # Auth & role verification (get_current_user, require_role)
│   ├── routers/                    # Clean REST routers (/api/v1/...)
│   │   ├── auth.py                 # Sign up, sign in, OAuth, hCaptcha verification
│   │   ├── users.py                # Profile & notification management
│   │   ├── hospitals.py            # Hospital directory, distance sorting, filters
│   │   ├── departments.py          # Hospital departments & heads
│   │   ├── doctors.py              # Doctor profiles, schedule availability
│   │   ├── appointments.py         # Slot conflict checks, booking, cancellation
│   │   ├── labs.py                 # Diagnostic centers & lab tests
│   │   ├── pharmacies.py           # Pharmacy locations & hours
│   │   ├── medicines.py            # Medicine catalog & availability
│   │   ├── prescriptions.py        # Upload and view prescriptions
│   │   ├── medical_records.py      # Secure patient medical records
│   │   ├── followups.py            # 24h/3d/7d check-ins & alert triggers
│   │   ├── maps.py                 # Google Maps route, distance, and ETA
│   │   ├── ai.py                   # Gemini search, symptom intake, record summary
│   │   └── admin.py                # Protected admin analytics, queues, and audit logs
│   ├── services/                   # Business logic layer
│   ├── schemas/                    # Pydantic request & response validation schemas
│   └── utils/                      # Security, permissions, and input validators
├── tests/                          # Comprehensive pytest test suite
├── supabase_schema.sql             # PostgreSQL schema with tables, indexes, and RLS
├── .env.example                    # Environment variable template
├── requirements.txt                # Python package dependencies
└── Dockerfile                      # Containerization setup
```

---

## Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Supabase Anon Public Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (kept strictly on server) |
| `HCAPTCHA_SECRET_KEY` | hCaptcha secret verification key |
| `HCAPTCHA_SITE_KEY` | hCaptcha public site key for frontend widget |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key (also accepts alias `GOOGLE_MAP_API_KEY`) |
| `APP_ENV` | `development`, `staging`, or `production` |
| `FRONTEND_URL` | Frontend origin for CORS policy (e.g. `http://localhost:5173`) |
| `PORT` | Server listening port (default `8000`) |
| `JWT_SECRET` | Secret key for signing and validating JWT tokens |

---

## Supabase Database Setup

Run the SQL DDL statements in `supabase_schema.sql` within your Supabase SQL Editor:
- Creates all 15 core tables (`profiles`, `hospitals`, `departments`, `doctors`, `doctor_schedules`, `appointments`, `labs`, `pharmacies`, `medicines`, `prescriptions`, `medical_records`, `followups`, `followup_responses`, `notifications`, `audit_logs`).
- Sets up primary UUID keys, foreign key cascades, performance indexes, and Row-Level Security (RLS) policies.

---

## How to Run Locally

1. **Activate Python Virtual Environment**:
   ```powershell
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start FastAPI Application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access Endpoints**:
   - Health check: `http://localhost:8000/health`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

## How to Run with Docker

1. **Build Container Image**:
   ```bash
   docker build -t tnhackathon-healthcare-backend .
   ```

2. **Run Container**:
   ```bash
   docker run -p 8000:8000 --env-file .env tnhackathon-healthcare-backend
   ```

---

## Testing

Run the automated test suite with pytest:
```bash
python -m pytest tests/ -v
```
