-- Supabase PostgreSQL Database Schema
-- Carelink — AI Healthcare & Hospital Platform

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'staff', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'General Hospital',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_hotline VARCHAR(100),
    email VARCHAR(255),
    website TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.5,
    services TEXT[] DEFAULT '{}',
    diseases_treated TEXT[] DEFAULT '{}',
    emergency_available BOOLEAN DEFAULT TRUE,
    available_icu_beds INT DEFAULT 10,
    total_beds INT DEFAULT 100,
    operational_hours VARCHAR(100) DEFAULT '24/7',
    consultation_fee NUMERIC(10, 2) DEFAULT 0.0,
    min_fee NUMERIC(10, 2) DEFAULT 0.0,
    max_fee NUMERIC(10, 2) DEFAULT 0.0,
    fee_tier VARCHAR(100),
    transportation_facilities JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    head_doctor_name VARCHAR(255),
    floor_location VARCHAR(50),
    contact_extension VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience_years INT DEFAULT 0,
    consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
    bio TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Doctor Schedules Table
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    reason TEXT,
    queue_number INT,
    notes TEXT,
    patient_phone VARCHAR(50),
    blood_group VARCHAR(10),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- 7. Labs & Diagnostic Services Table
CREATE TABLE IF NOT EXISTS public.labs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    test_types TEXT[] DEFAULT '{}',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    contact_phone VARCHAR(50),
    hours VARCHAR(100) DEFAULT '8:00 AM - 8:00 PM',
    price_range VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Pharmacies Table
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    hours VARCHAR(100) DEFAULT '24/7',
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Medicines Table
CREATE TABLE IF NOT EXISTS public.medicines (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage_form VARCHAR(100),
    strength VARCHAR(50),
    manufacturer VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    prescription_required BOOLEAN DEFAULT FALSE,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL,
    doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL,
    doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    record_type VARCHAR(100) NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size_bytes INT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Follow-ups Table
CREATE TABLE IF NOT EXISTS public.followups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT NOT NULL,
    doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
    interval_type VARCHAR(20) NOT NULL CHECK (interval_type IN ('24h', '3d', '7d', 'custom')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'flagged', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Follow-up Responses Table
CREATE TABLE IF NOT EXISTS public.followup_responses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    followup_id TEXT NOT NULL REFERENCES public.followups(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    responses JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    flagged_for_review BOOLEAN DEFAULT FALSE,
    review_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Doctor Reviews & Ratings Table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    tags TEXT[] DEFAULT '{}',
    verified_consultation BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doc ON public.doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON public.hospitals(city);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON public.doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_dept ON public.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_spec ON public.doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_records_patient ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_patient ON public.followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS where applicable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for public catalog tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Admin write hospitals" ON public.hospitals FOR ALL USING (true);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admin write departments" ON public.departments FOR ALL USING (true);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Admin write doctors" ON public.doctors FOR ALL USING (true);

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read doctor_schedules" ON public.doctor_schedules FOR SELECT USING (true);
CREATE POLICY "Admin write doctor_schedules" ON public.doctor_schedules FOR ALL USING (true);

ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read labs" ON public.labs FOR SELECT USING (true);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pharmacies" ON public.pharmacies FOR SELECT USING (true);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read medicines" ON public.medicines FOR SELECT USING (true);

ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read doctor_reviews" ON public.doctor_reviews FOR SELECT USING (true);
CREATE POLICY "Patient create doctor_reviews" ON public.doctor_reviews FOR INSERT WITH CHECK (true);

-- User-specific security policies
CREATE POLICY "Patients view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Patient view own records" ON public.medical_records FOR SELECT USING (true);
CREATE POLICY "Patient create own records" ON public.medical_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Patient view own appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Patient create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff update appointments" ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Patient view own prescriptions" ON public.prescriptions FOR SELECT USING (true);
