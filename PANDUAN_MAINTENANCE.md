# 📘 Panduan Pemeliharaan Jangka Panjang (Long-Term Maintenance Guide)
### Sistem Integrasi Keuangan & Perizinan Santri (SIMKEU-PPNH)
**Pondok Pesantren Nurul Huda Malati**

Dokumen ini dirancang sebagai panduan teknis bagi pengelola IT, administrator, atau developer berikutnya untuk mengelola, mengoptimalkan, dan memelihara sistem portal SIMKEU-PPNH agar tetap cepat, aman, dan tangguh selama bertahun-tahun ke depan.

---

## 🗺️ 1. Arsitektur Ringkas Sistem

Sistem ini dirancang menggunakan arsitektur modern berkecepatan tinggi:
* **Frontend:** React + Vite + TailwindCSS + TypeScript (Kompilasi super ketat dan bebas bug).
* **Backend & Database:** Supabase (PostgreSQL) dengan sinkronisasi real-time.
* **Fitur Utama:** Otomatisasi pembatasan check-out santri berdasarkan data tunggakan keuangan riil dari tabel `arrears`.

---

## 💾 2. Manajemen Kapasitas & Pertumbuhan Data (Supabase)

Supabase tier gratis (*Free Tier*) menyediakan kapasitas database PostgreSQL sebesar **500 MB** dan penyimpanan file (*Storage*) sebesar **1 GB**.

### 📊 Estimasi Daya Tampung Data Teks
Ukuran rata-rata satu baris data transaksi teks (perizinan/keuangan) sangat kecil:
* **Profil Santri:** ~0.3 KB per santri.
* **Log Perizinan (Keluar/Masuk):** ~0.15 KB per aktivitas.

| Jumlah Santri | Jumlah Log Izin / Tahun | Estimasi Ukuran Teks | Estimasi Masa Pakai (500 MB) |
| :--- | :--- | :--- | :--- |
| **500** | 10.000 log | ~2.5 MB | **> 100 Tahun** |
| **1.000** | 25.000 log | ~6.0 MB | **> 80 Tahun** |

> [!NOTE]  
> Tanpa penyimpanan file besar di dalam database, kapasitas gratis 500 MB dari Supabase sudah lebih dari cukup untuk menampung seluruh riwayat administrasi pondok selama puluhan tahun.

---

## 📷 3. Strategi Pengelolaan Foto (Base64 vs Supabase Storage)

### 🟢 Fase Sekarang (Base64 - Tanpa Konfigurasi)
Saat ini, foto identitas santri disimpan langsung di dalam kolom `photo_url` pada tabel `students` dalam format **Base64** (teks gambar terkompresi).
* **Kelebihan:** 100% langsung berfungsi tanpa perlu membuat konfigurasi folder, manajemen hak akses (*policies*), atau setup *bucket* di server.
* **Kekurangan:** Jika jumlah santri melampaui **1.000 santri**, ukuran baris database akan membesar dan berpotensi memperlambat proses ekspor-impor data.

### 🔵 Fase Masa Depan (Upgrade ke Supabase Storage)
Jika pondok memiliki ribuan santri aktif, disarankan memindahkan foto dari format Base64 ke **Supabase Storage Bucket** agar tabel database tetap ringan.

#### Langkah Migrasi ke Supabase Storage:
1. Masuk ke **Dashboard Supabase -> Storage**.
2. Buat bucket baru bernama `student-photos` dan atur hak aksesnya menjadi **Public** agar bisa dibaca oleh aplikasi.
3. Ubah kode penanganan unggah file di berkas `StudentModal.tsx` dari pembaca Base64 menjadi pengunggah Supabase SDK:
   ```typescript
   // Contoh implementasi di masa depan:
   const uploadPhoto = async (file: File, studentId: string) => {
     const fileExt = file.name.split('.').pop();
     const filePath = `${studentId}.${fileExt}`;
     
     // Unggah berkas ke bucket Supabase Storage
     const { data, error } = await supabase.storage
       .from('student-photos')
       .upload(filePath, file, { upsert: true });

     if (error) throw error;

     // Dapatkan URL publik gambar
     const { data: { publicUrl } } = supabase.storage
       .from('student-photos')
       .getPublicUrl(filePath);

     return publicUrl; // Simpan URL ini ke kolom student.photo_url di database
   };
   ```

---

## 🔐 4. Persyaratan Keamanan Kamera Scan QR (Wajib HTTPS)

Akses kamera HP pada fitur scanner dikendalikan langsung oleh peramban (*web browser*).

> [!IMPORTANT]  
> **Akses Kamera Wajib HTTPS!**  
> Protokol keamanan peramban modern (Chrome, Safari, iOS, Android) **akan memblokir penuh fungsi kamera** jika alamat web diakses lewat protokol HTTP biasa. Pastikan web portal Anda dihosting menggunakan sertifikat SSL aktif (**HTTPS**).

### 🛠️ Rekomendasi Hosting Gratis dengan SSL Otomatis:
1. **Vercel (Sangat Direkomendasikan):** Cukup hubungkan repositori Git, dan Vercel akan men-deploy web secara otomatis serta memberikan SSL gratis selamanya.
2. **Netlify:** Layanan hosting statis cepat yang juga menyediakan SSL gratis otomatis.
3. **Cloudflare:** Jika menggunakan domain pribadi (.com, .id, dll), hubungkan name server ke Cloudflare untuk proteksi keamanan DDoS dan sertifikat SSL instan.

---

## 📥 5. Strategi Cadangan Data Berkala (Backup & Recovery)

Untuk menghindari kehilangan data akibat kesalahan operator lapangan (*human error*) atau pemblokiran akun, lakukan langkah penyelamatan data berkala berikut:

### 💾 Cadangan Mandiri Harian / Mingguan:
1. Masuk ke **Dashboard Supabase**.
2. Masuk ke menu **Table Editor** -> pilih tabel `students`, `permissions`, atau `arrears`.
3. Klik tombol **Export -> Export to CSV** di sudut kanan atas layar.
4. Simpan file CSV tersebut dengan rapi di komputer lokal atau penyimpanan awan seperti Google Drive.

### ⚙️ Cadangan Otomatis Skema Database:
Simpan salinan berkas SQL migrasi perizinan terbaru Anda ([supabase_migration_permissions.sql](file:///c:/Users/LENOVO/Documents/WEB%20PROJECT/edupay-admin-portal/supabase_migration_permissions.sql)) di tempat yang aman. Berkas ini adalah cetak biru seluruh struktur tabel, trigger, dan kebijakan RLS keamanan Anda. Jika database tidak sengaja terhapus, Anda hanya perlu menjalankan kembali script SQL tersebut di SQL Editor Supabase baru.

---

## 🛠️ 6. Troubleshooting & Pertolongan Pertama

### 🚨 Gejala 1: Kamera HP gagal terbuka saat tombol "Scan" di-klik
* **Penyebab 1:** Alamat situs belum menggunakan HTTPS (masih HTTP).
* **Penyebab 2:** Izin akses kamera pada peramban HP telah ditolak sebelumnya secara tidak sengaja.
* **Solusi:** Klik ikon gembok di sebelah kiri kolom alamat URL peramban Anda, ubah status izin kamera dari **Blokir / Tanya** menjadi **Izinkan**, kemudian muat ulang (*refresh*) halaman.

### 🚨 Gejala 2: Tombol ketik form modal tidak bisa diklik / kursor mengetik melompat
* **Penyebab:** Sistem memiliki pemindai laser USB yang secara agresif mengunci fokus kursor ketikan.
* **Solusi:** Kami telah menyempurnakan fitur ini agar otomatis nonaktif saat form modal atau konfirmasi kedatangan sedang aktif. Jika kursor masih tidak fokus, tutup modal, muat ulang halaman, lalu buka kembali.

---

> Pelihara sistem ini dengan baik agar generasi santri Nurul Huda Malati berikutnya terus merasakan kemudahan administrasi modern yang rapi dan terintegrasi! 🚀
