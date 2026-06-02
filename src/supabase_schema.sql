-- SQL Schema for EduPay Admin Portal (Supabase)
-- Target: PostgreSQL

-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('Super Admin', 'Bendahara', 'Auditor', 'Keamanan')) DEFAULT 'Bendahara',
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
    dispensation_status BOOLEAN DEFAULT false,
    dispensation_reason TEXT,
    barcode_id TEXT,
    status_perizinan TEXT DEFAULT 'Di Dalam',
    nisn TEXT,
    alamat TEXT,
    tempat_lahir TEXT,
    tanggal_lahir TEXT,
    photo_url TEXT,
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
    type TEXT CHECK (type IN ('Penambahan', 'Pelunasan', 'Penyesuaian', 'Penghapusan', 'Setoran', 'Penerimaan', 'Pengeluaran')),
    amount NUMERIC(15, 2),
    payment_category TEXT,
    description TEXT,
    performed_by TEXT,
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

-- Function to securely get the current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Super Admins can update any profile" 
ON profiles FOR UPDATE TO authenticated USING (get_my_role() = 'Super Admin');

-- Students: Viewable by all authenticated, manageable by Admin/Bendahara/Keamanan(for permissions)
CREATE POLICY "Authenticated users can view students" 
ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Bendahara can manage students" 
ON students FOR ALL TO authenticated 
USING (get_my_role() IN ('Super Admin', 'Bendahara', 'Keamanan')) 
WITH CHECK (get_my_role() IN ('Super Admin', 'Bendahara', 'Keamanan'));

-- Arrears: Admin, Bendahara, Auditor can view. Admin, Bendahara can manage.
CREATE POLICY "Authorized roles can view arrears" 
ON arrears FOR SELECT TO authenticated 
USING (get_my_role() IN ('Super Admin', 'Bendahara', 'Auditor'));

CREATE POLICY "Admin and Bendahara can manage arrears" 
ON arrears FOR ALL TO authenticated 
USING (get_my_role() IN ('Super Admin', 'Bendahara')) 
WITH CHECK (get_my_role() IN ('Super Admin', 'Bendahara'));

-- Transactions: Admin, Bendahara, Auditor can view. Admin, Bendahara can insert. No deletes.
CREATE POLICY "Authorized roles can view transactions" 
ON transactions FOR SELECT TO authenticated 
USING (get_my_role() IN ('Super Admin', 'Bendahara', 'Auditor'));

CREATE POLICY "Admin and Bendahara can insert transactions" 
ON transactions FOR INSERT TO authenticated 
WITH CHECK (get_my_role() IN ('Super Admin', 'Bendahara'));

-- Notifications: Admin, Bendahara can manage
CREATE POLICY "Admin and Bendahara can manage notifications" 
ON notifications FOR ALL TO authenticated 
USING (get_my_role() IN ('Super Admin', 'Bendahara')) 
WITH CHECK (get_my_role() IN ('Super Admin', 'Bendahara'));

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
