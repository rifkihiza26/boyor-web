import React from 'react';
import { ClaimStatus, AttendanceStatus, UserRole } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const styles = {
    primary: 'bg-slate-900 text-white border-slate-900',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
    danger: 'bg-rose-50 text-rose-700 border-rose-300 font-medium',
    info: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  };

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ClaimStatus | string }) {
  switch (status) {
    case 'Draft':
      return <Badge variant="neutral">Draft</Badge>;
    case 'Menunggu Persetujuan Manager':
      return <Badge variant="warning">Menunggu Persetujuan Manager</Badge>;
    case 'Disetujui Manager':
      return <Badge variant="info">Disetujui Manager</Badge>;
    case 'Menunggu Verifikasi Finance':
      return <Badge variant="warning">Menunggu Verifikasi Finance</Badge>;
    case 'Perlu Revisi Finance':
      return <Badge variant="danger">Perlu Revisi Finance</Badge>;
    case 'Siap Dibayar':
      return <Badge variant="primary">Siap Dibayar</Badge>;
    case 'Dibayar':
      return <Badge variant="success">Dibayar</Badge>;
    case 'Ditolak Manager':
      return <Badge variant="danger">Ditolak Manager</Badge>;
    case 'Dibatalkan':
      return <Badge variant="neutral">Dibatalkan</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function AttendanceBadge({ status, isLate }: { status: AttendanceStatus; isLate?: boolean }) {
  if (status === 'SELESAI') {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="success">Selesai</Badge>
        {isLate && <Badge variant="danger">Terlambat</Badge>}
      </div>
    );
  }
  if (status === 'SEDANG_BEKERJA') {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="info">Sedang Bekerja</Badge>
        {isLate && <Badge variant="danger">Terlambat</Badge>}
      </div>
    );
  }
  return <Badge variant="neutral">Belum Check-in</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case 'DIRUT':
      return <Badge variant="primary">Admin (Dirut)</Badge>;
    case 'ADMIN_HR':
      return <Badge variant="primary">Admin (Dirut)</Badge>;
    case 'MANAGER':
      return <Badge variant="info">Manajer</Badge>;
    case 'FINANCE':
      return <Badge variant="success">Finance</Badge>;
    case 'EMPLOYEE':
      return <Badge variant="neutral">Pegawai</Badge>;
  }
}

export function AccountStatusBadge({ status }: { status?: 'ACTIVE' | 'PENDING' | 'REJECTED' }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">Menunggu Persetujuan</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Ditolak</Badge>;
    case 'ACTIVE':
    default:
      return <Badge variant="success">Aktif</Badge>;
  }
}
