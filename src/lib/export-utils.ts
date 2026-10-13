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
  const data = records.map((rec, index) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    return {
      No: index + 1,
      Tanggal: rec.date,
      'Kode Pegawai': emp?.employeeCode || rec.employeeId,
      'Nama Pegawai': emp?.fullName || '-',
      Departemen: emp?.department || '-',
      'Jam Masuk': rec.checkInAt || '-',
      'Jam Pulang': rec.checkOutAt || '-',
      'Durasi (Menit)': rec.totalMinutes || 0,
      Status: rec.status === 'SELESAI' ? 'Selesai' : rec.status === 'SEDANG_BEKERJA' ? 'Sedang Bekerja' : 'Belum Check-In',
      Keterlambatan: rec.isLate ? 'Terlambat' : 'Tepat Waktu',
      Keterangan: rec.note || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Presensi');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Tanggal
    { wch: 14 }, // Kode
    { wch: 22 }, // Nama
    { wch: 16 }, // Departemen
    { wch: 12 }, // Masuk
    { wch: 12 }, // Pulang
    { wch: 14 }, // Durasi
    { wch: 16 }, // Status
    { wch: 14 }, // Terlambat
    { wch: 30 }, // Keterangan
  ];

  const dateNow = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Rekap_Presensi_${dateNow}.xlsx`);
}

export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  employees: Employee[],
  filterTitle: string = 'Laporan Rekap Presensi Karyawan'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PT PROTEKSI ALFA SOLUSI (PROASI)', 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(filterTitle, 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Data: ${records.length} rekapan`, 14, 28);

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
      rec.note || '-',
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [['No', 'Tanggal', 'NIK', 'Nama Pegawai', 'Divisi', 'Masuk', 'Pulang', 'Durasi', 'Ket. Waktu', 'Catatan']],
    body: tableData,
    theme: 'grid',
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
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 42 },
      4: { cellWidth: 28 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
      7: { halign: 'center', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 24 },
      9: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const dateNow = new Date().toISOString().slice(0, 10);
  doc.save(`Rekap_Presensi_${dateNow}.pdf`);
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
