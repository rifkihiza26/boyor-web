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
import { ShieldCheck, MessageSquare, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export default function FinanceVerificationPage() {
  const { currentUser, allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  // Decision Modal State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'REVISION' | 'APPROVE' | null>(null);
  const [financeNote, setFinanceNote] = useState('');

  const fetchClaims = useCallback(async () => {
    const data = await SupabaseService.getClaims();
    setClaims(data);
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const closeModal = () => {
    setSelectedClaimId(null);
    setActionType(null);
    setFinanceNote('');
  };

  const verificationQueue = claims.filter(
    (c) => c.status === 'Menunggu Verifikasi Finance'
  );

  const filtered = verificationQueue.filter((c) => {
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

  const handleDecision = async () => {
    if (!selectedClaimId || !actionType) return;

    if (actionType === 'REVISION') {
      if (!financeNote.trim()) {
        showToast('Catatan permintaan revisi wajib diisi!', 'error');
        return;
      }
      const res = await SupabaseService.financeRequestRevision(selectedClaimId, currentUser, financeNote);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        closeModal();
        await fetchClaims();
      } else {
        showToast(res.message, 'error');
      }
    } else if (actionType === 'APPROVE') {
      const res = await SupabaseService.financeApproveForPayment(selectedClaimId, currentUser, financeNote);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        closeModal();
        await fetchClaims();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const openModal = (claimId: string, type: 'REVISION' | 'APPROVE') => {
    setSelectedClaimId(claimId);
    setActionType(type);
    setFinanceNote(
      type === 'APPROVE'
        ? 'Diverifikasi oleh Finance. Berkas dan rincian valid.'
        : ''
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Verifikasi Klaim Reimbursement
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Periksa kelayakan bukti struk/nota klaim yang telah disetujui Manager sebelum dicairkan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/finance/payments"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              Antrean Pembayaran →
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Menampilkan {filtered.length} dari {verificationQueue.length} klaim dalam antrean
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

        {/* Verification Queue Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">No. Klaim</th>
                  <th className="px-6 py-3 font-semibold">Karyawan</th>
                  <th className="px-6 py-3 font-semibold">Pengeluaran</th>
                  <th className="px-6 py-3 font-semibold">Nominal</th>
                  <th className="px-6 py-3 font-semibold">Catatan Manager</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500 italic"
                    >
                      Tidak ada klaim yang menunggu verifikasi Finance saat ini.
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
                          <div>{submitter?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {submitter?.bankAccount?.bankName} - {submitter?.bankAccount?.accountNumber}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-800 max-w-xs truncate font-medium">
                          {clm.title}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {formatRupiah(clm.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 italic max-w-xs truncate">
                          &ldquo;{clm.managerNote || 'Disetujui.'}&rdquo;
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openModal(clm.id, 'REVISION')}
                              className="px-2.5 py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md font-semibold text-xs transition"
                            >
                              Minta Revisi
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal(clm.id, 'APPROVE')}
                              className="px-3 py-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-xs shadow-2xs transition"
                            >
                              Siap Dibayar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Decision */}
        <Modal
          isOpen={selectedClaimId !== null}
          onClose={closeModal}
          title={
            actionType === 'APPROVE'
              ? 'Verifikasi Klaim (Siap Dibayar)'
              : 'Minta Revisi Dokumen ke Karyawan'
          }
          description={
            actionType === 'APPROVE'
              ? 'Klaim ini dinyatakan valid dan akan masuk ke antrean pencairan dana Finance.'
              : 'Jelaskan kekurangan atau dokumen yang perlu diperbaiki oleh karyawan.'
          }
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDecision}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${
                  actionType === 'APPROVE'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionType === 'APPROVE'
                  ? 'Konfirmasi Siap Dibayar'
                  : 'Kirim Permintaan Revisi'}
              </button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {actionType === 'APPROVE'
                ? 'Catatan Verifikasi (Opsional)'
                : 'Catatan Revisi untuk Karyawan (Wajib) *'}
            </label>
            <textarea
              rows={3}
              value={financeNote}
              onChange={(e) => setFinanceNote(e.target.value)}
              placeholder="Tuliskan catatan verifikasi..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
