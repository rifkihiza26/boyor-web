'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { AttendanceRecord } from '@/types';
import { formatDateIndo, formatDurationMinutes, getTodayDateStr } from '@/lib/formatters';
import { AttendanceBadge } from '@/components/ui/StatusBadge';
import { Clock, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';

export default function AttendancePage() {
  const { currentUser, role, settings } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);

  // Dirut tidak perlu absen - arahkan langsung ke halaman Rekap Presensi
  if (role === 'DIRUT') {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Direktur Utama Tidak Melakukan Presensi Harian</h2>
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            Sebagai Direktur Utama, akun Anda tidak memerlukan absensi mandiri. Anda dapat memantau dan mengunduh seluruh rekapan absensi pegawai di menu Rekap Presensi.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/reports"
              className="px-4 py-2 bg-[#0f172a] text-white rounded-lg text-xs font-semibold hover:bg-[#1e293b] transition"
            >
              Buka Rekap Presensi Pegawai
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const fetchData = useCallback(async () => {
    if (!currentUser.id) return;
    const [today, history] = await Promise.all([
      SupabaseService.getTodayAttendance(currentUser.id),
      SupabaseService.getAttendanceHistory(currentUser.id),
    ]);
    setTodayRecord(today);
    setRecentHistory(history.slice(0, 5));
  }, [currentUser.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    setLoading(true);
    const res = await SupabaseService.checkIn(currentUser.id, settings);
    if (res.success) {
      showToast(res.message, 'success');
      await fetchData();
    } else {
      showToast(res.message, 'error');
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const res = await SupabaseService.checkOut(currentUser.id);
    if (res.success) {
      showToast(res.message, 'success');
      await fetchData();
    } else {
      showToast(res.message, 'error');
    }
    setLoading(false);
  };

  const handleResetToday = async () => {
    if (!confirm('Reset data absensi hari ini agar bisa melakukan check-in ulang?')) return;
    setLoading(true);
    const res = await SupabaseService.resetTodayAttendance(currentUser.id);
    if (res.success) {
      showToast(res.message, 'info');
      await fetchData();
    } else {
      showToast(res.message, 'error');
    }
    setLoading(false);
  };

  const isCheckedIn = todayRecord && todayRecord.status === 'SEDANG_BEKERJA';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Presensi &amp; Absensi Harian</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lakukan pencatatan waktu masuk dan pulang harian karyawan secara mandiri.
          </p>
        </div>

        {/* Main Action Attendance Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>Hari ini: {formatDateIndo(getTodayDateStr())}</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {todayRecord?.status === 'SELESAI'
                ? 'Absensi Hari Ini Selesai'
                : todayRecord?.status === 'SEDANG_BEKERJA'
                ? 'Sesi Kerja Aktif'
                : 'Mulai Presensi Harian'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Buka absen: {settings.checkInStartTime || '07:00'} WIB • Jam kerja: {settings.workStartTime} - {settings.workEndTime} WIB (Toleransi{' '}
              {settings.lateToleranceMinutes} menit)
            </p>
          </div>

          {/* Time Check display - Jika selesai, kembali ke 00:00 standby */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Jam Masuk
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                {todayRecord?.status === 'SEDANG_BEKERJA' && todayRecord?.checkInAt
                  ? todayRecord.checkInAt
                  : '00:00'}
              </span>
              {todayRecord?.status === 'SEDANG_BEKERJA' && todayRecord?.isLate ? (
                <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                  Terlambat
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {todayRecord?.status === 'SEDANG_BEKERJA' ? 'Tepat Waktu' : 'Standby'}
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Jam Pulang
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                00:00
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {todayRecord?.status === 'SEDANG_BEKERJA' ? 'Belum checkout' : 'Standby'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Durasi Kerja
              </span>
              <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
                0 jam 0 mnt
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Standby</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            {!todayRecord || todayRecord.status === 'BELUM_CHECK_IN' ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={loading || !currentUser.id}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-5 h-5" />
                {loading ? 'Menyimpan...' : 'Check-in Sekarang'}
              </button>
            ) : isCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-5 h-5" />
                {loading ? 'Menyimpan Waktu Pulang...' : 'Check-out (Selesai Kerja)'}
              </button>
            ) : (
              <div className="w-full space-y-3">
                <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold w-full flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Presensi hari ini telah lengkap selesai. Kebijakan kantor: 1 hari hanya 1 kali absensi.</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Data kehadiran Anda telah tersimpan otomatis di tabel riwayat di bawah.
                </div>
              </div>
            )}
          </div>

          {/* Validation note */}
          <p className="text-[11px] text-slate-400 mt-4">
            Catatan: Waktu check-in dan check-out dicatat secara real-time berdasarkan jam kerja kantor.
          </p>
        </div>

        {/* Recent Attendance History Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Riwayat Presensi Terakhir Anda</h2>
            <Link
              href="/attendance/history"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              Lihat Riwayat Lengkap <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="px-6 py-3 font-bold">Tanggal</th>
                  <th className="px-6 py-3 font-bold">Check-in</th>
                  <th className="px-6 py-3 font-bold">Check-out</th>
                  <th className="px-6 py-3 font-bold">Durasi</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                      Belum ada riwayat presensi.
                    </td>
                  </tr>
                ) : (
                  recentHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {formatDateIndo(rec.date)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {rec.checkInAt || '-'}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {rec.checkOutAt || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {rec.totalMinutes ? formatDurationMinutes(rec.totalMinutes) : '-'}
                      </td>
                      <td className="px-6 py-3.5">
                        <AttendanceBadge status={rec.status} isLate={rec.isLate} />
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 italic">
                        {rec.note || (rec.isLate ? 'Terlambat masuk' : 'Tepat waktu')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
