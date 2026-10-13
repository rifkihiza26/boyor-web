import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord, ReimbursementClaim, Employee } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';

export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  employees: Employee[],
  filterTitle: string = 'Rekap Presensi Karyawan'
) {
  // Metadata / Header summary rows
  const headerData = [
    ['PT PROTEKSI ALFA SOLUSI (PROASI)'],
    [filterTitle],
    [`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Rekapan: ${records.length} data`],
    [], // Empty row separator
  ];

  const tableHeaders = [
    'No',
    'Tanggal',
    'Kode Pegawai',
    'Nama Pegawai',
    'Departemen / Divisi',
    'Jam Masuk',
    'Jam Pulang',
    'Durasi Kerja',
    'Status Presensi',
    'Ketepatan Waktu',
    'Catatan',
  ];

  const tableRows = records.map((rec, index) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    const durasiText = rec.totalMinutes 
      ? `${Math.floor(rec.totalMinutes / 60)} Jam ${rec.totalMinutes % 60} Menit` 
      : '-';

    return [
      index + 1,
      rec.date,
      emp?.employeeCode || rec.employeeId,
      emp?.fullName || '-',
      emp?.department || '-',
      rec.checkInAt || '-',
      rec.checkOutAt || '-',
      durasiText,
      rec.status === 'SELESAI' ? 'Selesai' : rec.status === 'SEDANG_BEKERJA' ? 'Sedang Bekerja' : 'Belum Check-In',
      rec.isLate ? 'Terlambat' : 'Tepat Waktu',
      rec.note || '-',
    ];
  });

  const fullData = [...headerData, tableHeaders, ...tableRows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');

  // Set professional column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // Kode Pegawai
    { wch: 26 }, // Nama Pegawai
    { wch: 20 }, // Departemen
    { wch: 14 }, // Jam Masuk
    { wch: 14 }, // Jam Pulang
    { wch: 20 }, // Durasi Kerja
    { wch: 18 }, // Status
    { wch: 16 }, // Ketepatan Waktu
    { wch: 32 }, // Catatan
  ];

  const dateNow = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Rekap_Presensi_PROASI_${dateNow}.xlsx`);
}

export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  employees: Employee[],
  filterTitle: string = 'Laporan Rekap Presensi Karyawan'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Top header banner
  doc.setFillColor(15, 23, 42); // Navy #0f172a
  doc.rect(0, 0, 297, 24, 'F');

  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PT PROTEKSI ALFA SOLUSI (PROASI)', 14, 10);

  // Subtitle / Portal
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('PORTAL SISTEM PRESENSI & OPERASIONAL STAF', 14, 16);

  // Date Printed on Top Right
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, 283, 10, { align: 'right' });
  doc.text(`Total Data: ${records.length} rekapan presensi`, 283, 16, { align: 'right' });

  // Title of Report
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(filterTitle, 14, 32);

  // Stats brief
  const hadirCount = records.filter(r => r.status === 'SELESAI' || r.status === 'SEDANG_BEKERJA').length;
  const lateCount = records.filter(r => r.isLate).length;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Ringkasan: Hadir: ${hadirCount} | Terlambat: ${lateCount} | Tepat Waktu: ${hadirCount - lateCount}`, 14, 37);

  const tableData = records.map((rec, index) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    return [
      (index + 1).toString(),
      rec.date,
      emp?.employeeCode || '-',
      emp?.fullName || '-',
      emp?.department || '-',
      rec.checkInAt || '-',
      rec.checkOutAt || '-',
      rec.totalMinutes ? `${Math.floor(rec.totalMinutes / 60)}j ${rec.totalMinutes % 60}m` : '-',
      rec.isLate ? 'Terlambat' : 'Tepat Waktu',
      rec.status === 'SELESAI' ? 'Selesai' : rec.status === 'SEDANG_BEKERJA' ? 'Aktif' : 'Standby',
      rec.note || '-',
    ];
  });

  autoTable(doc, {
    startY: 41,
    head: [['No', 'Tanggal', 'NIK', 'Nama Pegawai', 'Divisi', 'Masuk', 'Pulang', 'Durasi', 'Ket. Waktu', 'Status', 'Catatan']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [15, 23, 42], // Deep navy (#0f172a)
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      3: { cellWidth: 40 },
      4: { cellWidth: 26 },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 18 },
      10: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Footer page number
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 283, 202, { align: 'right' });
      doc.text('Dokumen Resmi PT Proteksi Alfa Solusi • Dokumen ini dihasilkan secara otomatis oleh sistem.', 14, 202);
    },
  });

  const dateNow = new Date().toISOString().slice(0, 10);
  doc.save(`Rekap_Presensi_PROASI_${dateNow}.pdf`);
}

export function exportReimbursementsToExcel(
  claims: ReimbursementClaim[],
  employees: Employee[],
  filterTitle: string = 'Rekap Reimbursement & Pengeluaran'
) {
  const data = claims.map((c, index) => {
    const emp = employees.find((e) => e.id === c.employeeId);
    return {
      No: index + 1,
      'No. Klaim': c.claimNumber,
      'Tgl Transaksi': c.transactionDate,
      'Nama Pegawai': emp?.fullName || '-',
      Departemen: emp?.department || '-',
      Kategori: c.category,
      Keperluan: c.title,
      'Nominal (Rp)': c.amount,
      Status: c.status,
      'Metode Bayar': c.paymentDetails?.method || '-',
      'Waktu Bayar': c.paymentDetails?.paidAt ? c.paymentDetails.paidAt.slice(0, 16) : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursement');

  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // No. Klaim
    { wch: 14 }, // Tgl Transaksi
    { wch: 22 }, // Nama Pegawai
    { wch: 16 }, // Departemen
    { wch: 18 }, // Kategori
    { wch: 30 }, // Keperluan
    { wch: 16 }, // Nominal
    { wch: 24 }, // Status
    { wch: 15 }, // Metode
    { wch: 18 }, // Waktu Bayar
  ];

  const dateNow = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Rekap_Reimbursement_${dateNow}.xlsx`);
}

export function exportReimbursementsToPDF(
  claims: ReimbursementClaim[],
  employees: Employee[],
  filterTitle: string = 'Laporan Rekap Reimbursement & Pengeluaran'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PT PROTEKSI ALFA SOLUSI (PROASI)', 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(filterTitle, 14, 22);

  const totalNominal = claims.reduce((acc, curr) => acc + curr.amount, 0);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Transaksi: ${claims.length} | Total Nilai: ${formatRupiah(totalNominal)}`,
    14,
    28
  );

  const tableData = claims.map((c, index) => {
    const emp = employees.find((e) => e.id === c.employeeId);
    return [
      (index + 1).toString(),
      c.claimNumber,
      c.transactionDate,
      emp?.fullName || '-',
      c.category,
      c.title,
      formatRupiah(c.amount),
      c.status,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['No', 'No. Klaim', 'Tgl Transaksi', 'Pegawai', 'Kategori', 'Keperluan / Judul', 'Nominal', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 'auto' },
      6: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const dateNow = new Date().toISOString().slice(0, 10);
  doc.save(`Rekap_Reimbursement_${dateNow}.pdf`);
}
