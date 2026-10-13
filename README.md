# Boyor Agency - Sistem Absensi & Reimbursement Terpadu (Frontend Prototype)

Aplikasi prototype web internal perusahaan untuk pengelolaan absensi karyawan dan klaim reimbursement berbasis **Next.js App Router**, **TypeScript**, dan **Tailwind CSS**.

Sesuai panduan dan kriteria penerimaan pada `PRD.md`:
- **Tanpa Backend / Database**: Tidak terhubung ke Supabase, backend server, autentikasi eksternal, atau pembayaran sungguhan.
- **Centralized Mock Data & Persistence**: Seluruh state disimpan dan dipertahankan melalui `localStorage` di browser, didukung fungsi bisnis terpusat.
- **Multi-Role Demo System**: Mendukung pengujian simulasi instan untuk 4 role utama: **Employee**, **Manager**, **Finance**, dan **Admin / HR**.

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat
- Node.js versi 18+ (direkomendasikan v20+)
- npm

### 2. Instalasi & Menjalankan Server Development
```bash
# Jalankan server development Next.js
npm run dev
```

Buka peramban (browser) di [http://localhost:3000](http://localhost:3000). Aplikasi akan otomatis mengarahkan ke halaman `/dashboard` atau `/login`.

### 3. Membangun Versi Produksi (Production Build)
```bash
npm run build
npm start
```

---

## 👥 Akun Demo & Skenario Pengujian Alur Kerja

Aplikasi menyediakan 4 akun demo fiktif yang dapat dialihkan secara instan melalui dropdown **Ganti Demo Role** di navigasi sidebar atau melalui halaman `/login`:

| Akun / Karyawan | Role Demo | Tanggung Jawab & Fitur Utama |
|---|---|---|
| **Dimas Anggara** | `EMPLOYEE` | • Check-in & Check-out absensi harian dengan geofence.<br>• Buat draft klaim & kirim pengajuan reimbursement.<br>• Lihat riwayat presensi & status persetujuan klaim. |
| **Bima Santoso** | `MANAGER` | • Dashboard persetujuan tim.<br>• Tinjau berkas, setujui klaim, atau tolak klaim dengan alasan wajib.<br>• Pantau ringkasan kehadiran staf tim. |
| **Siti Rahmawati** | `FINANCE` | • Verifikasi klaim yang telah disetujui Manager.<br>• Minta revisi dokumen ke karyawan dengan catatan wajib.<br>• Tandai klaim Siap Dibayar & catat bukti pembayaran (transfer/tunai). |
| **Rian Pratama** | `ADMIN_HR` | • Kelola data karyawan (&lt; 20 staf), tambah, edit & status aktif.<br>• Rekapitulasi laporan kehadiran & keuangan + Ekspor CSV.<br>• Konfigurasi perimeter radius kantor, jam masuk, dan toleransi telat. |

---

## 🔄 Demonstrasi Alur Kerja Utama

### 1. Skenario Absensi & Geofence
1. Masuk sebagai **Employee** (`Dimas Anggara`).
2. Buka menu **Absensi Hari Ini** (`/attendance`).
3. Pada bar notifikasi atas atau kontrol simulasi, coba pilih **Di Luar Radius (1.450m)**.
4. Klik tombol **Check-in Sekarang**. Sistem akan menolak check-in karena di luar radius kantor (100m).
5. Ubah simulasi ke **Dalam Radius Kantor**.
6. Klik **Check-in Sekarang**. Presensi berhasil dicatat beserta status keterlambatan (jika melewati jam toleransi kantor).
7. Klik **Check-out** untuk mengakhiri sesi kerja harian dan menghitung durasi jam kerja.

### 2. Skenario Siklus Reimbursement Lengkap
1. **Employee**: Buka menu **Reimbursement** &rarr; **Buat Pengajuan Baru** (`/reimbursements/new`). Isi formulir, pilih berkas struk lokal, dan klik **Ajukan Klaim**. Status beralih ke `Menunggu Persetujuan Manager`.
2. **Manager**: Alihkan akun ke **Manager** (`Bima Santoso`). Buka menu **Persetujuan** (`/approvals`). Klik klaim terkait, periksa rincian, lalu klik **Setujui** (atau **Tolak** dengan alasan). Status klaim beralih ke `Menunggu Verifikasi Finance`.
3. **Finance**: Alihkan akun ke **Finance** (`Siti Rahmawati`). Buka menu **Verifikasi Klaim** (`/finance`). Buka detail klaim, lakukan review:
   - Pilih **Minta Revisi** jika berkas kurang (status jadi `Perlu Revisi Finance`).
   - Atau pilih **Siap Dibayar** (status jadi `Siap Dibayar`).
4. **Pencairan Pembayaran**: Buka menu **Antrean Pembayaran** (`/finance/payments`). Klik **Catat Pembayaran**, masukkan metode pencairan dan referensi transfer, lalu konfirmasi. Status klaim menjadi `Dibayar` dan masuk ke **Riwayat Bayar** (`/finance/history`).
5. **Activity Log**: Buka halaman detail klaim kapan saja (`/reimbursements/[id]`) untuk melihat linimasa jejak audit lengkap dari setiap tahap keputusan.

---

## 🛠️ Fitur Administrasi & Laporan (Admin / HR)
- **Manajemen Karyawan (`/employees`)**: Tambah staf baru, ubah data jabatan/email/rekening bank payroll, serta aktifkan/nonaktifkan akun karyawan.
- **Laporan & Analitik (`/reports`)**: Agregasi kehadiran per karyawan, persentase kedisiplinan, analisis biaya per kategori, dan tombol **Ekspor Data (CSV)** yang menghasilkan file spreadsheet nyata.
- **Pengaturan Kantor (`/settings`)**: Ubah nama kantor, koordinat geofence, radius absensi (meter), jam masuk kerja, dan batas menit toleransi. Nilai ini langsung terhubung dengan kalkulasi check-in modul presensi.
- **Reset Demo Data**: Tombol reset demo di header atas mengembalikan data dummy ke status awal seed jika ingin memulai pengujian baru.
