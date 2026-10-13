'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { SupabaseService } from '@/lib/supabase-services';
import { AttendanceRecord } from '@/types';
import { formatDateIndo, formatDurationMinutes } from '@/lib/formatters';
import { AttendanceBadge } from '@/components/ui/StatusBadge';
import { Search } from 'lucide-react';

export default function AttendanceHistoryPage() {
  const { currentUser, role, allEmployees } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    role === 'ADMIN_HR' || role === 'MANAGER' || role === 'DIRUT' ? 'ALL' : currentUser.id
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);

  const fetchRecords = useCallback(async () => {
    const empId = selectedEmployeeId === 'ALL' ? undefined : selectedEmployeeId;
    const records = await SupabaseService.getAttendanceHistory(empId);
    setAllRecords(records);
  }, [selectedEmployeeId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = allRecords.filter((rec) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'LATE' && !rec.isLate) return false;
      if (statusFilter === 'SELESAI' && rec.status !== 'SELESAI') return false;
      if (statusFilter === 'SEDANG_BEKERJA' && rec.status !== 'SEDANG_BEKERJA') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const emp = allEmployees.find((e) => e.id === rec.employeeId);
      const matchName = emp?.fullName.toLowerCase().includes(q);
      const matchDate = rec.date.includes(q);
      return matchName || matchDate;
    }
    return true;
  });


  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Riwayat Presensi Karyawan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Data log kehadiran, keterlambatan, dan jam kerja historis.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Employee Selector for HR/Admin/Manager */}
            {(role === 'ADMIN_HR' || role === 'MANAGER') && (
              <div className="w-full sm:w-48">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
                >
                  <option value="ALL">Semua Karyawan</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="w-full sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
              >
                <option value="ALL">Semua Status</option>
                <option value="SELESAI">Selesai</option>
                <option value="SEDANG_BEKERJA">Sedang Bekerja</option>
                <option value="LATE">Terlambat</option>
              </select>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari tanggal atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 font-semibold">Tanggal</th>
                  {(role === 'ADMIN_HR' || role === 'MANAGER') && (
                    <th className="px-6 py-3 font-semibold">Karyawan</th>
                  )}
                  <th className="px-6 py-3 font-semibold">Jam Masuk</th>
                  <th className="px-6 py-3 font-semibold">Jam Pulang</th>
                  <th className="px-6 py-3 font-semibold">Total Durasi</th>
                  <th className="px-6 py-3 font-semibold">Status Presensi</th>
                  <th className="px-6 py-3 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500 italic"
                    >
                      Tidak ada catatan presensi yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const emp = allEmployees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {formatDateIndo(rec.date)}
                        </td>
                        {(role === 'ADMIN_HR' || role === 'MANAGER') && (
                          <td className="px-6 py-3.5 font-medium text-slate-800">
                            <div>{emp?.fullName || rec.employeeId}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {emp?.employeeCode}
                            </div>
                          </td>
                        )}
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
                        <td className="px-6 py-3.5 text-slate-500 italic max-w-xs truncate">
                          {rec.note || (rec.isLate ? 'Keterlambatan sistem' : '-')}
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
