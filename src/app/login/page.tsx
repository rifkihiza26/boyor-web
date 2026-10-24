'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight, AlertTriangle, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/dashboard';
      }
    });
  }, []);

  const handleLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Harap masukkan alamat email dan kata sandi.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        let msg = authError.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email atau kata sandi tidak cocok. Silakan cek kembali.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Akun belum dikonfirmasi melalui tautan email.';
        } else if (msg.includes('Too many requests')) {
          msg = 'Terlalu banyak percobaan masuk. Harap tunggu sebentar.';
        }
        setError(msg);
        setLoading(false);
        return;
      }

      if (data?.session) {
        // Redirect directly to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Sesi login tidak terbentuk. Coba kembali.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Gagal menghubungi server. Periksa jaringan internet Anda.');
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
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
          <div className="space-y-4">
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded focus:border-slate-700 focus:outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleLogin}
              className="w-full mt-2 py-3 px-4 rounded bg-[#0f172a] active:bg-[#1e293b] text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 pointer-events-none" />
                </>
              )}
            </button>
          </div>

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
