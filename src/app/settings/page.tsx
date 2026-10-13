'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { CompanySettings } from '@/types';
import { Settings, Save, RotateCcw, Building, MapPin, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { settings, refreshData } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [officeName, setOfficeName] = useState(settings.officeName);
  const [officeAddress, setOfficeAddress] = useState(settings.officeAddress);
  const [checkInStartTime, setCheckInStartTime] = useState(settings.checkInStartTime || '07:00');
  const [workStartTime, setWorkStartTime] = useState(settings.workStartTime);
  const [workEndTime, setWorkEndTime] = useState(settings.workEndTime);
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState(settings.lateToleranceMinutes);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: CompanySettings = {
      companyName,
      officeName,
      officeAddress,
      checkInStartTime,
      workStartTime,
      workEndTime,
      lateToleranceMinutes: Number(lateToleranceMinutes),
    };

    const ok = await SupabaseService.updateSettings(updated);
    setSaving(false);
    if (ok) {
      refreshData();
      showToast('Pengaturan perusahaan berhasil disimpan ke database!', 'success');
    } else {
      showToast('Gagal menyimpan pengaturan ke database.', 'error');
    }
  };

  const handleReset = () => {
    setCompanyName(settings.companyName);
    setOfficeName(settings.officeName);
    setOfficeAddress(settings.officeAddress);
    setCheckInStartTime(settings.checkInStartTime || '07:00');
    setWorkStartTime(settings.workStartTime);
    setWorkEndTime(settings.workEndTime);
    setLateToleranceMinutes(settings.lateToleranceMinutes);
    showToast('Form telah dikembalikan ke data tersimpan.', 'info');
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pengaturan Perusahaan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi profil kantor dan kebijakan jam kerja serta toleransi keterlambatan (Admin / HR).
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Company Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-indigo-600" /> Profil Entitas &amp; Nama Kantor
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kantor / Gedung *</label>
                <input
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor Lengkap *</label>
                <textarea
                  rows={2}
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Working Hours & Late Tolerance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-indigo-600" /> Kebijakan Jam Kerja &amp; Toleransi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Absen Dibuka (HH:mm) *</label>
                <input
                  type="text"
                  value={checkInStartTime}
                  onChange={(e) => setCheckInStartTime(e.target.value)}
                  placeholder="07:00"
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Batas awal check-in</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jam Masuk (HH:mm) *</label>
                <input
                  type="text"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Jam kerja resmi</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jam Pulang (HH:mm) *</label>
                <input
                  type="text"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Jam selesai kerja</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Toleransi Keterlambatan (Menit) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={lateToleranceMinutes}
                  onChange={(e) => setLateToleranceMinutes(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-rose-600"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Lewat {workStartTime} + {lateToleranceMinutes}m = telat
                </span>
              </div>
            </div>
          </div>

          {/* Submit bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Nilai Default
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
