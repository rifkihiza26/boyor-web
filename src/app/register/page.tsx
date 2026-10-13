'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { UserPlus, ArrowLeft, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim()) {
      setError('Mohon lengkapi nama lengkap dan email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    // 1. Create Supabase Auth user — pass metadata so DB trigger handle_new_user auto-creates profile
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          department: department.trim() || 'Umum',
          job_title: jobTitle.trim() || 'Staf',
          phone: phone.trim() || null,
          role: 'EMPLOYEE',
        },
      },
    });

    if (signUpError || !authData.user) {
      let msg = signUpError?.message || 'Gagal membuat akun.';
      if (msg.includes('already registered')) msg = 'Email ini sudah terdaftar. Gunakan email lain atau langsung login.';
      if (msg.includes('Database error')) msg = 'Database error: akun tidak dapat dibuat. Hubungi admin.';
      setError(msg);
      setLoading(false);
      return;
    }

    // 2. Upsert profile sebagai fallback (jika trigger DB belum jalan / belum dikonfigurasi)
    // Jika trigger sudah ada, upsert ini aman karena tidak akan menimpa data yang sudah ada
    await supabase.from('profiles').upsert(
      {
        id: authData.user.id,
        employee_code: `PAS-${Date.now().toString().slice(-5)}`,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        department: department.trim() || 'Umum',
        job_title: jobTitle.trim() || 'Staf',
        role: 'EMPLOYEE',
        account_status: 'PENDING',
        is_active: false,
      },
      { onConflict: 'id' }
    );

    setSubmittedName(fullName.trim());
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-2 rounded-xl bg-white shadow-sm border border-slate-200 mb-3">
          <Image
            src="/logo.png"
            alt="PROASI Logo"
            width={84}
            height={84}
            priority
            className="w-20 h-auto object-contain"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          PT PROTEKSI ALFA SOLUSI (PROASI)
        </h1>
        <p className="mt-1 text-xs text-slate-500">Pendaftaran Akun Pegawai Baru</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 border border-slate-300 rounded-md sm:px-8">
          {submittedName ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border-2 border-amber-200">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pendaftaran Terkirim!</h2>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2.5 mt-2 inline-block">
                  Status: <strong>Menunggu Persetujuan Admin</strong>
                </p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Halo <strong>{submittedName}</strong>, data registrasi Anda telah tersimpan.
                Akun harus disetujui oleh Admin terlebih dahulu sebelum dapat digunakan untuk presensi.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold text-sm transition text-center flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  Setelah pendaftaran selesai, Admin akan menyetujui akun Anda sebelum dapat digunakan untuk absensi.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Divisi / Bagian
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Contoh: Operasional"
                      className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Kosongkan jika tidak ada"
                      className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ulangi Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password"
                      className="w-full text-sm rounded border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-slate-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-sm transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Mendaftarkan...' : 'Daftarkan Akun Pegawai'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Sudah memiliki akun?{' '}
                  <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-2">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
