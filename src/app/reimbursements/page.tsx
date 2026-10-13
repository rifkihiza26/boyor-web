'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { exportReimbursementsToExcel, exportReimbursementsToPDF } from '@/lib/export-utils';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';

type DateFilterType = 'ALL' | 'TODAY' | 'MONTH' | 'YEAR' | 'RANGE';

export default function ReimbursementsPage() {
  const { currentUser, role, allEmployees } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [allClaims, setAllClaims] = useState<ReimbursementClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filter States
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('MONTH');
  const [todayDate, setTodayDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isDirut = role === 'DIRUT' || role === 'ADMIN_HR' || role === 'MANAGER' || role === 'FINANCE';

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const yStr = String(now.getFullYear());
    const past30 = new Date();
    past30.setDate(past30.getDate() - 30);

    setTodayDate(todayStr);
    setSelectedMonth(mStr);
    setSelectedYear(yStr);
    setEndDate(todayStr);
    setStartDate(past30.toISOString().slice(0, 10));
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      // Jika Dirut / Admin, ambil semua klaim. Jika Pegawai dengan ID, ambil klaim miliknya.
      const claims = isDirut || !currentUser.id
        ? await SupabaseService.getClaims()
        : await SupabaseService.getClaims(currentUser.id);
      setAllClaims(claims);
    } catch (e) {
      console.error('Failed to fetch claims:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, isDirut]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Date matching logic
  const isDateMatching = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const clean = dateStr.slice(0, 10);

    switch (dateFilterType) {
      case 'ALL':
        return true;
      case 'TODAY':
        return clean === todayDate;
      case 'MONTH': {
        const [y, m] = clean.split('-');
        return y === selectedYear && m === selectedMonth;
      }
      case 'YEAR': {
        const [y] = clean.split('-');
        return y === selectedYear;
      }
      case 'RANGE':
        return clean >= startDate && clean <= endDate;
      default:
        return true;
    }
  };

  const baseClaims = isDirut
    ? allClaims
    : allClaims.filter((c) => c.employeeId === currentUser.id);

  const filteredClaims = baseClaims.filter((c) => {
    if (!isDateMatching(c.transactionDate)) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = c.claimNumber.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const submitter = allEmployees.find((e) => e.id === c.employeeId);
      const matchEmp = submitter?.fullName.toLowerCase().includes(q);
      return matchNum || matchTitle || matchEmp;
    }
    return true;
  });

  // Financial summary metrics
  const totalAmount = filteredClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingClaims = filteredClaims.filter(
    (c) => c.status === 'Menunggu Persetujuan Manager' || c.status === 'Menunggu Verifikasi Finance'
  );
  const pendingAmount = pendingClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const readyToPayClaims = filteredClaims.filter((c) => c.status === 'Siap Dibayar');
  const readyToPayAmount = readyToPayClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const paidClaims = filteredClaims.filter((c) => c.status === 'Dibayar');
  const paidAmount = paidClaims.reduce((acc, curr) => acc + curr.amount, 0);

  // Export handlers
  const handleExportExcel = () => {
    let title = 'Rekap Pengeluaran & Reimbursement';
    if (dateFilterType === 'MONTH') title += ` - Bulan ${selectedMonth}/${selectedYear}`;
    else if (dateFilterType === 'YEAR') title += ` - Tahun ${selectedYear}`;
    else if (dateFilterType === 'TODAY') title += ` - Tanggal ${todayDate}`;
    else if (dateFilterType === 'RANGE') title += ` - Periode ${startDate} s/d ${endDate}`;
    exportReimbursementsToExcel(filteredClaims, allEmployees, title);
  };

  const handleExportPDF = () => {
    let title = 'Laporan Rekap Pengeluaran & Reimbursement';
    if (dateFilterType === 'MONTH') title += ` - Bulan ${selectedMonth}/${selectedYear}`;
    else if (dateFilterType === 'YEAR') title += ` - Tahun ${selectedYear}`;
    else if (dateFilterType === 'TODAY') title += ` - Tanggal ${todayDate}`;
    else if (dateFilterType === 'RANGE') title += ` - Periode ${startDate} s/d ${endDate}`;
    exportReimbursementsToPDF(filteredClaims, allEmployees, title);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isDirut ? 'Rekap Pengeluaran & Reimbursement' : 'Catatan Reimbursement Saya'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isDirut
                ? 'Laporan dan rekapitulasi seluruh pengeluaran operasional & nota klaim staf kantor.'
                : 'Pencatatan pengeluaran operasional dinas untuk diganti kantor.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              disabled={filteredClaims.length === 0}
              className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={filteredClaims.length === 0}
              className="px-3.5 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {!isDirut && (
              <Link
                href="/reimbursements/new"
                className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold rounded text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catat Baru</span>
              </Link>
            )}
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Pengeluaran (Tersaring)
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(totalAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {filteredClaims.length} nota transaksi
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
              Menunggu Review Dirut
            </span>
            <div className="text-base sm:text-xl font-bold text-amber-600 mt-1">
              {formatRupiah(pendingAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {pendingClaims.length} klaim dalam review
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">
              Siap Ditransfer (Disetujui)
            </span>
            <div className="text-base sm:text-xl font-bold text-sky-600 mt-1">
              {formatRupiah(readyToPayAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {readyToPayClaims.length} klaim siap cair
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Sudah Ditransfer / Lunas
            </span>
            <div className="text-base sm:text-xl font-bold text-emerald-600 mt-1">
              {formatRupiah(paidAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {paidClaims.length} klaim lunas
            </p>
          </div>
        </div>

        {/* Date Filter & Options */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Filter Periode:</span>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'TODAY', 'MONTH', 'YEAR', 'RANGE'] as DateFilterType[]).map((type) => {
                  const labels: Record<DateFilterType, string> = {
                    ALL: 'Semua',
                    TODAY: 'Hari Ini',
                    MONTH: 'Bulan Ini',
                    YEAR: 'Tahun Ini',
                    RANGE: 'Rentang Tanggal',
                  };
                  const active = dateFilterType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setDateFilterType(type)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        active
                          ? 'bg-[#0f172a] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-controls based on filter */}
            {dateFilterType === 'MONTH' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs border border-slate-200 rounded p-1.5 bg-slate-50 font-medium"
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
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs border border-slate-200 rounded p-1.5 bg-slate-50 font-medium"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {dateFilterType === 'YEAR' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs border border-slate-200 rounded p-1.5 bg-slate-50 font-medium"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {dateFilterType === 'RANGE' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-slate-200 rounded p-1.5 bg-slate-50 font-medium"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-slate-200 rounded p-1.5 bg-slate-50 font-medium"
                />
              </div>
            )}
          </div>

          {/* Secondary Filters: Status, Kategori & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded p-2 bg-slate-50 text-slate-800"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Menunggu Persetujuan Manager">Menunggu Persetujuan</option>
                  <option value="Siap Dibayar">Siap Dibayar / Ditransfer</option>
                  <option value="Dibayar">Lunas / Ditransfer</option>
                  <option value="Ditolak Manager">Ditolak</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="w-full sm:w-44">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded p-2 bg-slate-50 text-slate-800"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Transportasi">Transportasi</option>
                  <option value="Makan">Makan</option>
                  <option value="Akomodasi">Akomodasi</option>
                  <option value="Perlengkapan Kantor">Perlengkapan Kantor</option>
                  <option value="Komunikasi">Komunikasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari keperluan, nota, staf..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">No. Klaim &amp; Keperluan</th>
                  {isDirut && <th className="px-4 py-3">Pegawai</th>}
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Tgl Transaksi</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={isDirut ? 7 : 6}
                      className="px-6 py-12 text-center text-xs text-slate-400"
                    >
                      Memuat rekapan reimbursement dari database...
                    </td>
                  </tr>
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isDirut ? 7 : 6}
                      className="px-6 py-12 text-center text-xs text-slate-400 italic"
                    >
                      Belum ada catatan reimbursement yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => {
                    const submitter = allEmployees.find((e) => e.id === claim.employeeId);
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          <Link
                            href={`/reimbursements/${claim.id}`}
                            className="font-mono text-indigo-600 hover:text-indigo-800 block text-xs"
                          >
                            {claim.claimNumber}
                          </Link>
                          <span className="text-slate-800 block truncate max-w-xs font-semibold mt-0.5">
                            {claim.title}
                          </span>
                        </td>
                        {isDirut && (
                          <td className="px-4 py-3.5 text-slate-700">
                            <span className="font-semibold block">{submitter?.fullName || 'Karyawan'}</span>
                            <span className="text-[10px] text-slate-400">
                              {submitter?.department || '-'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-slate-600">{claim.category}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {formatDateIndo(claim.transactionDate)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(claim.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/reimbursements/${claim.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                          >
                            <span>Detail</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
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
    </AppShell>
  );
}
