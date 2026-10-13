import { Employee, AttendanceRecord, ReimbursementClaim, CompanySettings } from '@/types';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'PT PROTEKSI ALFA SOLUSI (PROASI)',
  officeName: 'Kantor Pusat Jakarta',
  officeAddress: 'Jl. Sudirman Kav. 28, RT.14/RW.1, Karet Semanggi, Setiabudi, Jakarta Selatan 12920',
  checkInStartTime: '07:00',
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateToleranceMinutes: 15,
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'BYR-001',
    fullName: 'Admin (Direktur Utama)',
    email: 'dirut@gmail.com',
    department: 'Direksi & Manajemen',
    jobTitle: 'Admin / Direktur Utama',
    role: 'DIRUT',
    isActive: true,
    phone: '0812-3456-7890',
    bankAccount: {
      bankName: 'BCA',
      accountNumber: '8820192831',
      accountHolder: 'Admin (Direktur Utama)',
    },
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_CLAIMS: ReimbursementClaim[] = [];
