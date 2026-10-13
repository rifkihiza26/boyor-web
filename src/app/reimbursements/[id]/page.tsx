'use client';

import React, { useState, Suspense, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '@/lib/formatters';
import { StatusBadge, RoleBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Send,
  MessageSquare,
} from 'lucide-react';

export default function ClaimDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center text-sm text-slate-500">
          Memuat rincian klaim...
        </div>
      }
    >
      <ClaimDetailContent />
    </Suspense>
  );
}

function ClaimDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, role, allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();

  const claimId = params.id as string;
  const [claim, setClaim] = useState<ReimbursementClaim | null | undefined>(undefined);

  const fetchClaim = useCallback(async () => {
    const data = await SupabaseService.getClaimById(claimId);
    setClaim(data);
  }, [claimId]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  const submitter = allEmployees.find((e) => e.id === claim?.employeeId);

  // Decision Modal States
  const [managerAction, setManagerAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [managerNoteInput, setManagerNoteInput] = useState('');
  const [financeAction, setFinanceAction] = useState<'REVISION' | 'APPROVE' | null>(null);
  const [financeNoteInput, setFinanceNoteInput] = useState('');

  // Payment Recording Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState('2026-10-12 14:00');
  const [paymentMethod, setPaymentMethod] = useState<'Transfer Bank' | 'Tunai'>('Transfer Bank');
  const [paymentNote, setPaymentNote] = useState('Transfer ke rekening payroll karyawan.');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (claim === undefined) {
    return (
      <AppShell>
        <div className="text-center text-sm text-slate-400 py-16">Memuat rincian klaim...</div>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell>
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Klaim Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">
            Klaim dengan ID <code>{claimId}</code> tidak ditemukan.
          </p>
          <Link
            href="/reimbursements"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
          >
            Kembali ke Daftar Klaim
          </Link>
        </div>
      </AppShell>
    );
  }

  // Action Handlers
  const handleSubmitDraft = async () => {
    const res = await SupabaseService.updateClaimAndResubmit(claim.id, {}, currentUser);
    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
      await fetchClaim();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleManagerDecision = async () => {
    if (managerAction === 'APPROVE') {
      const res = await SupabaseService.managerApprove(claim.id, currentUser, managerNoteInput);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        setManagerAction(null);
        await fetchClaim();
      } else {
        showToast(res.message, 'error');
      }
    } else if (managerAction === 'REJECT') {
      if (!managerNoteInput.trim()) {
        showToast('Alasan penolakan wajib diisi!', 'error');
        return;
      }
      const res = await SupabaseService.managerReject(claim.id, currentUser, managerNoteInput);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        setManagerAction(null);
        await fetchClaim();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const handleFinanceDecision = async () => {
    if (financeAction === 'REVISION') {
      if (!financeNoteInput.trim()) {
        showToast('Catatan permintaan revisi wajib diisi!', 'error');
        return;
      }
      const res = await SupabaseService.financeRequestRevision(claim.id, currentUser, financeNoteInput);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        setFinanceAction(null);
        await fetchClaim();
      } else {
        showToast(res.message, 'error');
      }
    } else if (financeAction === 'APPROVE') {
      const res = await SupabaseService.financeApproveForPayment(claim.id, currentUser, financeNoteInput);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        setFinanceAction(null);
        await fetchClaim();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const handleRecordPayment = async () => {
    const res = await SupabaseService.recordPayment(claim.id, currentUser, paymentMethod, paymentNote);
    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
      setIsPaymentModalOpen(false);
      await fetchClaim();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/reimbursements"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">ID: {claim.id}</span>
            <StatusBadge status={claim.status} />
          </div>
        </div>

        {/* Status Callout Banners if Rejected or Needs Revision */}
        {claim.status === 'Ditolak Manager' && claim.managerNote && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Klaim Ditolak oleh Manager
              </h3>
              <p className="text-sm font-medium mt-1">&ldquo;{claim.managerNote}&rdquo;</p>
            </div>
          </div>
        )}

        {claim.status === 'Perlu Revisi Finance' && claim.financeNote && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Catatan Permintaan Revisi dari Finance
              </h3>
              <p className="text-sm font-medium mt-1">&ldquo;{claim.financeNote}&rdquo;</p>
              <p className="text-xs text-amber-700 mt-1">
                Karyawan diharapkan melengkapi dokumen atau memperjelas rincian pengeluaran.
              </p>
            </div>
          </div>
        )}

        {claim.status === 'Dibayar' && claim.paymentDetails && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Pembayaran Telah Diselesaikan
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Dicatat pada: <strong>{claim.paymentDetails.paidAt}</strong> melalui metode{' '}
                <strong>{claim.paymentDetails.method}</strong>
                {claim.paymentDetails.disbursedBy ? ` oleh ${claim.paymentDetails.disbursedBy}` : ''}.
              </p>
              {claim.paymentDetails.note && (
                <p className="text-xs text-emerald-900 font-mono mt-0.5">
                  Ref/Ket: {claim.paymentDetails.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Claim Main Information Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {claim.claimNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{claim.category}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 mt-1">{claim.title}</h1>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Total Nominal</span>
              <span className="text-2xl font-black text-slate-900">
                {formatRupiah(claim.amount)}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40">
            {/* Submitter & Bank Info */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Informasi Pengaju
              </h2>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-semibold text-slate-800">
                    {submitter?.fullName || claim.employeeId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Karyawan:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {submitter?.employeeCode || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departemen:</span>
                  <span className="font-medium text-slate-700">
                    {submitter?.department || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rekening Tujuan:</span>
                  <span className="font-medium text-slate-700">
                    {submitter?.bankAccount
                      ? `${submitter.bankAccount.bankName} - ${submitter.bankAccount.accountNumber} (a/n ${submitter.bankAccount.accountHolder})`
                      : 'BCA 882910283'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Date & File */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rincian &amp; Bukti Transaksi
              </h2>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Transaksi:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateIndo(claim.transactionDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Diajukan:</span>
                  <span className="font-medium text-slate-800">
                    {claim.submittedAt ? formatDateTimeIndo(claim.submittedAt) : 'Masih Draft'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      {claim.attachmentName || 'bukti_transaksi.jpg'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded transition shrink-0"
                  >
                    Lihat Bukti Foto
                  </button>
                </div>
                {claim.attachmentUrl && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="block w-full overflow-hidden rounded border border-slate-200 hover:opacity-90 transition text-left"
                    >
                      <img
                        src={claim.attachmentUrl}
                        alt="Bukti Transfer"
                        className="w-full h-32 object-cover object-center"
                      />
                      <span className="block p-1.5 text-[10px] text-center text-slate-500 bg-slate-50 font-medium">
                        Klik untuk memperbesar foto
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-6 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Deskripsi Pengeluaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {claim.description}
            </p>
          </div>

          {/* STREAMLINED ACTION TOOLBAR FOR DIRUT & EMPLOYEE */}
          <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200">
            {/* Draft Submission by Employee */}
            {role === 'EMPLOYEE' &&
              claim.status === 'Draft' &&
              claim.employeeId === currentUser.id && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Draft pengajuan Anda belum dikirim ke Dirut.</span>
                  <button
                    type="button"
                    onClick={handleSubmitDraft}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Pengajuan ke Dirut
                  </button>
                </div>
              )}

            {/* Dirut / Management Actions */}
            {(role === 'DIRUT' || role === 'ADMIN_HR' || role === 'MANAGER' || role === 'FINANCE') && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Tindakan Direktur Utama (Dirut)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Status klaim saat ini: <strong className="text-slate-800">{claim.status}</strong>
                    </p>
                  </div>

                  {/* Transfer Destination Info Badge */}
                  <div className="text-right text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
                    <span className="text-slate-400 block text-[10px]">Tujuan Transfer:</span>
                    <strong className="font-mono text-indigo-700">
                      {submitter?.bankAccount
                        ? `${submitter.bankAccount.bankName} ${submitter.bankAccount.accountNumber}`
                        : 'BCA (Payroll Karyawan)'}
                    </strong>
                  </div>
                </div>

                {/* State 1: Menunggu Persetujuan */}
                {(claim.status === 'Menunggu Persetujuan Manager' ||
                  claim.status === 'Menunggu Verifikasi Finance') && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await SupabaseService.dirutQuickApprove(claim.id, currentUser);
                        if (res.success) {
                          showToast(res.message, 'success');
                          refreshData();
                          await fetchClaim();
                        } else {
                          showToast(res.message, 'error');
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Setujui Klaim (Siap Transfer)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManagerAction('REJECT');
                        setManagerNoteInput('');
                      }}
                      className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak Pengajuan
                    </button>
                  </div>
                )}

                {/* State 2: Siap Dibayar / Ditransfer */}
                {claim.status === 'Siap Dibayar' && (
                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-sky-950">
                      <p className="font-bold">Klaim Telah Disetujui &amp; Siap Dicairkan</p>
                      <p className="text-sky-800 mt-0.5">
                        Silakan transfer dana ke rekening pemohon sebesar <strong>{formatRupiah(claim.amount)}</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      Tandai Sudah Ditransfer (Cair)
                    </button>
                  </div>
                )}

                {/* State 3: Sudah Dibayar / Lunas */}
                {claim.status === 'Dibayar' && claim.paymentDetails && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900">
                        Klaim Lunas &amp; Telah Ditransfer pada {claim.paymentDetails.paidAt} WIB
                      </p>
                      <p className="text-emerald-800 mt-0.5">
                        Metode: {claim.paymentDetails.method} • {claim.paymentDetails.note || 'Transfer payroll sukses.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Riwayat Aktivitas &amp; Jejak Audit Alur Kerja
          </h2>

          <div className="space-y-4">
            {(!claim.activities || claim.activities.length === 0) ? (
              <p className="text-xs text-slate-400 italic">Belum ada riwayat aktivitas tercatat.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {claim.activities.map((act) => (
                  <div key={act.id} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.action}</span>
                        <RoleBadge role={act.actorRole} />
                        <span className="text-[11px] text-slate-400">
                          {formatDateTimeIndo(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Oleh: <strong>{act.actorName}</strong>
                      </p>
                      {act.note && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1.5">
                          &ldquo;{act.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL: Manager Decision */}
        <Modal
          isOpen={managerAction !== null}
          onClose={() => setManagerAction(null)}
          title={
            managerAction === 'APPROVE'
              ? 'Setujui Pengajuan Klaim'
              : 'Tolak Pengajuan Klaim'
          }
          description={
            managerAction === 'APPROVE'
              ? 'Klaim akan diteruskan ke antrean verifikasi Finance.'
              : 'Berikan alasan penolakan yang jelas agar karyawan memahami kendalanya.'
          }
          footer={
            <>
              <button
                type="button"
                onClick={() => setManagerAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleManagerDecision}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${
                  managerAction === 'APPROVE'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {managerAction === 'APPROVE' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
              </button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {managerAction === 'APPROVE'
                ? 'Catatan Persetujuan (Opsional)'
                : 'Alasan Penolakan (Wajib) *'}
            </label>
            <textarea
              rows={3}
              value={managerNoteInput}
              onChange={(e) => setManagerNoteInput(e.target.value)}
              placeholder={
                managerAction === 'APPROVE'
                  ? 'Contoh: Disetujui, sesuai rencana kerja.'
                  : 'Contoh: Nota tidak mencantumkan stempel toko atau rincian item.'
              }
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Modal>

        {/* MODAL: Finance Decision */}
        <Modal
          isOpen={financeAction !== null}
          onClose={() => setFinanceAction(null)}
          title={
            financeAction === 'REVISION'
              ? 'Minta Revisi Klaim ke Karyawan'
              : 'Verifikasi Klaim untuk Pembayaran'
          }
          description={
            financeAction === 'REVISION'
              ? 'Tuliskan catatan detail rincian apa yang harus diperbaiki.'
              : 'Klaim akan ditandai Siap Dibayar dan masuk ke antrean pencairan kas/transfer.'
          }
          footer={
            <>
              <button
                type="button"
                onClick={() => setFinanceAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFinanceDecision}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${
                  financeAction === 'APPROVE'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {financeAction === 'APPROVE'
                  ? 'Konfirmasi Siap Dibayar'
                  : 'Kirim Permintaan Revisi'}
              </button>
            </>
          }
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {financeAction === 'APPROVE'
                ? 'Catatan Verifikasi (Opsional)'
                : 'Catatan Revisi untuk Karyawan (Wajib) *'}
            </label>
            <textarea
              rows={3}
              value={financeNoteInput}
              onChange={(e) => setFinanceNoteInput(e.target.value)}
              placeholder="Tuliskan catatan verifikasi atau permintaan revisi..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </Modal>

        {/* MODAL: Record Payment */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Catat Pembayaran Reimbursement"
          description={`Pengeluaran: ${claim.title} sebesar ${formatRupiah(claim.amount)}.`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                Simpan &amp; Tandai Dibayar
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal &amp; Waktu Pembayaran *
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
                Nomor Referensi / Catatan Pencairan
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Contoh: Transfer via BCA Bisnis Ref: TRX-8849201"
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </Modal>

        {/* Modal Lihat Bukti Foto */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Bukti Transaksi - ${claim.claimNumber}`}
          description={claim.attachmentName || 'Bukti Struk / Nota Transfer'}
          footer={
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-slate-500 font-mono">
                {formatRupiah(claim.amount)} • {claim.category}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded transition cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center p-2 bg-slate-100 rounded-lg max-h-[70vh] overflow-auto">
            {claim.attachmentUrl ? (
              <img
                src={claim.attachmentUrl}
                alt="Bukti Transaksi"
                className="max-h-[60vh] max-w-full object-contain rounded shadow-xs"
              />
            ) : (
              <div className="py-12 px-6 text-center text-slate-500 space-y-2">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  {claim.attachmentName || 'bukti_nota.pdf'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  File ini berformat dokumen atau belum memiliki thumbnail langsung. Anda dapat melihat informasi file pada nama lampiran di atas.
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
