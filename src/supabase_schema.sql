-- SQL Schema for EduPay Admin Portal (Supabase)
-- Target: PostgreSQL

-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Admin', 'Bendahara')) DEFAULT 'Bendahara',
    status TEXT CHECK (status IN ('Active', 'Locked')) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENTS TABLE
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('L', 'P')),
    residence_status TEXT CHECK (residence_status IN ('Mondok', 'Ansor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ARREARS TABLE (Tunggakan)
CREATE TABLE arrears (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'SPP', 'Uang Makan'
    month TEXT NOT NULL, -- e.g., 'Januari 2024'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('Lunas', 'Belum Lunas', 'Kritis')) DEFAULT 'Belum Lunas',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE (Audit Trail / Riwayat Finansial)
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_name TEXT, -- Snapshot name in case student is deleted
    type TEXT CHECK (type IN ('Penambahan', 'Pelunasan', 'Penyesuaian', 'Penghapusan')),
    amount NUMERIC(15, 2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT,
    parent_name TEXT,
    whatsapp TEXT,
    status TEXT CHECK (status IN ('Berhasil', 'Gagal', 'Pending')),
    type TEXT DEFAULT 'WhatsApp',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrears ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Students, Arrears, Transactions, Notifications: Viewable and modifiable by all authenticated staff
CREATE POLICY "Authenticated users can manage students" 
ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage arrears" 
ON arrears FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view/add transactions" 
ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add transactions" 
ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can manage notifications" 
ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_arrears_updated_at BEFORE UPDATE ON arrears FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- VIEW for Dashboard Stats (Optional but helpful)
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT SUM(amount) FROM arrears WHERE status != 'Lunas') as total_unpaid_amount,
    (SELECT COUNT(*) FROM arrears WHERE status = 'Kritis') as critical_arrears_count;
