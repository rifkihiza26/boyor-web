'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, AlertTriangle, Lock, Mail, Loader2 } from 'lucide-react';

// Create a standalone Supabase client just for login
// This avoids any dependency on AuthContext or shared client state
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zckysqcytofpxfuqaexe.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja3lzcWN5dG9mcHhmdXFhZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODk3MDEsImV4cCI6MjEwNzM2NTcwMX0.Ldpy1Bqd_tJmlTOtE8_DOShQLfg3YLl885zaGBKbpVI';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // On mount: check if already logged in, redirect if so
  useEffect(() => {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Already logged in - go to dashboard
        window.location.href = '/dashboard';
      } else {
        setCheckingSession(false);
      }
    }).catch(() => {
      setCheckingSession(false);
    });

    // Safety: if getSession hangs, show login form after 3 seconds anyway
    const timer = setTimeout(() => setCheckingSession(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Harap isi email dan kata sandi.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create fresh client for login attempt
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      });

      const { error: authError } = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
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

      // Login successful! Hard redirect - AuthContext will pick up session on dashboard page
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Gagal menghubungi server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  // Show minimal loading while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide">Memeriksa sesi...</p>
      </div>
    );
  }

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
