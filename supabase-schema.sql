-- ==============================================================================
-- SISTEM ABSENSI & REIMBURSEMENT AGENSI BOYOR
-- FULL SUPABASE DATABASE SCHEMA, RLS POLICIES, STORAGE BUCKET & SEED DATA
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('DIRUT', 'ADMIN_HR', 'MANAGER', 'FINANCE', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('BELUM_CHECK_IN', 'SEDANG_BEKERJA', 'SELESAI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_category AS ENUM (
        'Transportasi',
        'Makan',
        'Akomodasi',
        'Perlengkapan Kantor',
        'Komunikasi',
        'Lainnya'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE claim_status AS ENUM (
        'Draft',
        'Menunggu Persetujuan Manager',
        'Ditolak Manager',
        'Disetujui Manager',
        'Menunggu Verifikasi Finance',
        'Perlu Revisi Finance',
        'Siap Dibayar',
        'Dibayar',
        'Dibatalkan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES / EMPLOYEES TABLE (Terintegrasi dengan auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100) DEFAULT 'Umum',
    job_title VARCHAR(100),
    role user_role DEFAULT 'EMPLOYEE' NOT NULL,
    account_status account_status DEFAULT 'PENDING' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    phone VARCHAR(30),
    bank_name VARCHAR(50),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. COMPANY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL DEFAULT 'Boyor Digital Agency',
    office_name VARCHAR(150) NOT NULL DEFAULT 'Kantor Pusat Jakarta',
    office_address TEXT NOT NULL DEFAULT 'Jl. Sudirman Kav. 28, Setiabudi, Jakarta Selatan',
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '18:00:00',
    late_tolerance_minutes INT NOT NULL DEFAULT 15,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_at TIME,
    check_out_at TIME,
    status attendance_status DEFAULT 'BELUM_CHECK_IN' NOT NULL,
    total_minutes INT DEFAULT 0,
    is_late BOOLEAN DEFAULT FALSE NOT NULL,
    distance_meters NUMERIC(10,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_employee_daily_attendance UNIQUE (employee_id, date)
);

-- 6. REIMBURSEMENT CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.reimbursement_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(30) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category claim_category NOT NULL,
    transaction_date DATE NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    attachment_name TEXT,
    attachment_url TEXT,
    status claim_status DEFAULT 'Menunggu Persetujuan Manager' NOT NULL,
    manager_note TEXT,
    finance_note TEXT,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50), -- e.g. 'Transfer Bank', 'Tunai'
    disbursed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. CLAIM ACTIVITY LOGS TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS public.claim_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES public.reimbursement_claims(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role user_role NOT NULL,
    action VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_claims_employee ON public.reimbursement_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.reimbursement_claims(status);
CREATE INDEX IF NOT EXISTS idx_claim_activities_claim ON public.claim_activities(claim_id);

-- 9. TRIGGER: AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER trg_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance_records;
CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_claims_updated_at ON public.reimbursement_claims;
CREATE TRIGGER trg_claims_updated_at
    BEFORE UPDATE ON public.reimbursement_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. TRIGGER: AUTO CREATE PROFILE WHEN AUTH USER REGISTERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(20);
    cnt INT;
BEGIN
    -- Buat kode karyawan otomatis format BYR-XXX
    SELECT COUNT(*) + 1 INTO cnt FROM public.profiles;
    new_code := 'BYR-' || LPAD(cnt::TEXT, 3, '0');

    INSERT INTO public.profiles (
        id,
        employee_code,
        full_name,
        email,
        department,
        job_title,
        role,
        account_status,
        is_active,
        phone
    ) VALUES (
        NEW.id,
        new_code,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pegawai Baru'),
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'department', ''), 'Umum'),
        NULLIF(NEW.raw_user_meta_data->>'job_title', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE'),
        -- Jika Dirut langsung ACTIVE, selain itu PENDING menunggu persetujuan Dirut
        CASE WHEN (NEW.raw_user_meta_data->>'role') = 'DIRUT' THEN 'ACTIVE'::account_status ELSE 'PENDING'::account_status END,
        TRUE,
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_activities ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user login adalah DIRUT/ADMIN
CREATE OR REPLACE FUNCTION public.is_dirut_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('DIRUT', 'ADMIN_HR')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public can view company settings" ON public.company_settings;
CREATE POLICY "Public can view company settings"
    ON public.company_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Dirut can update company settings" ON public.company_settings;
CREATE POLICY "Dirut can update company settings"
    ON public.company_settings FOR ALL
    TO authenticated
    USING (public.is_dirut_or_admin());

DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Dirut can update any profile" ON public.profiles;
CREATE POLICY "Dirut can update any profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_dirut_or_admin());

-- ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Employees can view own attendance" ON public.attendance_records;
CREATE POLICY "Employees can view own attendance"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (auth.uid() = employee_id OR public.is_dirut_or_admin());

DROP POLICY IF EXISTS "Employees can insert own attendance" ON public.attendance_records;
CREATE POLICY "Employees can insert own attendance"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Employees can update own attendance today" ON public.attendance_records;
CREATE POLICY "Employees can update own attendance today"
    ON public.attendance_records FOR UPDATE
    TO authenticated
    USING (auth.uid() = employee_id OR public.is_dirut_or_admin());

-- REIMBURSEMENT CLAIMS POLICIES
DROP POLICY IF EXISTS "Employees view own claims, Dirut views all" ON public.reimbursement_claims;
CREATE POLICY "Employees view own claims, Dirut views all"
    ON public.reimbursement_claims FOR SELECT
    TO authenticated
    USING (auth.uid() = employee_id OR public.is_dirut_or_admin());

DROP POLICY IF EXISTS "Employees can create claim" ON public.reimbursement_claims;
CREATE POLICY "Employees can create claim"
    ON public.reimbursement_claims FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Dirut can update claims" ON public.reimbursement_claims;
CREATE POLICY "Dirut can update claims"
    ON public.reimbursement_claims FOR UPDATE
    TO authenticated
    USING (auth.uid() = employee_id OR public.is_dirut_or_admin());

-- CLAIM ACTIVITIES POLICIES
DROP POLICY IF EXISTS "Anyone involved can view activities" ON public.claim_activities;
CREATE POLICY "Anyone involved can view activities"
    ON public.claim_activities FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert activities" ON public.claim_activities;
CREATE POLICY "Authenticated users can insert activities"
    ON public.claim_activities FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = actor_id OR public.is_dirut_or_admin());

-- 12. SUPABASE STORAGE BUCKET UNTUK BUKTI NOTA / STRUK
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view receipts"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts');

-- 13. SEED DATA AWAL UNTUK PENGATURAN KANTOR
INSERT INTO public.company_settings (id, company_name, office_name, office_address, work_start_time, work_end_time, late_tolerance_minutes)
VALUES (
    1,
    'Boyor Digital Agency',
    'Kantor Pusat Jakarta',
    'Jl. Sudirman Kav. 28, RT.14/RW.1, Karet Semanggi, Setiabudi, Jakarta Selatan 12920',
    '09:00:00',
    '18:00:00',
    15
)
ON CONFLICT (id) DO NOTHING;
