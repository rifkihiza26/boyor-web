'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { SupabaseService } from '@/lib/supabase-services';
import { RoleBadge } from '@/components/ui/StatusBadge';
import { Save } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, role, refreshData } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (role === 'DIRUT' || role === 'ADMIN_HR') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bankName, setBankName] = useState(currentUser.bankAccount?.bankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState(
    currentUser.bankAccount?.accountNumber || ''
  );
  const [accountHolder, setAccountHolder] = useState(
    currentUser.bankAccount?.accountHolder || currentUser.fullName
  );
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updated = {
      ...currentUser,
      phone,
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder,
      },
    };

    const res = await SupabaseService.saveEmployee(updated);
    setSaving(false);
    if (res.success) {
      refreshData();
      showToast('Profil dan informasi rekening berhasil diperbarui.', 'success');
    } else {
      showToast(res.message || 'Gagal memperbarui profil.', 'error');
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Profil Saya</h1>
          <p className="text-sm text-slate-500 mt-1">
            Informasi identitas akun karyawan dan nomor rekening penerimaan pencairan reimbursement.
          </p>
        </div>

        {/* User Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h2>
              <RoleBadge role={currentUser.role} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID Karyawan: {currentUser.employeeCode} • {currentUser.email}
            </p>
            <p className="text-xs text-slate-700 font-medium mt-1">
              {currentUser.jobTitle} • {currentUser.department}
            </p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Kontak &amp; Rekening Payroll
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full p-2.5 border border-slate-300 rounded text-slate-900 bg-white focus:outline-hidden focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Bank</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-slate-900 bg-white focus:outline-hidden focus:border-slate-600"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Nomor rekening"
                    className="w-full p-2.5 border border-slate-300 rounded text-slate-900 bg-white font-mono focus:outline-hidden focus:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Atas nama"
                    className="w-full p-2.5 border border-slate-300 rounded text-slate-900 bg-white focus:outline-hidden focus:border-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Perubahan Profil
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
