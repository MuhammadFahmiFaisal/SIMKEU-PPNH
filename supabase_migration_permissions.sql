-- SQL Migration: Fitur Perizinan Santri Terintegrasi Keuangan
-- Jalankan script ini di SQL Editor Supabase Anda untuk menambahkan tabel dan kolom yang diperlukan.

-- 1. Perbarui Constraint Role pada tabel Profiles
-- Menghapus constraint lama jika ada, lalu menambahkan constraint baru yang menyertakan role 'Keamanan'.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Super Admin', 'Bendahara', 'Auditor', 'Keamanan'));

-- 2. Tambahkan Kolom Baru pada tabel Students
-- Menambahkan barcode_id untuk scan QR, dan status_perizinan untuk melacak posisi santri.
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS barcode_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status_perizinan TEXT CHECK (status_perizinan IN ('Di Dalam', 'Di Luar', 'Skorsing')) DEFAULT 'Di Dalam';

-- Berikan nilai default atau generate barcode_id awal berdasarkan ID mereka untuk mencegah null jika diperlukan
-- (Nanti di kode aplikasi kita bisa buat generator barcode NIS otomatis)

-- Buat indeks untuk kolom barcode_id agar query scan super cepat (O(1) lookup)
CREATE INDEX IF NOT EXISTS idx_students_barcode ON public.students(barcode_id);

-- 3. Buat Tabel Permissions (Log Perizinan)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Pulang', 'Keluar Singkat', 'Sakit', 'Lainnya')) NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INT, -- durasi jam untuk izin keluar singkat
    start_date TIMESTAMPTZ DEFAULT NOW(),
    expected_return_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ DEFAULT NULL,
    status TEXT CHECK (status IN ('Aktif', 'Kembali', 'Terlambat', 'Dibatalkan')) DEFAULT 'Aktif',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- ID Petugas Keamanan yang menscan / menginput
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat indeks untuk perizinan aktif agar pengecekan check-in sangat cepat
CREATE INDEX IF NOT EXISTS idx_permissions_student_active ON public.permissions(student_id) WHERE status = 'Aktif';

-- 4. Aktifkan Row Level Security (RLS) pada tabel Permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 5. Buat Kebijakan RLS (Policies)
-- Mengizinkan semua staf yang terautentikasi (Admin, Bendahara, Auditor, Keamanan) untuk melihat dan mengelola data perizinan.
CREATE POLICY "Authenticated users can manage permissions" 
ON public.permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Pasang Trigger untuk Otomatisasi update_at
-- Menggunakan fungsi update_updated_at_column() yang sudah ada di database dari migrasi sebelumnya.
DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at 
BEFORE UPDATE ON public.permissions 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Tambahkan Kolom Baru untuk Kartu Identitas Santri Modern (NISN, Alamat, Tempat & Tanggal Lahir, Foto)
-- Menambahkan kolom nisn, alamat, tempat_lahir, tanggal_lahir, dan photo_url ke tabel students.
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS nisn TEXT,
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS tempat_lahir TEXT,
ADD COLUMN IF NOT EXISTS tanggal_lahir TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;
