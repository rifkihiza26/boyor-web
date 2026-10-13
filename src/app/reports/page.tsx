'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { AttendanceRecord, ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import {
  exportAttendanceToExcel,
  exportAttendanceToPDF,
  exportReimbursementsToExcel,
  exportReimbursementsToPDF,
} from '@/lib/export-utils';
import {
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  User,
} from 'lucide-react';

type DateFilterType = 'ALL' | 'TODAY' | 'CUSTOM_DATE' | 'MONTH' | 'YEAR' | 'RANGE';

export default function ReportsPage() {
  const { allEmployees } = useAuth();
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'REIMBURSEMENT'>('ATTENDANCE');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  // Filter States
  const [filterType, setFilterType] = useState<DateFilterType>('MONTH');
  const [todayDate, setTodayDate] = useState('2026-10-13');
  const [selectedDate, setSelectedDate] = useState('2026-10-13');
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [startDate, setStartDate] = useState('2026-10-06');
  const [endDate, setEndDate] = useState('2026-10-13');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const yStr = String(now.getFullYear());
    const past7 = new Date();
    past7.setDate(past7.getDate() - 7);

    setTodayDate(todayStr);
    setSelectedDate(todayStr);
    setSelectedMonth(mStr);
    setSelectedYear(yStr);
    setEndDate(todayStr);
    setStartDate(past7.toISOString().slice(0, 10));

    Promise.all([
      SupabaseService.getAttendanceHistory(),
      SupabaseService.getClaims(),
    ]).then(([att, clm]) => {
      setAttendanceRecords(att);
      setClaims(clm);
    });
  }, []);

  // Filter Logic Helper
  const isDateMatchingFilter = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const cleanDate = dateStr.slice(0, 10);

    switch (filterType) {
      case 'ALL':
        return true;
      case 'TODAY':
        return cleanDate === todayDate;
      case 'CUSTOM_DATE':
        return cleanDate === selectedDate;
      case 'MONTH': {
        const [y, m] = cleanDate.split('-');
        return y === selectedYear && m === selectedMonth;
      }
      case 'YEAR': {
        const [y] = cleanDate.split('-');
        return y === selectedYear;
      }
      case 'RANGE':
        return cleanDate >= startDate && cleanDate <= endDate;
      default:
        return true;
    }
  };

  // Filtered Attendance
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((a) => {
      if (!isDateMatchingFilter(a.date)) return false;
      if (selectedEmployeeId !== 'ALL' && a.employeeId !== selectedEmployeeId) return false;
      return true;
    });
  }, [attendanceRecords, filterType, todayDate, selectedDate, selectedMonth, selectedYear, startDate, endDate, selectedEmployeeId]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (!isDateMatchingFilter(c.transactionDate)) return false;
      if (selectedEmployeeId !== 'ALL' && c.employeeId !== selectedEmployeeId) return false;
      return true;
    });
  }, [claims, filterType, todayDate, selectedDate, selectedMonth, selectedYear, startDate, endDate, selectedEmployeeId]);

  // Label Deskripsi Filter Aktif
  const filterDescription = useMemo(() => {
    switch (filterType) {
      case 'ALL':
        return 'Seluruh Periode Riwayat';
      case 'TODAY':
        return `Hari Ini (${formatDateIndo(todayDate)})`;
      case 'CUSTOM_DATE':
        return `Tanggal ${formatDateIndo(selectedDate)}`;
      case 'MONTH': {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `Bulan ${monthNames[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`;
      }
      case 'YEAR':
        return `Tahun ${selectedYear}`;
      case 'RANGE':
        return `Rentang ${formatDateIndo(startDate)} s/d ${formatDateIndo(endDate)}`;
      default:
        return 'Filter Periode';
    }
  }, [filterType, todayDate, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  // Attendance metrics
  const totalAttRecords = filteredAttendance.length;
  const totalAttPresent = filteredAttendance.filter(
    (a) => a.status === 'SELESAI' || a.status === 'SEDANG_BEKERJA'
  ).length;
  const totalAttLate = filteredAttendance.filter((a) => a.isLate).length;

  // Claims metrics
  const totalClaimAmount = filteredClaims.reduce((a, b) => a + b.amount, 0);
  const totalPendingManager = filteredClaims
    .filter((c) => c.status === 'Menunggu Persetujuan Manager')
    .reduce((a, b) => a + b.amount, 0);
  const totalReadyPay = filteredClaims
    .filter((c) => c.status === 'Siap Dibayar')
    .reduce((a, b) => a + b.amount, 0);
  const totalPaid = filteredClaims
    .filter((c) => c.status === 'Dibayar')
    .reduce((a, b) => a + b.amount, 0);

  // Export Handlers
  const handleExportExcel = () => {
    if (activeTab === 'ATTENDANCE') {
      exportAttendanceToExcel(filteredAttendance, allEmployees, `Rekap Presensi - ${filterDescription}`);
    } else {
      exportReimbursementsToExcel(filteredClaims, allEmployees, `Rekap Reimbursement - ${filterDescription}`);
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'ATTENDANCE') {
      exportAttendanceToPDF(filteredAttendance, allEmployees, `Laporan Presensi Staf - ${filterDescription}`);
    } else {
      exportReimbursementsToPDF(filteredClaims, allEmployees, `Laporan Reimbursement Staf - ${filterDescription}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Rekap Presensi & Kehadiran Pegawai
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Filter dan unduh arsip rekapan presensi seluruh staf dalam format resmi Excel (.xlsx) atau PDF.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold rounded text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Info Banner: Shortcut to Reimbursement */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Membutuhkan rekapan keuangan dan nota staf?</span>
          </div>
          <Link
            href="/reimbursements"
            className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 flex items-center gap-1"
          >
            Buka Halaman Rekap Reimbursement →
          </Link>
        </div>

        {/* FILTER BAR - HARI, TANGGAL, BULAN, TAHUN, RANGE CUSTOM */}
        <div className="bg-white p-4 sm:p-5 border border-slate-300 rounded shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter Periode Rekapitulasi</span>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Periode Aktif: <strong>{filterDescription}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            {/* Opsi Tipe Filter */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Kategori Waktu
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DateFilterType)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-medium"
              >
                <option value="TODAY">Hari Ini</option>
                <option value="CUSTOM_DATE">Pilih Tanggal Tertentu</option>
                <option value="MONTH">Bulanan (Bulan &amp; Tahun)</option>
                <option value="YEAR">Tahunan (Satu Tahun Penuh)</option>
                <option value="RANGE">Rentang Tanggal Custom</option>
                <option value="ALL">Semua Periode (Tanpa Batas)</option>
              </select>
            </div>

            {/* Input Dinamis Sesuai Tipe Filter */}
            {filterType === 'CUSTOM_DATE' && (
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Pilih Tanggal Spesifik
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                />
              </div>
            )}

            {filterType === 'MONTH' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
                  >
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                  />
                </div>
              </>
            )}

            {filterType === 'YEAR' && (
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Pilih Tahun
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                />
              </div>
            )}

            {filterType === 'RANGE' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                  />
                </div>
              </>
            )}

            {/* Filter Pegawai */}
            <div className={filterType === 'TODAY' || filterType === 'ALL' ? 'md:col-span-4' : 'md:col-span-3'}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Pilih Staf / Pegawai
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="ALL">Semua Staf</option>
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode || 'No NIK'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ATTENDANCE CONTENT */}
        {/* ========================================================= */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Log Presensi
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {totalAttRecords} Catatan
                </span>
                <span className="text-xs text-slate-500 mt-1 block">{filterDescription}</span>
              </div>

              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kehadiran Selesai / Aktif
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
                  {totalAttPresent} Kehadiran
                </span>
                <span className="text-xs text-slate-500 mt-1 block">Telah check-in di sistem</span>
              </div>

              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Keterlambatan
                </span>
                <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">
                  {totalAttLate} Insiden
                </span>
                <span className="text-xs text-slate-500 mt-1 block">Melewati jam toleransi</span>
              </div>
            </div>

            {/* Attendance Detail Table */}
            <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Rincian Log Kehadiran Staf ({filteredAttendance.length} Baris Data)
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  Export: PDF / Excel di kanan atas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Tanggal</th>
                      <th className="px-4 py-2.5 font-bold">NIK</th>
                      <th className="px-4 py-2.5 font-bold">Nama Pegawai</th>
                      <th className="px-4 py-2.5 font-bold">Divisi</th>
                      <th className="px-4 py-2.5 font-bold">Jam Masuk</th>
                      <th className="px-4 py-2.5 font-bold">Jam Pulang</th>
                      <th className="px-4 py-2.5 font-bold">Durasi</th>
                      <th className="px-4 py-2.5 font-bold">Status Waktu</th>
                      <th className="px-4 py-2.5 font-bold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                          Tidak ada data presensi yang sesuai dengan filter periode {filterDescription}.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((rec) => {
                        const emp = allEmployees.find((e) => e.id === rec.employeeId);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                              {rec.date}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-600">
                              {emp?.employeeCode || '-'}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-slate-900">
                              {emp?.fullName || rec.employeeId}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {emp?.department || '-'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-800">
                              {rec.checkInAt || '-'}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-800">
                              {rec.checkOutAt || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 font-mono">
                              {rec.totalMinutes
                                ? `${Math.floor(rec.totalMinutes / 60)}j ${rec.totalMinutes % 60}m`
                                : '-'}
                            </td>
                            <td className="px-4 py-2.5">
                              {rec.isLate ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  Terlambat
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Tepat Waktu
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 italic max-w-xs truncate">
                              {rec.note || '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: REIMBURSEMENT CONTENT */}
        {/* ========================================================= */}
        {activeTab === 'REIMBURSEMENT' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Nilai Periode Ini
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                  {formatRupiah(totalClaimAmount)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">{filteredClaims.length} nota transaksi</span>
              </div>

              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Menunggu Persetujuan
                </span>
                <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
                  {formatRupiah(totalPendingManager)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">Perlu review</span>
              </div>

              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Siap Ditransfer (Disetujui)
                </span>
                <span className="text-xl font-bold font-mono text-blue-700 mt-1 block">
                  {formatRupiah(totalReadyPay)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">Antrean pencairan</span>
              </div>

              <div className="bg-white p-4 border border-slate-300 rounded shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sudah Dicairkan Lunas
                </span>
                <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                  {formatRupiah(totalPaid)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">Dana terbayar</span>
              </div>
            </div>

            {/* Reimbursement Detail Table */}
            <div className="bg-white border border-slate-300 rounded overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Daftar Transaksi Reimbursement Staf ({filteredClaims.length} Baris)
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  Export: PDF / Excel di kanan atas
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">No. Klaim</th>
                      <th className="px-4 py-2.5 font-bold">Tgl Transaksi</th>
                      <th className="px-4 py-2.5 font-bold">Nama Pegawai</th>
                      <th className="px-4 py-2.5 font-bold">Kategori</th>
                      <th className="px-4 py-2.5 font-bold">Keperluan / Keterangan</th>
                      <th className="px-4 py-2.5 font-bold text-right">Nominal</th>
                      <th className="px-4 py-2.5 font-bold">Status</th>
                      <th className="px-4 py-2.5 font-bold">Bukti Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs italic">
                          Tidak ada data klaim reimbursement yang cocok dengan filter {filterDescription}.
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map((c) => {
                        const emp = allEmployees.find((e) => e.id === c.employeeId);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                              {c.claimNumber}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                              {c.transactionDate}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-slate-900">
                              <div>{emp?.fullName || c.employeeId}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {emp?.department || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">
                              {c.category}
                            </td>
                            <td className="px-4 py-2.5 text-slate-800 max-w-xs truncate">
                              {c.title}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatRupiah(c.amount)}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {c.attachmentUrl ? (
                                <a
                                  href={`/reimbursements/${c.id}`}
                                  className="text-[11px] font-bold text-blue-700 hover:underline"
                                >
                                  Lihat Foto
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Nota fisik</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
