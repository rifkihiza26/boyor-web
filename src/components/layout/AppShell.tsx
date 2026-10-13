'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { RoleBadge } from '@/components/ui/StatusBadge';
import {
  LayoutDashboard,
  Clock,
  History,
  Receipt,
  CheckSquare,
  Users,
  Building2,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';


export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    allEmployees,
    role,
    switchUser,
    settings,
  } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Common navigation
  const navItems = [
    { label: 'Beranda Rekap', href: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    // Pegawai
    { label: 'Absensi Hari Ini', href: '/attendance', icon: Clock, roles: ['ALL'] },
    { label: 'Riwayat Absensi', href: '/attendance/history', icon: History, roles: ['EMPLOYEE'] },
    { label: 'Catat Reimbursement', href: '/reimbursements', icon: Receipt, roles: ['EMPLOYEE'] },
    // Dirut (Pencatatan & Perekapan Lengkap)
    { label: 'Rekap Presensi Staf', href: '/reports', icon: Users, roles: ['DIRUT', 'ADMIN_HR', 'MANAGER', 'FINANCE'] },
    { label: 'Rekap Reimbursement', href: '/reimbursements', icon: Receipt, roles: ['DIRUT', 'ADMIN_HR', 'MANAGER', 'FINANCE'] },
    { label: 'Persetujuan & Akun', href: '/approvals', icon: CheckSquare, roles: ['DIRUT', 'ADMIN_HR', 'MANAGER'] },
    { label: 'Data Karyawan', href: '/employees', icon: Building2, roles: ['DIRUT', 'ADMIN_HR'] },
    { label: 'Pengaturan Kantor', href: '/settings', icon: Settings, roles: ['DIRUT', 'ADMIN_HR'] },
    // Profil (Khusus Pegawai untuk data rekening penerima reimburse)
    { label: 'Profil Saya', href: '/profile', icon: User, roles: ['EMPLOYEE'] },
  ];

  const filteredNav = mounted
    ? navItems.filter((item) => {
        if (item.roles.includes('ALL')) return true;
        return item.roles.includes(role);
      })
    : navItems.filter((item) => item.roles.includes('ALL'));


  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - Enterprise Deep Navy */}
        <aside className="hidden lg:flex lg:flex-col w-60 bg-[#0f172a] text-slate-300 border-r border-[#1e293b]">
          <div className="px-5 py-4 border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#2563eb] flex items-center justify-center text-white font-black text-sm tracking-wider">
                PAS
              </div>
              <div>
                <h1 className="font-bold text-white text-sm tracking-tight">PROASI</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">PORTAL PRESENSI</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Menu Utama
            </div>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1e293b] text-white font-semibold border-l-2 border-[#2563eb]'
                      : 'text-slate-300 hover:bg-[#1e293b]/70 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile footer */}
          <div className="p-3 border-t border-[#1e293b] flex items-center justify-between bg-[#0a0f1d]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                suppressHydrationWarning
                className="w-7 h-7 rounded bg-[#1e293b] text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 border border-[#334155]"
              >
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="truncate">
                <p suppressHydrationWarning className="text-xs font-semibold text-white truncate">
                  {currentUser.fullName}
                </p>
                <div className="mt-0.5" suppressHydrationWarning>
                  {mounted ? (
                    <RoleBadge role={currentUser.role} />
                  ) : (
                    <RoleBadge role="EMPLOYEE" />
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/login"
              title="Keluar"
              className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1e293b] transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/70"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-[#0f172a] text-slate-200 flex flex-col h-full border-r border-[#1e293b] shadow-2xl z-10">
              <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#0a0f1d]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-100 font-bold text-xs tracking-wider">
                    PAS
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-xs tracking-wide">PROASI PORTAL</h2>
                    <p className="text-[10px] text-slate-400">PT Proteksi Alfa Solusi</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1e293b]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Menu Utama
                </div>
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#1e293b] text-white font-semibold border-l-2 border-[#2563eb]'
                          : 'text-slate-300 hover:bg-[#1e293b]/70 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#38bdf8]' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-[#1e293b] flex items-center justify-between bg-[#0a0f1d]">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    suppressHydrationWarning
                    className="w-7 h-7 rounded bg-[#1e293b] text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 border border-[#334155]"
                  >
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p suppressHydrationWarning className="text-xs font-semibold text-white truncate">
                      {currentUser.fullName}
                    </p>
                    <div className="mt-0.5" suppressHydrationWarning>
                      {mounted ? (
                        <RoleBadge role={currentUser.role} />
                      ) : (
                        <RoleBadge role="EMPLOYEE" />
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1e293b]"
                >
                  <LogOut className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
          {/* Top Navbar */}
          <header className="bg-white border-b border-slate-300 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 rounded text-slate-600 hover:bg-slate-100"
                aria-label="Buka navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Modul
                </span>
                <span className="text-slate-300">/</span>
                <h2 className="font-bold text-slate-900 text-sm capitalize">
                  {pathname === '/'
                    ? 'Beranda'
                    : pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                suppressHydrationWarning
                className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200"
              >
                <span suppressHydrationWarning className="font-semibold text-slate-800">
                  {currentUser.fullName}
                </span>
                <span className="text-slate-300">•</span>
                {mounted ? (
                  <RoleBadge role={currentUser.role} />
                ) : (
                  <RoleBadge role="EMPLOYEE" />
                )}
              </div>
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded transition"
              >
                Keluar
              </Link>
            </div>
          </header>

          <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {children}
          </main>

          {/* Bottom Navigation Bar for Mobile and Tablet */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-300 z-40 px-2 py-1 flex items-center justify-around shadow-md">
            <Link
              href="/dashboard"
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                pathname === '/dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Beranda</span>
            </Link>

            <Link
              href="/attendance"
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                pathname === '/attendance' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-5 h-5 mb-0.5" />
              <span>Absen</span>
            </Link>

            <Link
              href="/reimbursements"
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                pathname.startsWith('/reimbursements') ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Klaim</span>
            </Link>

            {(role === 'DIRUT' || role === 'ADMIN_HR' || role === 'MANAGER') && (
              <Link
                href="/approvals"
                className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                  pathname === '/approvals' ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckSquare className="w-5 h-5 mb-0.5" />
                <span>Approval</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center py-1 px-2.5 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5 mb-0.5" />
              <span>Menu</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
