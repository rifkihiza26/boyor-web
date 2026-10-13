'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { CreditCard, Search, ArrowRight, Building } from 'lucide-react';

export default function FinancePaymentsPage() {
  const { currentUser, allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  // Payment Recording Modal State
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState('2026-10-12 14:00');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Tunai'>('Transfer Bank');
  const [paymentNote, setPaymentNote] = useState('Transfer via Payroll.');

  const fetchClaims = useCallback(async () => {
    const data = await SupabaseService.getClaims();
    setClaims(data);
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const readyToPayClaims = claims.filter((c) => c.status === 'Siap Dibayar');

  const filtered = readyToPayClaims.filter((c) => {
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

  const totalAmount = readyToPayClaims.reduce((acc, curr) => acc + curr.amount, 0);

  const selectedClaim = claims.find((c) => c.id === activeClaimId);
  const selectedSubmitter = allEmployees.find((e) => e.id === selectedClaim?.employeeId);

  const handleExecutePayment = async () => {
    if (!activeClaimId) return;

    const res = await SupabaseService.recordPayment(activeClaimId, currentUser, paymentMethod, paymentNote);

    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
      setActiveClaimId(null);
      await fetchClaims();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Antrean Pembayaran Reimbursement
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Daftar klaim berstatus Siap Dibayar yang siap dieksekusi transfer atau tunai.
            </p>
          </div>
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs text-left sm:text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Siap Dicairkan
            </span>
            <span className="text-lg font-bold text-emerald-600">
              {formatRupiah(totalAmount)} ({readyToPayClaims.length} Klaim)
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            {readyToPayClaims.length} klaim dalam antrean pembayaran
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor klaim atau karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Ready to pay table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">No. Klaim</th>
                  <th className="px-6 py-3 font-semibold">Karyawan Penerima</th>
                  <th className="px-6 py-3 font-semibold">Rekening Bank</th>
                  <th className="px-6 py-3 font-semibold">Pengeluaran</th>
                  <th className="px-6 py-3 font-semibold">Nominal Cair</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500 italic"
                    >
                      Tidak ada antrean pembayaran aktif saat ini.
                    </td>
                  </tr>
                ) : (
                  filtered.map((clm) => {
                    const submitter = allEmployees.find((e) => e.id === clm.employeeId);
                    return (
                      <tr key={clm.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-mono font-medium text-slate-800">
                          <Link
                            href={`/reimbursements/${clm.id}`}
                            className="text-indigo-600 hover:underline font-bold"
                          >
                            {clm.claimNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {submitter?.fullName}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-700">
                          {submitter?.bankAccount
                            ? `${submitter.bankAccount.bankName} - ${submitter.bankAccount.accountNumber}`
                            : 'BCA 882910283'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-800 max-w-xs truncate font-medium">
                          {clm.title}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-emerald-700 text-sm">
                          {formatRupiah(clm.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveClaimId(clm.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition flex items-center gap-1.5 ml-auto"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Catat Pembayaran
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Payment Recording */}
        <Modal
          isOpen={activeClaimId !== null}
          onClose={() => setActiveClaimId(null)}
          title="Catat Transaksi Pembayaran"
          description={
            selectedClaim
              ? `Klaim: ${selectedClaim.title} • Nominal: ${formatRupiah(selectedClaim.amount)}`
              : ''
          }
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveClaimId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                Konfirmasi Pembayaran
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block">Penerima Dana:</span>
              <span className="font-semibold text-slate-800 block text-sm mt-0.5">
                {selectedSubmitter?.fullName}
              </span>
              <span className="text-slate-600 font-mono text-xs block mt-0.5">
                {selectedSubmitter?.bankAccount
                  ? `${selectedSubmitter.bankAccount.bankName} ${selectedSubmitter.bankAccount.accountNumber} a/n ${selectedSubmitter.bankAccount.accountHolder}`
                  : 'BCA 882910283'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Waktu Transaksi / Pembayaran *
              </label>
              <input
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'Transfer Bank' | 'Tunai')
                }
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai">Tunai</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Referensi Transfer / Catatan Finance
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Contoh: No Ref TRX-9901823"
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
