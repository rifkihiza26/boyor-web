'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight, AlertTriangle, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { signIn, settings } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // Panggil Supabase Auth secara langsung
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError) {
        let msg = authError.message;
        if (msg.includes('Invalid login credentials')) msg = 'Email atau kata sandi salah. Silakan coba lagi.';
        else if (msg.includes('Email not confirmed')) msg = 'Akun belum dikonfirmasi. Cek email Anda.';
        else if (msg.includes('Too many requests')) msg = 'Terlalu banyak percobaan login. Tunggu beberapa menit.';
        setError(msg);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Berhasil login, arahkan langsung ke dashboard
        window.location.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal menghubungi server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
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
          PT PROTEKSI ALFA SOLUSI
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Sistem Informasi Presensi &amp; Reimbursement Staf
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-slate-300 rounded-md sm:px-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email Kantor
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded focus:border-slate-700 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded focus:border-slate-700 focus:outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                // Pastikan jika browser mobile tidak memicu onSubmit form secara otomatis, handler tetap jalan
                if (!loading && email && password) {
                  // normal form submit will trigger onSubmit, this is safe fallback
                }
              }}
              className="w-full mt-2 py-3 px-4 rounded bg-[#0f172a] active:bg-[#1e293b] text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Pegawai baru belum memiliki akun?{' '}
              <Link
                href="/register"
                className="font-semibold text-slate-900 hover:text-slate-700 ml-1 inline-flex items-center gap-1 underline underline-offset-2"
              >
                <span>Daftar Akun</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
