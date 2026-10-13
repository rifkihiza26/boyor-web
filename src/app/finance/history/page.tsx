'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { Search, History, CheckCircle2 } from 'lucide-react';

export default function FinanceHistoryPage() {
  const { allEmployees } = useAuth();
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  useEffect(() => {
    SupabaseService.getClaims().then(setClaims);
  }, []);

  const paidClaims = claims.filter((c) => c.status === 'Dibayar');

  const filtered = paidClaims.filter((c) => {
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

  const totalPaid = paidClaims.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Riwayat Pembayaran &amp; Pencairan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Catatan seluruh klaim reimbursement yang telah berhasil ditransfer ke karyawan.
            </p>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-left sm:text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Dana Dicairkan
            </span>
            <span className="text-lg font-bold text-emerald-600">
              {formatRupiah(totalPaid)} ({paidClaims.length} Transaksi)
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            {filtered.length} pembayaran tercatat dalam arsip
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor klaim, karyawan, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Paid History Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">No. Klaim</th>
                  <th className="px-6 py-3 font-semibold">Karyawan</th>
                  <th className="px-6 py-3 font-semibold">Pengeluaran</th>
                  <th className="px-6 py-3 font-semibold">Waktu Pencairan</th>
                  <th className="px-6 py-3 font-semibold">Metode &amp; Catatan</th>
                  <th className="px-6 py-3 font-semibold">Nominal</th>
                  <th className="px-6 py-3 font-semibold text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500 italic"
                    >
                      Belum ada catatan riwayat pembayaran.
                    </td>
                  </tr>
                ) : (
                  filtered.map((clm) => {
                    const submitter = allEmployees.find((e) => e.id === clm.employeeId);
                    return (
                      <tr key={clm.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-mono font-medium text-slate-800">
                          {clm.claimNumber}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          <div>{submitter?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {submitter?.department}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-800 max-w-xs truncate font-medium">
                          {clm.title}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 font-medium">
                          {clm.paymentDetails?.paidAt || '-'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {clm.paymentDetails?.method || 'Transfer Bank'}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {clm.paymentDetails?.note || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-emerald-700 text-sm">
                          {formatRupiah(clm.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/reimbursements/${clm.id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs"
                          >
                            Detail
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
