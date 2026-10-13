'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
  FileText,
} from 'lucide-react';

export default function ReimbursementsPage() {
  const { currentUser, role, allEmployees } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [allClaims, setAllClaims] = useState<ReimbursementClaim[]>([]);

  const isDirut = role === 'DIRUT' || role === 'ADMIN_HR' || role === 'MANAGER' || role === 'FINANCE';

  const fetchClaims = useCallback(async () => {
    if (!currentUser.id) return;
    const claims = isDirut
      ? await SupabaseService.getClaims()
      : await SupabaseService.getClaims(currentUser.id);
    setAllClaims(claims);
  }, [currentUser.id, isDirut]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const baseClaims = isDirut ? allClaims : allClaims.filter((c) => c.employeeId === currentUser.id);

  const filteredClaims = baseClaims.filter((c) => {
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
  const totalAmount = baseClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingClaims = baseClaims.filter(
    (c) => c.status === 'Menunggu Persetujuan Manager' || c.status === 'Menunggu Verifikasi Finance'
  );
  const pendingAmount = pendingClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const readyToPayClaims = baseClaims.filter((c) => c.status === 'Siap Dibayar');
  const readyToPayAmount = readyToPayClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const paidClaims = baseClaims.filter((c) => c.status === 'Dibayar');
  const paidAmount = paidClaims.reduce((acc, curr) => acc + curr.amount, 0);


  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isDirut ? 'Buku Rekap Pengeluaran & Reimbursement' : 'Catatan Reimbursement Saya'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isDirut
                ? 'Perekapan seluruh pencatatan biaya dan nota pengeluaran operasional seluruh staf.'
                : 'Pencatatan pengeluaran operasional dinas untuk diganti kantor.'}
            </p>
          </div>

          {!isDirut && (
            <Link
              href="/reimbursements/new"
              className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold rounded text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Pengeluaran Baru</span>
            </Link>
          )}
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Pengeluaran Dicatat
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(totalAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {baseClaims.length} nota transaksi
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
              Menunggu Approval Dirut
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
              Sudah Ditransfer / Cair
            </span>
            <div className="text-base sm:text-xl font-bold text-emerald-600 mt-1">
              {formatRupiah(paidAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {paidClaims.length} klaim lunas
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
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
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
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
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold">No. Klaim &amp; Keperluan</th>
                  {isDirut && (
                    <th className="px-4 sm:px-6 py-3 font-semibold">Pegawai</th>
                  )}
                  <th className="px-4 sm:px-6 py-3 font-semibold">Kategori</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Tgl Transaksi</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right">Nominal</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.length === 0 ? (
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
                        <td className="px-4 sm:px-6 py-3.5 font-medium text-slate-900">
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
                          <td className="px-4 sm:px-6 py-3.5 text-slate-700">
                            <span className="font-semibold block">{submitter?.fullName || 'Karyawan'}</span>
                            <span className="text-[10px] text-slate-400">
                              {submitter?.department || '-'}
                            </span>
                          </td>
                        )}
                        <td className="px-4 sm:px-6 py-3.5 text-slate-600">{claim.category}</td>
                        <td className="px-4 sm:px-6 py-3.5 text-slate-600">
                          {formatDateIndo(claim.transactionDate)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(claim.amount)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <Link
                            href={`/reimbursements/${claim.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold text-xs transition"
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
