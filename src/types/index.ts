export type UserRole = 'DIRUT' | 'ADMIN_HR' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  role: UserRole;
  isActive: boolean;
  accountStatus?: 'ACTIVE' | 'PENDING' | 'REJECTED';
  avatarUrl?: string;
  phone?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export type AttendanceStatus = 'BELUM_CHECK_IN' | 'SEDANG_BEKERJA' | 'SELESAI';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInAt?: string; // HH:mm:ss or ISO
  checkOutAt?: string; // HH:mm:ss or ISO
  status: AttendanceStatus;
  totalMinutes?: number;
  isLate: boolean;
  distanceMeters?: number;
  note?: string;
}

export type ClaimCategory =
  | 'Transportasi'
  | 'Makan'
  | 'Akomodasi'
  | 'Perlengkapan Kantor'
  | 'Komunikasi'
  | 'Lainnya';

export type ClaimStatus =
  | 'Draft'
  | 'Menunggu Persetujuan Manager'
  | 'Ditolak Manager'
  | 'Disetujui Manager'
  | 'Menunggu Verifikasi Finance'
  | 'Perlu Revisi Finance'
  | 'Siap Dibayar'
  | 'Dibayar'
  | 'Dibatalkan';

export interface PaymentDetails {
  paidAt: string; // YYYY-MM-DD HH:mm
  method: 'Transfer Bank' | 'Tunai';
  note?: string;
  disbursedBy?: string;
}

export interface ActivityLog {
  id: string;
  claimId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  note?: string;
}

export interface ReimbursementClaim {
  id: string;
  claimNumber: string;
  employeeId: string;
  title: string;
  category: ClaimCategory;
  transactionDate: string; // YYYY-MM-DD
  submittedAt?: string; // ISO
  amount: number;
  description: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: ClaimStatus;
  managerNote?: string;
  financeNote?: string;
  paymentDetails?: PaymentDetails;
  activities?: ActivityLog[];
}

export interface CompanySettings {
  companyName: string;
  officeName: string;
  officeAddress: string;
  checkInStartTime: string; // HH:mm (e.g. 07:00) batas awal absensi dibuka
  workStartTime: string; // HH:mm (e.g. 09:00)
  workEndTime: string; // HH:mm (e.g. 18:00)
  lateToleranceMinutes: number; // e.g. 15
}
