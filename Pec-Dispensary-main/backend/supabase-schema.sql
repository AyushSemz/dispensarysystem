-- =============================================
-- SUPABASE SQL SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'PHARMACIST');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- DOCTOR PROFILES TABLE
-- =============================================
CREATE TABLE doctor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    specialization TEXT,
    registration_no TEXT,
    available_slots JSONB,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PATIENT PROFILES TABLE
-- =============================================
CREATE TABLE patient_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT,
    address TEXT,
    emergency_contact JSONB,
    medical_history JSONB,
    consent_data_use BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    appointment_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 15,
    status appointment_status DEFAULT 'SCHEDULED',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VISITS TABLE
-- =============================================
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    visit_time TIMESTAMPTZ DEFAULT NOW(),
    diagnosis_code TEXT,
    diagnosis_text TEXT,
    prescription JSONB,
    follow_up_reco TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REMARKS TABLE
-- =============================================
CREATE TABLE remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    raw_text TEXT NOT NULL,
    symptom_tags TEXT[],
    processed BOOLEAN DEFAULT FALSE,
    nlp_result_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEEDBACKS TABLE
-- =============================================
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES visits(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER,
    comments TEXT,
    processed BOOLEAN DEFAULT FALSE,
    nlp_result_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NLP RESULTS TABLE
-- =============================================
CREATE TABLE nlp_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    detected_symptoms TEXT[],
    detected_diseases TEXT[],
    entities JSONB,
    confidence JSONB,
    language TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for nlp_results in remarks and feedbacks
ALTER TABLE remarks ADD CONSTRAINT fk_remarks_nlp_result 
    FOREIGN KEY (nlp_result_id) REFERENCES nlp_results(id);

ALTER TABLE feedbacks ADD CONSTRAINT fk_feedbacks_nlp_result 
    FOREIGN KEY (nlp_result_id) REFERENCES nlp_results(id);

-- =============================================
-- SENTIMENT ANALYSIS TABLE
-- =============================================
CREATE TABLE sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    overall_sentiment TEXT NOT NULL, -- positive/neutral/negative
    sentiment_score NUMERIC(3,2), -- confidence score 0-1
    detected_symptoms TEXT[],
    symptom_probabilities JSONB, -- {symptom_name: probability}
    aspects JSONB, -- {aspect_name: sentiment}
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feedback_id)
);

-- =============================================
-- OUTBREAK ALERTS TABLE
-- =============================================
CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

CREATE TABLE outbreak_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- z-score, ewma, consecutive-day
    severity alert_severity DEFAULT 'MEDIUM',
    status alert_status DEFAULT 'ACTIVE',
    threshold_value NUMERIC,
    current_value NUMERIC,
    detection_method TEXT,
    affected_period_start TIMESTAMPTZ,
    affected_period_end TIMESTAMPTZ,
    patient_count INTEGER,
    metadata JSONB, -- additional details like z-score value, baseline stats
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    notes TEXT
);

-- =============================================
-- SYMPTOM STATISTICS TABLE (for baseline tracking)
-- =============================================
CREATE TABLE symptom_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom TEXT NOT NULL,
    date DATE NOT NULL,
    count INTEGER DEFAULT 0,
    mean_value NUMERIC,
    std_dev NUMERIC,
    ewma_value NUMERIC,
    baseline_mean NUMERIC,
    baseline_std_dev NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symptom, date)
);

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_doctor ON visits(doctor_id);
CREATE INDEX idx_remarks_visit ON remarks(visit_id);
CREATE INDEX idx_feedbacks_visit ON feedbacks(visit_id);
CREATE INDEX idx_sentiment_feedback ON sentiment_analysis(feedback_id);
CREATE INDEX idx_alerts_symptom ON outbreak_alerts(symptom);
CREATE INDEX idx_alerts_status ON outbreak_alerts(status);
CREATE INDEX idx_alerts_created ON outbreak_alerts(created_at);
CREATE INDEX idx_symptom_stats_date ON symptom_statistics(symptom, date);

-- =============================================
-- TRIGGER for updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreak_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_statistics ENABLE ROW LEVEL SECURITY;

-- For now, allow service_role to access everything (backend will use service_role key)
-- You can add more granular policies later based on your needs

-- Create policies for authenticated users (if you want frontend to access directly)
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Doctors can view all appointments assigned to them
CREATE POLICY "Doctors can view their appointments" ON appointments
    FOR SELECT
    USING (doctor_id::text = auth.uid()::text);

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT
    USING (patient_id::text = auth.uid()::text);

-- =============================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- =============================================
-- You can add sample data here for testing
