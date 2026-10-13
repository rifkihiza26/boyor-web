# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Employee Attendance & Reimbursement System

**Versi:** 1.0  
**Status:** Prototype Development  
**Platform:** Responsive Web Application  
**Bahasa UI:** Bahasa Indonesia  
**Target Pengguna:** Perusahaan dengan kurang dari 20 karyawan  
**Frontend:** Next.js App Router, TypeScript, Tailwind CSS  
**Backend Target:** Supabase  
**Deployment Target:** Cloudflare Workers, setelah kompatibilitas teknis diverifikasi

---

# 1. PRODUCT OVERVIEW

## 1.1 Latar Belakang

Perusahaan membutuhkan aplikasi internal untuk mengelola absensi karyawan dan reimbursement dalam satu platform.

Proses absensi harus memungkinkan karyawan melakukan check-in dan check-out dengan validasi lokasi kantor. Proses reimbursement harus memungkinkan karyawan mengajukan pengeluaran, Manager memberikan persetujuan, dan Finance melakukan verifikasi serta pencatatan pembayaran.

Aplikasi dirancang untuk perusahaan kecil dengan kurang dari 20 karyawan sehingga antarmuka harus sederhana, mudah dipahami, cepat digunakan, dan tidak memiliki kompleksitas yang tidak diperlukan.

## 1.2 Tujuan Produk

1. Menyatukan pengelolaan absensi dan reimbursement dalam satu aplikasi.
2. Mempermudah karyawan melakukan absensi dan mengajukan klaim.
3. Membuat proses persetujuan reimbursement transparan dan dapat ditelusuri.
4. Mempermudah Finance memantau dan mencatat pembayaran.
5. Menyediakan laporan yang membantu Admin/HR memantau aktivitas perusahaan.
6. Mengurangi proses manual melalui alur kerja yang terstruktur.

## 1.3 Ruang Lingkup PRD

PRD ini menjadi acuan pengembangan prototype frontend terlebih dahulu.

Prototype harus memiliki tampilan yang mendekati aplikasi produksi, navigasi lengkap, data dummy yang konsisten, serta interaksi yang dapat diuji.

Backend, database, autentikasi produksi, penyimpanan file, validasi GPS sungguhan, dan integrasi pembayaran tidak termasuk dalam tahap ini.

---

# 2. USER ROLES & PERMISSIONS

Aplikasi memiliki empat role utama.

## 2.1 Admin / HR

Admin/HR bertanggung jawab terhadap pengelolaan data karyawan, pemantauan absensi, laporan, dan konfigurasi umum aplikasi.

Hak akses:
- Melihat dashboard perusahaan.
- Melihat seluruh data absensi.
- Melihat daftar dan detail karyawan.
- Menambah, mengubah, dan menonaktifkan karyawan dalam prototype.
- Melihat data reimbursement seluruh perusahaan.
- Melihat laporan absensi dan reimbursement.
- Mengubah pengaturan simulasi perusahaan.
- Melihat aktivitas operasional yang relevan.

Admin/HR tidak otomatis menjadi pihak yang menyetujui klaim atau mencatat pembayaran. Tindakan tersebut mengikuti role Manager dan Finance.

## 2.2 Employee

Employee adalah karyawan yang menggunakan aplikasi untuk aktivitas sehari-hari.

Hak akses:
- Melihat dashboard pribadi.
- Melakukan check-in dan check-out.
- Melihat riwayat absensi pribadi.
- Mengajukan reimbursement.
- Menyimpan draft pengajuan.
- Melihat status dan detail klaim sendiri.
- Melihat catatan penolakan atau permintaan revisi.
- Melihat profil pribadi.

Employee tidak boleh melihat klaim pribadi milik karyawan lain melalui antarmuka normal.

## 2.3 Manager

Manager bertanggung jawab menyetujui atau menolak reimbursement.

Hak akses:
- Melihat dashboard Manager.
- Melihat antrean klaim yang menunggu persetujuan.
- Melihat detail klaim dan bukti transaksi.
- Menyetujui klaim.
- Menolak klaim dengan alasan wajib.
- Melihat riwayat keputusan.
- Melihat ringkasan absensi tim sesuai cakupan kewenangannya.

## 2.4 Finance

Finance bertanggung jawab memverifikasi klaim yang telah disetujui Manager dan mencatat pembayarannya.

Hak akses:
- Melihat dashboard Finance.
- Melihat antrean verifikasi.
- Memeriksa detail klaim dan bukti transaksi.
- Meminta revisi dengan catatan wajib.
- Menandai klaim siap dibayar.
- Mencatat pembayaran.
- Melihat riwayat pembayaran.

---

# 3. INFORMATION ARCHITECTURE

## 3.1 Struktur Navigasi

Navigasi desktop menggunakan sidebar dan top bar. Pada perangkat mobile, sidebar berubah menjadi drawer atau navigasi responsif yang sesuai.

Menu umum:
- Dashboard
- Absensi
- Riwayat Absensi
- Reimbursement
- Profil Saya

Menu Admin/HR:
- Karyawan
- Laporan
- Pengaturan

Menu Manager:
- Persetujuan
- Ringkasan Tim

Menu Finance:
- Verifikasi Reimbursement
- Pembayaran
- Riwayat Pembayaran

Navigasi harus mengikuti role yang sedang aktif dalam prototype.

## 3.2 Daftar Halaman

| Route | Halaman | Pengguna |
|---|---|---|
| `/login` | Login demo | Semua |
| `/dashboard` | Dashboard sesuai role | Semua |
| `/attendance` | Absensi hari ini | Semua |
| `/attendance/history` | Riwayat absensi | Semua |
| `/reimbursements` | Daftar klaim | Semua, sesuai hak akses |
| `/reimbursements/new` | Form klaim baru | Employee |
| `/reimbursements/[id]` | Detail klaim | Sesuai hak akses |
| `/approvals` | Antrean persetujuan | Manager |
| `/team` | Ringkasan tim | Manager |
| `/finance` | Verifikasi klaim | Finance |
| `/finance/payments` | Antrean pembayaran | Finance |
| `/finance/history` | Riwayat pembayaran | Finance |
| `/employees` | Daftar karyawan | Admin/HR |
| `/employees/[id]` | Detail karyawan | Admin/HR |
| `/reports` | Laporan | Admin/HR dan role terkait |
| `/settings` | Pengaturan perusahaan | Admin/HR |
| `/profile` | Profil pengguna | Semua |

Nama route boleh disesuaikan selama konsisten dan tidak menghilangkan fungsi yang ditentukan.

---

# 4. DESIGN SYSTEM & UI/UX

## 4.1 Arah Visual

Gunakan gaya aplikasi SaaS internal perusahaan yang profesional, minimalis, modern, dan fungsional.

Karakteristik:
- Background putih atau abu-abu sangat muda.
- Warna aksen utama biru atau indigo.
- Tipografi yang jelas.
- Spasi dan hierarki visual konsisten.
- Border halus dan shadow secukupnya.
- Ikon konsisten.
- Status menggunakan badge yang mudah dibaca.
- Hindari dekorasi berlebihan dan penggunaan kartu untuk setiap elemen.

## 4.2 Layout Desktop

- Sidebar untuk navigasi utama.
- Top bar untuk judul halaman, profil, dan aksi umum.
- Area konten utama dengan lebar dan jarak yang nyaman.
- Tabel yang rapi dengan kolom konsisten.
- Filter dan aksi utama mudah ditemukan.

## 4.3 Layout Mobile

- Semua halaman harus responsif.
- Aksi check-in dan check-out harus mudah diakses.
- Form tidak boleh menyebabkan horizontal overflow.
- Tabel dapat diubah menjadi list/card atau horizontal scrolling yang terkontrol.
- Dialog dan menu harus dapat digunakan di layar kecil.
- Navigasi harus tetap mudah dipahami.

## 4.4 Komponen UI

Buat komponen reusable untuk:
- Button.
- Input, textarea, dan select.
- Status badge.
- Card.
- Table.
- Dialog konfirmasi.
- Toast notification.
- Form validation.
- Empty state.
- Loading state.
- Error state.
- Page header.
- Search dan filter.
- Activity timeline.
- Pagination bila diperlukan.

## 4.5 Format Data

- Bahasa UI: Bahasa Indonesia.
- Mata uang: Rupiah (IDR).
- Format tanggal mengikuti locale Indonesia.
- Waktu menggunakan format 24 jam.
- Nomor klaim dan ID karyawan menggunakan format yang konsisten.

---

# 5. LOGIN & PROTOTYPE SESSION

## 5.1 Tujuan

Menyediakan cara mudah untuk mencoba aplikasi menggunakan empat role tanpa backend.

## 5.2 Persyaratan

- Buat halaman login yang sederhana dan profesional.
- Sediakan akun demo untuk Admin/HR, Employee, Manager, dan Finance.
- Gunakan data karyawan fiktif.
- Sediakan tombol atau pilihan akun demo.
- Setelah login, arahkan pengguna ke dashboard.
- Sediakan logout.
- Pertahankan role demo setelah refresh jika memungkinkan.
- Tampilkan keterangan bahwa aplikasi sedang berjalan dalam mode demo.

## 5.3 Batasan

Login dan pergantian role hanya simulasi frontend. Jangan menganggapnya sebagai sistem autentikasi atau otorisasi yang aman.

---

# 6. DASHBOARD

Dashboard menampilkan informasi yang relevan dengan role pengguna.

## 6.1 Employee Dashboard

Komponen:
- Sapaan pengguna dan tanggal.
- Status absensi hari ini.
- Jam check-in.
- Jam check-out.
- Tombol check-in atau check-out sesuai status.
- Informasi lokasi kantor dan status radius simulasi.
- Ringkasan kehadiran bulan berjalan.
- Riwayat absensi terbaru.
- Jumlah klaim reimbursement.
- Total nominal klaim.
- Klaim yang masih menunggu proses.
- Aktivitas terbaru.
- Shortcut untuk mengajukan reimbursement.

## 6.2 Admin/HR Dashboard

Komponen:
- Total karyawan aktif.
- Jumlah karyawan hadir hari ini.
- Karyawan yang belum check-in.
- Jumlah keterlambatan.
- Ringkasan absensi.
- Jumlah klaim reimbursement.
- Total nilai klaim.
- Klaim yang menunggu persetujuan.
- Klaim yang menunggu verifikasi Finance.
- Aktivitas terbaru perusahaan.

## 6.3 Manager Dashboard

Komponen:
- Jumlah klaim yang menunggu persetujuan.
- Total nominal yang menunggu persetujuan.
- Antrean klaim terbaru.
- Riwayat keputusan.
- Ringkasan kehadiran tim.
- Shortcut menuju antrean persetujuan.

## 6.4 Finance Dashboard

Komponen:
- Jumlah klaim yang menunggu verifikasi.
- Jumlah klaim siap dibayar.
- Total nominal yang belum dibayar.
- Total pembayaran bulan berjalan.
- Pembayaran terbaru.
- Shortcut ke antrean verifikasi dan pembayaran.

Semua angka dashboard harus berasal dari sumber data mock yang sama dengan tabel dan halaman detail.

---

# 7. ATTENDANCE MODULE

## 7.1 Tujuan

Menyediakan pengalaman absensi yang mudah digunakan dan menunjukkan bagaimana validasi lokasi bekerja pada aplikasi produksi.

## 7.2 Halaman Absensi

Tampilkan:
- Status absensi hari ini.
- Tanggal.
- Jam check-in.
- Jam check-out.
- Total durasi kerja apabila sudah check-out.
- Nama dan alamat kantor.
- Radius kantor.
- Status simulasi lokasi.
- Tombol aksi sesuai kondisi.
- Riwayat absensi terbaru.

## 7.3 Status Absensi

- Belum Check-in.
- Sedang Bekerja.
- Selesai.

## 7.4 Alur Check-in

1. Employee membuka halaman absensi.
2. Aplikasi menampilkan status lokasi simulasi.
3. Employee menekan tombol Check-in.
4. Prototype mengevaluasi apakah lokasi simulasi berada di dalam radius.
5. Jika berada di dalam radius, check-in berhasil.
6. Jika berada di luar radius, check-in ditolak dan pesan error ditampilkan.
7. Jika berhasil, waktu check-in dan status absensi diperbarui.
8. Dashboard dan riwayat harus menampilkan data terbaru.

## 7.5 Alur Check-out

1. Employee harus sudah check-in.
2. Employee menekan tombol Check-out.
3. Prototype menyimpan waktu simulasi check-out.
4. Status berubah menjadi Selesai.
5. Durasi kerja ditampilkan.
6. Dashboard dan riwayat diperbarui.

## 7.6 Validasi

- Check-in tidak dapat dilakukan berulang pada sesi kerja yang sama.
- Check-out tidak dapat dilakukan sebelum check-in.
- Check-out tidak dapat dilakukan berulang setelah status Selesai.
- Check-in di luar radius ditolak.
- Pesan keberhasilan dan kesalahan harus jelas.

## 7.7 Simulasi GPS

Sediakan kontrol demo untuk mengubah kondisi lokasi:
- Dalam Radius.
- Di Luar Radius.

Tampilkan jarak simulasi dari kantor dan radius maksimum.

Jangan meminta izin lokasi browser pada prototype. Jangan mengklaim bahwa lokasi benar-benar telah diverifikasi.

## 7.8 Jam dan Keterlambatan

Gunakan jam lokal simulasi yang konsisten. Tampilkan status terlambat jika waktu check-in melewati jam masuk ditambah toleransi yang dikonfigurasi.

Timestamp pada prototype tidak boleh disebut sebagai server timestamp yang tepercaya.

## 7.9 Riwayat Absensi

Tampilkan:
- Tanggal.
- Jam check-in.
- Jam check-out.
- Durasi kerja.
- Status kehadiran.
- Indikator keterlambatan.

Fitur:
- Filter bulan.
- Filter status.
- Pencarian jika relevan.
- Tampilan tabel.
- Tampilan kalender bila memungkinkan.
- Empty state ketika tidak ada data.

---

# 8. REIMBURSEMENT MODULE

## 8.1 Tujuan

Memfasilitasi pengajuan biaya operasional karyawan dan memantau statusnya sampai pembayaran dicatat.

## 8.2 Kategori

- Transportasi.
- Makan.
- Akomodasi.
- Perlengkapan Kantor.
- Komunikasi.
- Lainnya.

## 8.3 Data Klaim

Setiap klaim terdiri dari:
- ID klaim.
- Nama pengeluaran.
- Nama karyawan.
- Kategori.
- Tanggal transaksi.
- Tanggal pengajuan.
- Nominal.
- Deskripsi.
- Bukti transaksi.
- Status.
- Riwayat aktivitas.
- Catatan Manager.
- Catatan Finance.
- Informasi pembayaran jika sudah dibayar.

## 8.4 Daftar Klaim

Tampilkan:
- Nomor klaim.
- Judul.
- Karyawan.
- Kategori.
- Tanggal transaksi.
- Nominal.
- Status.
- Tanggal pengajuan.
- Tombol untuk melihat detail.

Fitur:
- Pencarian.
- Filter status.
- Filter kategori.
- Filter bulan atau rentang tanggal.
- Pengurutan data bila relevan.
- Empty state.
- Pagination atau daftar sederhana sesuai kebutuhan.

Employee hanya melihat klaim miliknya. Role pemroses dapat melihat data yang diperlukan sesuai tanggung jawabnya.

## 8.5 Form Pengajuan

Field:
- Judul pengeluaran.
- Kategori.
- Tanggal transaksi.
- Nominal.
- Deskripsi.
- Bukti transaksi.

Persyaratan:
- Field wajib harus divalidasi.
- Nominal harus lebih besar dari nol.
- File yang diterima: PDF, JPG, PNG.
- Tampilkan nama file yang dipilih.
- Sediakan opsi menghapus file sebelum pengajuan.
- Tampilkan pesan validasi di dekat field terkait.
- Sediakan tombol Simpan Draft.
- Sediakan tombol Ajukan.
- Minta konfirmasi sebelum pengajuan final.
- Setelah berhasil, tampilkan notifikasi dan arahkan ke detail atau daftar klaim.

File hanya digunakan untuk simulasi frontend dan tidak diunggah ke server.

## 8.6 Detail Klaim

Tampilkan:
- Nomor klaim.
- Informasi pengaju.
- Judul dan kategori.
- Tanggal transaksi.
- Nominal.
- Deskripsi.
- Bukti transaksi.
- Status saat ini.
- Catatan Manager dan Finance.
- Riwayat perubahan status.
- Waktu setiap aktivitas.
- Aksi yang tersedia sesuai role dan status.

---

# 9. REIMBURSEMENT WORKFLOW

## 9.1 Daftar Status

Gunakan status kanonis berikut:

1. Draft.
2. Menunggu Persetujuan Manager.
3. Ditolak Manager.
4. Disetujui Manager.
5. Menunggu Verifikasi Finance.
6. Perlu Revisi Finance.
7. Siap Dibayar.
8. Dibayar.
9. Dibatalkan.

Label yang ditampilkan kepada pengguna harus menggunakan Bahasa Indonesia secara konsisten.

## 9.2 Alur Utama

**Employee → Manager → Finance → Pembayaran**

### Tahap 1: Employee

- Membuat draft.
- Mengisi data klaim.
- Melampirkan bukti transaksi.
- Mengajukan klaim.
- Klaim berpindah ke Menunggu Persetujuan Manager.

### Tahap 2: Manager

Manager dapat:
- Menyetujui klaim.
- Menolak klaim dengan alasan wajib.

Jika disetujui, klaim berpindah ke tahap verifikasi Finance.

Jika ditolak, status menjadi Ditolak Manager dan alasan ditampilkan kepada Employee.

### Tahap 3: Finance

Finance dapat:
- Memeriksa data dan bukti transaksi.
- Meminta revisi dengan catatan wajib.
- Menyetujui klaim untuk pembayaran.

Klaim yang memerlukan revisi harus menampilkan catatan Finance secara jelas.

Klaim yang lolos verifikasi berpindah ke Siap Dibayar.

### Tahap 4: Pembayaran

Finance:
- Membuka klaim yang siap dibayar.
- Mengisi tanggal pembayaran.
- Memilih metode pembayaran.
- Mengonfirmasi pembayaran.

Setelah dikonfirmasi, status menjadi Dibayar dan klaim masuk ke riwayat pembayaran.

## 9.3 Aturan Workflow

- Hanya klaim berstatus Menunggu Persetujuan Manager yang dapat diproses Manager.
- Penolakan Manager membutuhkan alasan.
- Hanya klaim yang disetujui Manager yang masuk antrean verifikasi Finance.
- Permintaan revisi Finance membutuhkan catatan.
- Hanya klaim Siap Dibayar yang dapat dicatat pembayarannya.
- Klaim Dibayar tidak dapat dibayar ulang.
- Klaim yang ditolak tidak boleh masuk antrean pembayaran.
- Perubahan status harus memperbarui seluruh halaman yang relevan.
- Semua transisi status harus tercatat dalam activity timeline.

Aturan perubahan status harus diterapkan melalui fungsi bisnis terpusat, bukan tersebar dalam komponen UI.

---

# 10. MANAGER APPROVAL

## 10.1 Halaman Persetujuan

Tampilkan:
- Jumlah klaim menunggu persetujuan.
- Total nominal yang menunggu keputusan.
- Tabel antrean klaim.
- Pencarian berdasarkan nomor klaim atau nama karyawan.
- Filter status dan kategori.
- Link ke detail klaim.

Kolom tabel:
- Nomor klaim.
- Nama karyawan.
- Kategori.
- Tanggal transaksi.
- Nominal.
- Status.
- Aksi.

## 10.2 Detail Persetujuan

Manager dapat melihat:
- Data karyawan.
- Detail pengeluaran.
- Nominal.
- Bukti transaksi.
- Catatan pengajuan.
- Riwayat klaim yang tersedia.
- Tombol Setujui.
- Tombol Tolak.

## 10.3 Interaksi

- Tampilkan dialog konfirmasi sebelum keputusan.
- Alasan wajib ketika menolak.
- Setelah keputusan, perbarui status.
- Catat nama aktor, waktu simulasi, dan catatan.
- Tampilkan notifikasi.
- Perbarui jumlah antrean dan dashboard.

---

# 11. FINANCE & PAYMENT MODULE

## 11.1 Halaman Verifikasi

Tampilkan:
- Klaim yang telah disetujui Manager.
- Nomor klaim.
- Nama karyawan.
- Kategori.
- Nominal.
- Tanggal pengajuan.
- Bukti transaksi.
- Riwayat persetujuan.
- Status.

Aksi:
- Minta Revisi.
- Setujui untuk Pembayaran.

Minta Revisi harus membuka dialog atau form dengan catatan wajib.

Setujui untuk Pembayaran mengubah status menjadi Siap Dibayar.

## 11.2 Halaman Antrean Pembayaran

Tampilkan hanya klaim berstatus Siap Dibayar.

Kolom:
- Nomor klaim.
- Karyawan.
- Nominal.
- Tanggal pengajuan.
- Status.
- Aksi pembayaran.

## 11.3 Form Pembayaran

Field:
- Tanggal pembayaran.
- Metode pembayaran.
- Catatan opsional.

Metode:
- Transfer Bank.
- Tunai.

Interaksi:
- Validasi field wajib.
- Dialog konfirmasi.
- Update status menjadi Dibayar.
- Simpan informasi pembayaran pada data mock.
- Tambahkan aktivitas pada timeline.
- Tampilkan notifikasi sukses.

Tidak ada transaksi uang sungguhan.

## 11.4 Riwayat Pembayaran

Tampilkan:
- Nomor klaim.
- Nama karyawan.
- Nominal.
- Tanggal pembayaran.
- Metode pembayaran.
- Status.

Sediakan pencarian dan filter tanggal.

---

# 12. EMPLOYEE MANAGEMENT

## 12.1 Daftar Karyawan

Halaman khusus Admin/HR.

Tampilkan:
- ID karyawan.
- Nama.
- Email.
- Departemen.
- Jabatan.
- Role.
- Status aktif.

Fitur:
- Pencarian.
- Filter departemen.
- Filter role.
- Filter status.
- Tambah karyawan.
- Edit karyawan.
- Detail karyawan.
- Aktifkan atau nonaktifkan karyawan.

## 12.2 Form Karyawan

Field:
- ID karyawan.
- Nama lengkap.
- Email.
- Departemen.
- Jabatan.
- Role.
- Status.

Validasi:
- Field wajib tidak boleh kosong.
- Email harus memiliki format valid.
- ID karyawan harus unik dalam data mock.

## 12.3 Data Karyawan

Sediakan kurang dari 20 karyawan fiktif dengan beberapa departemen dan jabatan.

Perubahan hanya tersimpan pada state atau penyimpanan lokal prototype.

---

# 13. REPORTS & ANALYTICS

## 13.1 Laporan Absensi

Tampilkan:
- Total hari hadir.
- Jumlah keterlambatan.
- Jumlah ketidakhadiran.
- Ringkasan kehadiran per karyawan.
- Tren kehadiran bulanan bila relevan.

## 13.2 Laporan Reimbursement

Tampilkan:
- Total nominal pengajuan.
- Nominal yang menunggu persetujuan.
- Nominal yang menunggu verifikasi.
- Nominal siap dibayar.
- Nominal yang sudah dibayar.
- Ringkasan klaim per kategori.
- Ringkasan klaim per karyawan.

## 13.3 Filter dan Ekspor

- Filter bulan.
- Filter karyawan.
- Filter status jika relevan.
- Ekspor CSV berdasarkan data yang ditampilkan.

Tombol ekspor harus menghasilkan file CSV yang benar-benar dapat diunduh.

Semua angka harus dihitung dari sumber data mock yang sama. Jangan menggunakan angka dekoratif yang berbeda dari data tabel.

---

# 14. SETTINGS

Halaman Pengaturan hanya untuk Admin/HR.

Field:
- Nama perusahaan.
- Nama kantor.
- Alamat kantor.
- Latitude dan longitude dummy.
- Radius absensi dalam meter.
- Jam masuk.
- Jam pulang.
- Toleransi keterlambatan dalam menit.

Fitur:
- Mengubah nilai.
- Menyimpan pengaturan lokal.
- Validasi field.
- Menampilkan notifikasi berhasil.
- Tombol reset bila diperlukan.

Pengaturan radius dan jam kerja harus digunakan oleh simulasi absensi.

Tampilkan pemberitahuan bahwa konfigurasi hanya berlaku pada prototype.

---

# 15. PROFILE

Halaman profil menampilkan:
- Nama.
- ID karyawan.
- Email.
- Departemen.
- Jabatan.
- Role aktif.

Pengeditan data profil dapat dibuat sederhana jika mendukung demonstrasi. Pengelolaan password dan akun sungguhan tidak termasuk dalam prototype.

---

# 16. MOCK DATA & DATA MODEL

## 16.1 Prinsip

Semua halaman harus menggunakan satu sumber data mock terpusat.

Gunakan TypeScript types atau interfaces untuk mendefinisikan struktur data.

Model data minimal:

### Employee
- id
- employeeCode
- fullName
- email
- department
- jobTitle
- role
- isActive

### AttendanceRecord
- id
- employeeId
- date
- checkInAt
- checkOutAt
- status
- totalMinutes
- isLate

### ReimbursementClaim
- id
- claimNumber
- employeeId
- title
- category
- transactionDate
- submittedAt
- amount
- description
- attachmentName
- status
- managerNote
- financeNote
- paymentDetails

### ActivityLog
- id
- claimId
- action
- actorId
- actorName
- actorRole
- timestamp
- note

### PaymentDetails
- paidAt
- method
- note

### CompanySettings
- companyName
- officeName
- officeAddress
- officeLatitude
- officeLongitude
- officeRadiusMeters
- workStartTime
- workEndTime
- lateToleranceMinutes

Struktur dapat disesuaikan selama mendukung seluruh alur produk.

## 16.2 Seed Data

Sediakan:
- Kurang dari 20 karyawan.
- Beberapa departemen.
- Data absensi untuk bulan berjalan dan bulan sebelumnya.
- Klaim reimbursement dengan berbagai status.
- Klaim ditolak dengan alasan.
- Klaim yang memerlukan revisi.
- Klaim siap dibayar.
- Klaim yang sudah dibayar.
- Riwayat aktivitas untuk klaim yang telah diproses.

Gunakan data fiktif dan nominal Rupiah yang realistis.

## 16.3 Konsistensi

- Dashboard harus menghitung dari mock data.
- Tabel dan detail harus mengacu pada record yang sama.
- Perubahan status harus terlihat di semua halaman terkait.
- Data karyawan pada klaim harus menggunakan employee ID yang valid.
- Activity timeline harus konsisten dengan status dan keputusan klaim.

---

# 17. TECHNICAL REQUIREMENTS

## 17.1 Teknologi

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- React.
- Lucide Icons.
- Library tambahan hanya jika memberi manfaat yang jelas.

## 17.2 Kualitas Kode

- Pisahkan halaman, komponen, tipe data, dan fungsi mock.
- Gunakan komponen reusable.
- Hindari komponen yang terlalu besar.
- Hindari penggunaan `any` jika memungkinkan.
- Gunakan fungsi terpusat untuk perubahan status bisnis.
- Hindari duplikasi logika.
- Hindari dependency yang tidak diperlukan.
- Jangan menambahkan backend dalam tahap prototype.

## 17.3 Penyimpanan Lokal

Jika persistence dibutuhkan:
- Gunakan localStorage.
- Inisialisasi data demo pada kunjungan pertama.
- Pertahankan perubahan setelah refresh.
- Tangani data lokal yang tidak valid.
- Hindari akses localStorage saat server rendering.
- Cegah hydration mismatch.
- Sediakan tombol Reset Data Demo.
- Reset mengembalikan seluruh data mock ke kondisi awal.

## 17.4 Folder Structure

Struktur berikut adalah rekomendasi:

- `src/app/` untuk halaman dan layout.
- `src/components/` untuk komponen UI dan fitur.
- `src/lib/mock-data/` untuk seed data.
- `src/lib/mock-services/` untuk fungsi bisnis mock.
- `src/lib/storage/` untuk persistence lokal.
- `src/lib/formatters/` untuk format tanggal dan mata uang.
- `src/lib/validations/` untuk validasi form.
- `src/types/` untuk tipe data.

Struktur dapat disesuaikan dengan kebutuhan implementasi.

---

# 18. NON-FUNCTIONAL REQUIREMENTS

## 18.1 Performance

- Halaman harus terasa cepat dan responsif.
- Hindari dependency berlebihan.
- Hindari render ulang yang tidak diperlukan.
- Gunakan gambar hanya jika relevan.

## 18.2 Accessibility

- Input memiliki label.
- Tombol memiliki nama aksi yang jelas.
- Dialog dapat dioperasikan dengan keyboard.
- Fokus terlihat dengan jelas.
- Status tidak hanya dibedakan berdasarkan warna.
- Kontras teks harus nyaman dibaca.

## 18.3 Reliability

- Tidak ada tombol utama yang hanya bersifat dekoratif.
- Tidak ada link yang mengarah ke halaman rusak.
- Validasi form berfungsi.
- Perubahan data konsisten.
- Empty state dan error state tersedia.
- Tidak ada error TypeScript atau console yang diketahui dan dibiarkan tanpa penjelasan.

## 18.4 Responsive Design

Uji tampilan pada:
- Desktop.
- Tablet.
- Mobile.

Pastikan tidak ada horizontal overflow yang tidak disengaja dan seluruh aksi utama dapat digunakan.

---

# 19. PROTOTYPE LIMITATIONS

Semua hal berikut berada di luar cakupan prototype:

- Supabase project.
- Supabase Auth.
- Supabase PostgreSQL.
- Row Level Security.
- Supabase Storage.
- API backend.
- Real server timestamps.
- GPS dan geofencing sungguhan.
- Email notification.
- Integrasi bank.
- Pembayaran sungguhan.
- Audit log yang aman di server.
- Deployment produksi.

Semua fungsi yang belum terhubung ke backend harus diberi label atau penjelasan yang sesuai.

Jangan mengklaim bahwa prototype menyediakan keamanan produksi, validasi GPS yang tepercaya, atau penyimpanan permanen.

---

# 20. ACCEPTANCE CRITERIA

Prototype dinyatakan memenuhi kebutuhan jika seluruh kriteria berikut terpenuhi.

## Authentication
- Empat role demo dapat masuk.
- Dashboard berubah sesuai role.
- Navigasi menyesuaikan role.
- Logout berfungsi.

## Attendance
- Check-in berhasil di dalam radius simulasi.
- Check-in ditolak di luar radius.
- Check-out hanya dapat dilakukan setelah check-in.
- Riwayat absensi diperbarui.
- Status terlambat dihitung berdasarkan pengaturan.

## Reimbursement
- Employee dapat membuat draft.
- Form memvalidasi data wajib.
- Pengajuan dapat dikirim.
- Bukti transaksi dapat dipilih sebagai file lokal.
- Detail dan daftar klaim konsisten.
- Status klaim ditampilkan dengan benar.

## Manager
- Manager melihat antrean yang sesuai.
- Manager dapat menyetujui klaim.
- Manager dapat menolak klaim dengan alasan.
- Keputusan memperbarui status dan timeline.

## Finance
- Finance melihat klaim yang sudah disetujui Manager.
- Finance dapat meminta revisi dengan catatan.
- Finance dapat menandai klaim siap dibayar.
- Finance dapat mencatat pembayaran.
- Klaim yang sudah dibayar tidak dapat dibayar ulang.
- Riwayat pembayaran diperbarui.

## Admin/HR
- Admin/HR dapat melihat data karyawan.
- Form tambah dan edit karyawan berfungsi.
- Filter dan pencarian bekerja.
- Laporan konsisten dengan data mock.
- Pengaturan tersimpan secara lokal.

## General
- Semua halaman utama dapat dibuka.
- Tidak ada aksi utama yang hanya dekoratif.
- Data konsisten antarhalaman.
- Tampilan responsif.
- Data demo dapat di-reset.
- Aplikasi berjalan tanpa backend atau kredensial Supabase.
- Instruksi menjalankan aplikasi tersedia.
- Hasil pemeriksaan teknis dilaporkan secara jujur.

---

# 21. IMPLEMENTATION PRIORITY

Urutan implementasi:

**Priority 1 — Foundation**
- Next.js setup.
- Design system.
- Application layout.
- Login demo.
- Role switching.
- Mock data dan persistence.

**Priority 2 — Core workflow**
- Dashboard.
- Attendance.
- Attendance history.
- Reimbursement form.
- Reimbursement list dan detail.
- Manager approval.
- Finance verification.
- Payment recording.

**Priority 3 — Management**
- Employee management.
- Reports.
- Settings.
- Profile.

**Priority 4 — Quality**
- Responsive refinements.
- Validation.
- Empty and error states.
- Data consistency.
- Accessibility.
- Lint, TypeScript, dan build checks.

---

# 22. FINAL DEFINITION OF DONE

Prototype dianggap selesai ketika:

1. Semua halaman dalam ruang lingkup tersedia.
2. Semua empat role demo dapat diuji.
3. Alur absensi dapat didemonstrasikan.
4. Alur reimbursement dari Employee sampai Finance selesai dapat didemonstrasikan.
5. Semua data terkait konsisten.
6. Perubahan data bertahan setelah refresh jika persistence lokal digunakan.
7. Tampilan berfungsi di desktop dan mobile.
8. Tidak ada backend yang telah dikonfigurasi.
9. Pemeriksaan teknis telah dijalankan sesuai kemampuan lingkungan.
10. Dokumentasi penggunaan lokal tersedia.
11. Daftar fitur yang belum dibuat dijelaskan dengan jelas.

**Prinsip utama:** bangun aplikasi frontend yang benar-benar interaktif, bukan hanya mockup statis. Fokus pada kemudahan penggunaan, alur kerja yang benar, konsistensi data, dan kesiapan untuk diintegrasikan dengan Supabase pada tahap berikutnya.