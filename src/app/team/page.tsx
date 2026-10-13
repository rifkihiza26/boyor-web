'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { AttendanceRecord, ReimbursementClaim } from '@/types';
import { formatDurationMinutes, formatRupiah, getTodayDateStr } from '@/lib/formatters';
import { AttendanceBadge } from '@/components/ui/StatusBadge';
import { Users, Clock, Receipt, ArrowRight } from 'lucide-react';

export default function TeamSummaryPage() {
  const { allEmployees } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  useEffect(() => {
    Promise.all([
      SupabaseService.getAttendanceHistory(),
      SupabaseService.getClaims(),
    ]).then(([att, clm]) => {
      setAttendanceRecords(att);
      setClaims(clm);
    });
  }, []);

  const todayStr = getTodayDateStr();
  const todayRecords = attendanceRecords.filter((a) => a.date === todayStr);
  const presentEmployees = todayRecords.filter(
    (a) => a.status === 'SEDANG_BEKERJA' || a.status === 'SELESAI'
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ringkasan Tim &amp; Staf</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau kehadiran harian dan riwayat klaim seluruh anggota divisi.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Anggota Tim
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {allEmployees.length} Karyawan
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {allEmployees.filter((e) => e.isActive).length} status aktif
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Hadir Hari Ini
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {presentEmployees.length} Hadir
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              {allEmployees.filter((e) => e.isActive).length - presentEmployees.length} belum
              check-in
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Keterlambatan Hari Ini
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {todayRecords.filter((a) => a.isLate).length} Karyawan
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Toleransi kantor: 15 menit</span>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Status Kehadiran &amp; Klaim Per Karyawan</h2>
            <Link
              href="/attendance/history"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Riwayat Lengkap →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Karyawan</th>
                  <th className="px-6 py-3 font-semibold">Departemen</th>
                  <th className="px-6 py-3 font-semibold">Jabatan</th>
                  <th className="px-6 py-3 font-semibold">Presensi Hari Ini</th>
                  <th className="px-6 py-3 font-semibold">Check-in / Out</th>
                  <th className="px-6 py-3 font-semibold">Total Klaim Bulan Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allEmployees.map((emp) => {
                  const todayAtt = todayRecords.find((a) => a.employeeId === emp.id);
                  const empClaims = claims.filter((c) => c.employeeId === emp.id);
                  const totalClaimAmount = empClaims.reduce((a, b) => a + b.amount, 0);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        <div>{emp.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.employeeCode}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{emp.department}</td>
                      <td className="px-6 py-3.5 text-slate-600">{emp.jobTitle}</td>
                      <td className="px-6 py-3.5">
                        <AttendanceBadge
                          status={todayAtt?.status || 'BELUM_CHECK_IN'}
                          isLate={todayAtt?.isLate}
                        />
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-700">
                        {todayAtt?.checkInAt || '-'} / {todayAtt?.checkOutAt || '-'}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {formatRupiah(totalClaimAmount)} ({empClaims.length})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
