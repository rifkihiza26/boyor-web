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
import { StatusBadge, AccountStatusBadge } from '@/components/ui/StatusBadge';
import {
  CheckSquare,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Receipt,
  Clock,
  Phone,
  Mail,
  Briefcase,
  UserX,
  Trash2,
} from 'lucide-react';

export default function ApprovalsPage() {
  const { currentUser, allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'CLAIMS'>('ACCOUNTS');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [allClaims, setAllClaims] = useState<ReimbursementClaim[]>([]);

  // Modal states for claim decision
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [claimActionType, setClaimActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const fetchClaims = useCallback(async () => {
    const data = await SupabaseService.getClaims();
    setAllClaims(data);
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Pending Accounts
  const pendingEmployees = allEmployees.filter((e) => e.accountStatus === 'PENDING');

  // Pending Claims
  const pendingApprovals = allClaims.filter(
    (c) => c.status === 'Menunggu Persetujuan Manager'
  );

  const filteredClaims = pendingApprovals.filter((c) => {
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

  const totalPendingAmount = pendingApprovals.reduce((acc, curr) => acc + curr.amount, 0);

  // Account Approval Actions
  const handleApproveAccount = async (employeeId: string, fullName: string) => {
    const res = await SupabaseService.approveEmployee(employeeId);
    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleRejectAccount = async (employeeId: string, fullName: string) => {
    if (confirm(`Apakah Anda yakin ingin menolak pendaftaran akun ${fullName}?`)) {
      const res = await SupabaseService.rejectEmployee(employeeId);
      if (res.success) {
        showToast(res.message, 'info');
        refreshData();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const handleDeleteAccount = async (employeeId: string, fullName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun pegawai ${fullName} secara permanen? Data akun dan pendaftaran akan dihapus.`)) {
      const res = await SupabaseService.deleteEmployee(employeeId);
      if (res.success) {
        showToast(res.message || `Akun ${fullName} berhasil dihapus.`, 'success');
        refreshData();
      } else {
        showToast(res.message || 'Gagal menghapus akun.', 'error');
      }
    }
  };

  // Claim Decision Submit
  const handleClaimDecisionSubmit = async () => {
    if (!activeClaimId || !claimActionType) return;

    if (claimActionType === 'APPROVE') {
      const res = await SupabaseService.dirutQuickApprove(activeClaimId, currentUser, decisionNote);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        closeClaimModal();
        await fetchClaims();
      } else {
        showToast(res.message, 'error');
      }
    } else if (claimActionType === 'REJECT') {
      if (!decisionNote.trim()) {
        showToast('Alasan penolakan wajib diisi!', 'error');
        return;
      }
      const res = await SupabaseService.managerReject(activeClaimId, currentUser, decisionNote);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
        closeClaimModal();
        await fetchClaims();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const openClaimModal = (claimId: string, type: 'APPROVE' | 'REJECT') => {
    setActiveClaimId(claimId);
    setClaimActionType(type);
    setDecisionNote(
      type === 'APPROVE' ? 'Disetujui. Pengeluaran relevan dengan agenda operasional tim.' : ''
    );
  };

  const closeClaimModal = () => {
    setActiveClaimId(null);
    setClaimActionType(null);
    setDecisionNote('');
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Pusat Persetujuan Atasan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola persetujuan akun pendaftaran pegawai baru dan klaim biaya operasional tim.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                Total Menunggu
              </span>
              <span className="text-sm font-bold text-slate-800">
                {pendingEmployees.length} Akun • {pendingApprovals.length} Klaim
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'ACCOUNTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Pendaftaran Akun Pegawai</span>
            {pendingEmployees.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingEmployees.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CLAIMS')}
            className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'CLAIMS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Klaim Reimbursement</span>
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PERSATUJUAN AKUN PEGAWAI */}
        {activeTab === 'ACCOUNTS' && (
          <div className="space-y-4">
            <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950">
                <p className="font-semibold">Mekanisme Verifikasi Pegawai Baru</p>
                <p className="mt-0.5 text-indigo-800 leading-relaxed">
                  Pegawai yang baru mendaftar mandiri berstatus <strong>Menunggu Persetujuan</strong> dan belum bisa login atau absen.
                  Klik <strong>Setujui Akun</strong> untuk mengaktifkan akun pegawai sehingga dapat langsung check-in.
                </p>
              </div>
            </div>

            {pendingEmployees.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Tidak Ada Pendaftaran Akun yang Tertunda
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Semua pegawai yang mendaftar telah disetujui atau belum ada pendaftaran baru.
                </p>
                <div className="mt-5">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition"
                  >
                    Simulasi: Coba Daftarkan Pegawai Baru
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">
                              {emp.fullName}
                            </h3>
                            <span className="text-[11px] font-mono text-slate-400">
                              {emp.employeeCode}
                            </span>
                          </div>
                        </div>
                        <AccountStatusBadge status={emp.accountStatus} />
                      </div>

                      <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {emp.jobTitle && emp.jobTitle !== '-'
                              ? `${emp.jobTitle} • ${emp.department}`
                              : emp.department || 'Staf / Umum'}
                          </span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveAccount(emp.id, emp.fullName)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Setujui Akun</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectAccount(emp.id, emp.fullName)}
                        className="py-2 px-3 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Tolak Pendaftaran"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(emp.id, emp.fullName)}
                        className="py-2 px-2.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Hapus Akun Permanen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PERSATUJUAN KLAIM REIMBURSEMENT */}
        {activeTab === 'CLAIMS' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor klaim, nama anggota tim, atau keperluan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

            {/* Claims Table / List */}
            {filteredClaims.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Antrean Klaim Bersih!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Tidak ada pengajuan reimbursement yang membutuhkan persetujuan manager saat ini.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-semibold">No. Klaim &amp; Judul</th>
                        <th className="px-6 py-3 font-semibold">Pengaju</th>
                        <th className="px-6 py-3 font-semibold">Kategori</th>
                        <th className="px-6 py-3 font-semibold">Tanggal Nota</th>
                        <th className="px-6 py-3 font-semibold text-right">Nominal</th>
                        <th className="px-6 py-3 font-semibold text-center">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClaims.map((claim) => {
                        const submitter = allEmployees.find((e) => e.id === claim.employeeId);
                        return (
                          <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-4">
                              <Link
                                href={`/reimbursements/${claim.id}`}
                                className="font-semibold text-indigo-600 hover:text-indigo-800 block"
                              >
                                {claim.claimNumber}
                              </Link>
                              <span className="text-slate-800 font-medium block truncate max-w-xs mt-0.5">
                                {claim.title}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-slate-900 block">
                                {submitter?.fullName || 'Karyawan'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {submitter?.jobTitle}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{claim.category}</td>
                            <td className="px-6 py-4 text-slate-600">
                              {formatDateIndo(claim.transactionDate)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(claim.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openClaimModal(claim.id, 'APPROVE')}
                                  title="Setujui Klaim"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openClaimModal(claim.id, 'REJECT')}
                                  title="Tolak Klaim"
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <Link
                                  href={`/reimbursements/${claim.id}`}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                                >
                                  Detail
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Decision for Claim */}
        <Modal
          isOpen={!!activeClaimId}
          onClose={closeClaimModal}
          title={
            claimActionType === 'APPROVE'
              ? 'Persetujuan Klaim Reimbursement'
              : 'Penolakan Klaim Reimbursement'
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              {claimActionType === 'APPROVE'
                ? 'Anda akan menyetujui klaim ini untuk diteruskan ke proses verifikasi Tim Finance.'
                : 'Silakan berikan alasan penolakan secara jelas agar dapat ditinjau oleh pemohon.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Catatan / Justifikasi {claimActionType === 'REJECT' && '*'}
              </label>
              <textarea
                rows={3}
                required={claimActionType === 'REJECT'}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder={
                  claimActionType === 'APPROVE'
                    ? 'Catatan opsional persetujuan...'
                    : 'Wajib: Jelaskan alasan penolakan klaim ini...'
                }
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeClaimModal}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClaimDecisionSubmit}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition cursor-pointer ${
                  claimActionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {claimActionType === 'APPROVE' ? 'Ya, Setujui' : 'Tolak Klaim'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
