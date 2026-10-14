'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { AttendanceRecord, ReimbursementClaim } from '@/types';
import { formatRupiah, formatDateIndo, formatDurationMinutes, getTodayDateStr } from '@/lib/formatters';
import { StatusBadge, AttendanceBadge, AccountStatusBadge } from '@/components/ui/StatusBadge';
import {
  Clock,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Users,
  CreditCard,
  Building2,
  ArrowRight,
  TrendingUp,
  Search,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, role, settings, allEmployees, refreshData } = useAuth();
  const { showToast } = useToast();

  const [dirutTab, setDirutTab] = useState<'ATTENDANCE' | 'REIMBURSEMENT' | 'ACCOUNTS'>('ATTENDANCE');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [myTodayAtt, setMyTodayAtt] = useState<AttendanceRecord | null>(null);

  const fetchDashboardData = useCallback(async () => {
    const [att, clm] = await Promise.all([
      SupabaseService.getAttendanceHistory(),
      SupabaseService.getClaims(),
    ]);
    setAttendanceRecords(att);
    setClaims(clm);

    if (currentUser.id) {
      const today = await SupabaseService.getTodayAttendance(currentUser.id);
      setMyTodayAtt(today);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Employee specific metrics
  const myClaims = claims.filter((c) => c.employeeId === currentUser.id);
  const myPendingClaims = myClaims.filter(
    (c) =>
      c.status === 'Menunggu Persetujuan Manager' ||
      c.status === 'Menunggu Verifikasi Finance' ||
      c.status === 'Perlu Revisi Finance'
  );
  const myTotalAmount = myClaims.reduce((acc, curr) => acc + curr.amount, 0);

  // Dirut & Management metrics
  const activeEmployees = allEmployees.filter((e) => e.isActive);
  const todayStr = getTodayDateStr();
  const todayAttAll = attendanceRecords.filter((a) => a.date === todayStr);
  const presentCount = todayAttAll.filter(
    (a) => a.status === 'SEDANG_BEKERJA' || a.status === 'SELESAI'
  ).length;
  const lateCount = todayAttAll.filter((a) => a.isLate).length;
  const notCheckedInCount = Math.max(0, activeEmployees.length - presentCount);

  // Claims summary for Dirut
  const pendingApprovalsAll = claims.filter(
    (c) => c.status === 'Menunggu Persetujuan Manager' || c.status === 'Menunggu Verifikasi Finance'
  );
  const readyToPayClaims = claims.filter((c) => c.status === 'Siap Dibayar');
  const readyToPayAmount = readyToPayClaims.reduce((acc, curr) => acc + curr.amount, 0);
  const totalClaimsAmountAll = claims.reduce((acc, curr) => acc + curr.amount, 0);

  // Pending Accounts to approve
  const pendingAccounts = allEmployees.filter((e) => e.accountStatus === 'PENDING');

  const filteredEmployeesForTable = allEmployees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const q = employeeSearch.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q)
    );
  });

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDirutView = mounted && (role === 'DIRUT' || role === 'ADMIN_HR' || role === 'MANAGER' || role === 'FINANCE');

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header Greeting */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                suppressHydrationWarning
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-white"
              >
                {isDirutView ? 'Direksi & Administrasi (Admin)' : 'Portal Karyawan'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">{settings.companyName}</span>
            </div>
            <h1 suppressHydrationWarning className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Selamat Datang, {currentUser.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanggal Operasional: {formatDateIndo(todayStr)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isDirutView ? (
              <>
                <Link
                  href="/attendance"
                  className="px-3.5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold rounded border border-[#0f172a] transition flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  Presensi Masuk/Pulang
                </Link>
                <Link
                  href="/reimbursements/new"
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded transition flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  Ajukan Reimburse
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/approvals"
                  className="px-3.5 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold rounded border border-[#0f172a] transition flex items-center gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  Antrean Persetujuan ({pendingApprovalsAll.length + pendingAccounts.length})
                </Link>
                <Link
                  href="/reports"
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded transition flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  Rekap &amp; Unduh (PDF/Excel)
                </Link>
              </>
            )}
          </div>
        </div>

        {/* PENDING ACCOUNTS BANNER FOR DIRUT */}
        {isDirutView && pendingAccounts.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                !
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950">
                  {pendingAccounts.length} Pendaftaran Akun Pegawai Baru Menunggu Persetujuan
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Pegawai baru telah mendaftar dan membutuhkan persetujuan Anda agar akun aktif untuk melakukan presensi.
                </p>
              </div>
            </div>
            <Link
              href="/approvals"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Setujui Akun Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. HALAMAN PEGAWAI (SIMPLE & FOKUS ABSENSI & REIMBURSE)         */}
        {/* ============================================================== */}
        {!isDirutView && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Attendance Status Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Status Presensi Hari Ini
                  </span>
                  <AttendanceBadge
                    status={myTodayAtt?.status || 'BELUM_CHECK_IN'}
                    isLate={myTodayAtt?.isLate}
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {myTodayAtt?.checkInAt ? myTodayAtt.checkInAt : '--:--'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {myTodayAtt?.checkOutAt ? `• Pulang: ${myTodayAtt.checkOutAt}` : '• Belum Checkout'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {myTodayAtt?.isLate
                    ? 'Terlambat check-in melewati jam toleransi'
                    : myTodayAtt?.checkInAt
                    ? 'Tepat waktu sesuai jadwal'
                    : 'Belum melakukan check-in hari ini'}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/attendance"
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Buka Halaman Presensi <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Reimbursement Claims Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Klaim Reimbursement Anda
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    {myPendingClaims.length} Menunggu
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatRupiah(myTotalAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Total dari {myClaims.length} pengajuan klaim Anda
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/reimbursements"
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    Lihat Semua Klaim <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Working Schedule Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-3">
                  Jadwal Kerja Kantor
                </span>
                <div className="text-2xl font-bold text-slate-900">
                  {settings.workStartTime} - {settings.workEndTime} WIB
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Toleransi keterlambatan: {settings.lateToleranceMinutes} menit
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {settings.officeName}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Reimbursement Submissions Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm">Riwayat Klaim Terakhir Anda</h2>
                <Link
                  href="/reimbursements"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Lihat Semua →
                </Link>
              </div>

              {myClaims.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Belum ada pengajuan reimbursement. Klik tombol &ldquo;Ajukan Reimburse&rdquo; untuk mengajukan biaya dinas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-semibold">No. Klaim</th>
                        <th className="px-5 py-3 font-semibold">Keperluan</th>
                        <th className="px-5 py-3 font-semibold">Kategori</th>
                        <th className="px-5 py-3 font-semibold text-right">Nominal</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myClaims.slice(0, 5).map((clm) => (
                        <tr key={clm.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3 font-mono font-medium text-indigo-600">
                            <Link href={`/reimbursements/${clm.id}`}>{clm.claimNumber}</Link>
                          </td>
                          <td className="px-5 py-3 text-slate-800 font-medium truncate max-w-xs">
                            {clm.title}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{clm.category}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(clm.amount)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={clm.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. HALAMAN DIREKTUR UTAMA (REKAPAN LENGKAP & DETAIL KONTROL)     */}
        {/* ============================================================== */}
        {isDirutView && (
          <div className="space-y-5">
            {/* 4 Executive Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Presensi Hari Ini */}
              <div className="bg-white p-4 rounded-md border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Kehadiran Hari Ini
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {presentCount} / {activeEmployees.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {notCheckedInCount} belum check-in
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] flex items-center justify-between">
                  <span className="text-rose-700 font-semibold">{lateCount} Terlambat</span>
                  <span className="text-slate-400 font-mono">{todayStr}</span>
                </div>
              </div>

              {/* Total Karyawan */}
              <div className="bg-white p-4 rounded-md border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Pegawai Aktif
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {activeEmployees.length} Staf
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total akun: {allEmployees.length} orang
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
                  <Link href="/employees" className="text-slate-800 font-bold hover:underline">
                    Kelola Database Pegawai →
                  </Link>
                </div>
              </div>

              {/* Antrean Klaim Reimburse */}
              <div className="bg-white p-4 rounded-md border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Antrean Reimbursement
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {pendingApprovalsAll.length} Klaim
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menunggu approval administrasi
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
                  <Link href="/approvals" className="text-slate-800 font-bold hover:underline">
                    Buka Antrean Approval →
                  </Link>
                </div>
              </div>

              {/* Siap Cair / Dana Transfer */}
              <div className="bg-white p-4 rounded-md border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Siap Dibayar
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
                  {formatRupiah(readyToPayAmount)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {readyToPayClaims.length} klaim siap transfer
                </p>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
                  <Link href="/finance/payments" className="text-slate-800 font-bold hover:underline">
                    Daftar Pembayaran →
                  </Link>
                </div>
              </div>
            </div>

            {/* TAB INTERAKTIF REKAP LENGKAP DIRUT */}
            <div className="bg-white rounded-md border border-slate-300 overflow-hidden">
              {/* Tab Header */}
              <div className="px-4 pt-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 bg-slate-100/70">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDirutTab('ATTENDANCE')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      dirutTab === 'ATTENDANCE'
                        ? 'border-slate-900 text-slate-900 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Rekap Presensi Harian</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-mono font-bold">
                      {presentCount}/{activeEmployees.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirutTab('REIMBURSEMENT')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                      dirutTab === 'REIMBURSEMENT'
                        ? 'border-slate-900 text-slate-900 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Rekap Reimbursement</span>
                    {pendingApprovalsAll.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-mono font-bold">
                        {pendingApprovalsAll.length}
                      </span>
                    )}
                  </button>

                  {pendingAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDirutTab('ACCOUNTS')}
                      className={`py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                        dirutTab === 'ACCOUNTS'
                          ? 'border-slate-900 text-slate-900 bg-white'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Akun Baru ({pendingAccounts.length})</span>
                    </button>
                  )}
                </div>

                {dirutTab === 'ATTENDANCE' && (
                  <div className="pb-2 w-full sm:w-64">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter nama staf..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-hidden focus:border-slate-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 1: REKAP PRESENSI HARIAN DIRUT */}
              {dirutTab === 'ATTENDANCE' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">Pegawai</th>
                        <th className="px-4 py-2.5 font-bold">Departemen</th>
                        <th className="px-4 py-2.5 font-bold">Jam Masuk</th>
                        <th className="px-4 py-2.5 font-bold">Jam Pulang</th>
                        <th className="px-4 py-2.5 font-bold">Durasi Kerja</th>
                        <th className="px-4 py-2.5 font-bold">Status Kehadiran</th>
                        <th className="px-4 py-2.5 font-bold">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployeesForTable.map((emp) => {
                        const att = attendanceRecords.find(
                          (a) => a.employeeId === emp.id && a.date === todayStr
                        );
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 sm:px-6 py-3.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                  {emp.fullName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-semibold block">{emp.fullName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {emp.employeeCode}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 text-slate-600">
                              <span>{emp.department || '-'}</span>
                              <span className="text-slate-400 block text-[11px]">
                                {emp.jobTitle && emp.jobTitle !== '-' ? emp.jobTitle : ''}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 font-mono text-slate-700 font-medium">
                              {att?.checkInAt || (
                                <span className="text-slate-300 italic">Belum masuk</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 font-mono text-slate-700">
                              {att?.checkOutAt || (
                                <span className="text-slate-300 italic">-</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 text-slate-700">
                              {att?.totalMinutes ? formatDurationMinutes(att.totalMinutes) : '-'}
                            </td>
                            <td className="px-4 sm:px-6 py-3.5">
                              <AttendanceBadge
                                status={att?.status || 'BELUM_CHECK_IN'}
                                isLate={att?.isLate}
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 text-slate-500">
                              {att?.note ? (
                                att.note
                              ) : att?.isLate ? (
                                <span className="text-rose-600 font-medium">Terlambat masuk</span>
                              ) : att?.checkInAt ? (
                                <span className="text-emerald-600 font-medium">Tepat waktu</span>
                              ) : (
                                <span className="text-slate-400">Belum presensi</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: REKAP REIMBURSEMENT DIRUT */}
              {dirutTab === 'REIMBURSEMENT' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">No. Dokumen &amp; Keperluan</th>
                        <th className="px-4 py-2.5 font-bold">Pegawai</th>
                        <th className="px-4 py-2.5 font-bold">Kategori</th>
                        <th className="px-4 py-2.5 font-bold text-right">Nominal</th>
                        <th className="px-4 py-2.5 font-bold">Status</th>
                        <th className="px-4 py-2.5 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {claims.slice(0, 10).map((clm) => {
                        const submitter = allEmployees.find((e) => e.id === clm.employeeId);
                        return (
                          <tr key={clm.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-2.5">
                              <Link
                                href={`/reimbursements/${clm.id}`}
                                className="font-semibold text-slate-900 hover:text-blue-700 block font-mono"
                              >
                                {clm.claimNumber}
                              </Link>
                              <span className="text-slate-700 font-medium truncate max-w-xs block mt-0.5">
                                {clm.title}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-slate-900 block">
                                {submitter?.fullName || 'Pegawai'}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {submitter?.department}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{clm.category}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(clm.amount)}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={clm.status} />
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Link
                                href={`/reimbursements/${clm.id}`}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded text-xs transition inline-block"
                              >
                                Buka Dokumen
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: AKUN BARU YANG MENUNGGU PERSETUJUAN */}
              {dirutTab === 'ACCOUNTS' && (
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingAccounts.map((pEmp) => (
                    <div
                      key={pEmp.id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 text-sm">{pEmp.fullName}</span>
                          <AccountStatusBadge status={pEmp.accountStatus} />
                        </div>
                        <p className="text-xs text-slate-600">{pEmp.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Divisi: {pEmp.department || 'Umum'} • Jabatan: {pEmp.jobTitle || '-'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await SupabaseService.approveEmployee(pEmp.id);
                            if (res.success) {
                              showToast(res.message, 'success');
                              refreshData();
                              await fetchDashboardData();
                            } else {
                              showToast(res.message, 'error');
                            }
                          }}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Setujui Akun
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Tolak pendaftaran ${pEmp.fullName}?`)) {
                              const res = await SupabaseService.rejectEmployee(pEmp.id);
                              if (res.success) {
                                showToast(res.message, 'info');
                                refreshData();
                                await fetchDashboardData();
                              } else {
                                showToast(res.message, 'error');
                              }
                            }
                          }}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
