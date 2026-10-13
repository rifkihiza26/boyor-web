import {
  Employee,
  AttendanceRecord,
  ReimbursementClaim,
  CompanySettings,
  ClaimStatus,
  ClaimCategory,
  ActivityLog,
  PaymentDetails,
  UserRole,
} from '@/types';
import { LocalStore } from '@/lib/storage';
import { getTodayDateStr } from '@/lib/formatters';

export const MockService = {
  // Current logged in demo employee
  getCurrentEmployee(): Employee {
    const employees = LocalStore.getEmployees();
    const currentId = LocalStore.getCurrentUserId();
    const found = employees.find((e) => e.id === currentId);
    return found || employees[3]; // Default to emp-4 (Employee)
  },

  switchDemoUser(employeeId: string): void {
    LocalStore.setCurrentUserId(employeeId);
  },

  // GPS Simulation
  getLocationCondition(): 'INSIDE' | 'OUTSIDE' {
    return LocalStore.getSimulatedLocation();
  },

  setLocationCondition(condition: 'INSIDE' | 'OUTSIDE'): void {
    LocalStore.setSimulatedLocation(condition);
  },

  // Employees CRUD
  getEmployees(): Employee[] {
    return LocalStore.getEmployees();
  },

  getEmployeeById(id: string): Employee | undefined {
    return LocalStore.getEmployees().find((e) => e.id === id);
  },

  saveEmployee(employee: Employee): void {
    const list = LocalStore.getEmployees();
    const index = list.findIndex((e) => e.id === employee.id);
    if (index >= 0) {
      list[index] = employee;
    } else {
      list.push(employee);
    }
    LocalStore.setEmployees(list);
  },

  toggleEmployeeActive(id: string): Employee | undefined {
    const list = LocalStore.getEmployees();
    const target = list.find((e) => e.id === id);
    if (target) {
      target.isActive = !target.isActive;
      LocalStore.setEmployees(list);
    }
    return target;
  },

  // Account Registration & Approval Workflow
  registerEmployee(data: {
    fullName: string;
    email: string;
    phone?: string;
    department: string;
    jobTitle: string;
    role?: UserRole;
  }): { success: boolean; message: string; employee?: Employee } {
    const list = LocalStore.getEmployees();
    const existing = list.find((e) => e.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return { success: false, message: 'Email tersebut sudah terdaftar di sistem.' };
    }

    const nextIndex = list.length + 1;
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: `BYR-0${nextIndex < 10 ? '0' + nextIndex : nextIndex}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || '',
      department: data.department || 'Operasional',
      jobTitle: data.jobTitle || 'Staff',
      role: data.role || 'EMPLOYEE',
      isActive: false, // Menunggu persetujuan
      accountStatus: 'PENDING',
    };

    list.push(newEmployee);
    LocalStore.setEmployees(list);
    return {
      success: true,
      message: 'Pendaftaran berhasil dikirim! Menunggu persetujuan dari Atasan sebelum bisa login.',
      employee: newEmployee,
    };
  },

  approveEmployee(id: string): { success: boolean; message: string; employee?: Employee } {
    const list = LocalStore.getEmployees();
    const target = list.find((e) => e.id === id);
    if (!target) {
      return { success: false, message: 'Pegawai tidak ditemukan.' };
    }
    target.accountStatus = 'ACTIVE';
    target.isActive = true;
    LocalStore.setEmployees(list);
    return {
      success: true,
      message: `Akun ${target.fullName} berhasil disetujui! Pegawai sekarang dapat login dan absen.`,
      employee: target,
    };
  },

  rejectEmployee(id: string): { success: boolean; message: string } {
    const list = LocalStore.getEmployees();
    const target = list.find((e) => e.id === id);
    if (!target) {
      return { success: false, message: 'Pegawai tidak ditemukan.' };
    }
    target.accountStatus = 'REJECTED';
    target.isActive = false;
    LocalStore.setEmployees(list);
    return {
      success: true,
      message: `Pendaftaran ${target.fullName} telah ditolak.`,
    };
  },

  getPendingEmployees(): Employee[] {
    return LocalStore.getEmployees().filter((e) => e.accountStatus === 'PENDING');
  },

  // Attendance
  getTodayAttendanceForEmployee(employeeId: string): AttendanceRecord | undefined {
    const today = getTodayDateStr();
    return LocalStore.getAttendance().find(
      (a) => a.employeeId === employeeId && a.date === today
    );
  },

  getAttendanceHistory(employeeId?: string): AttendanceRecord[] {
    const all = LocalStore.getAttendance();
    if (employeeId) {
      return all.filter((a) => a.employeeId === employeeId);
    }
    return all;
  },

  checkIn(employeeId: string): { success: boolean; message: string; record?: AttendanceRecord } {
    const condition = LocalStore.getSimulatedLocation();
    const settings = LocalStore.getSettings();
    const today = getTodayDateStr();
    const attendanceList = LocalStore.getAttendance();

    // Check if already checked in today
    const existing = attendanceList.find(
      (a) => a.employeeId === employeeId && a.date === today
    );

    if (existing && existing.status !== 'BELUM_CHECK_IN') {
      return {
        success: false,
        message: 'Anda sudah melakukan check-in hari ini.',
      };
    }

    // Determine current time
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Late evaluation
    const [startH, startM] = settings.workStartTime.split(':').map(Number);
    const scheduledMinutes = startH * 60 + startM + settings.lateToleranceMinutes;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLate = currentMinutes > scheduledMinutes;

    const newRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      employeeId,
      date: today,
      checkInAt: checkInTime,
      status: 'SEDANG_BEKERJA',
      isLate,
      note: isLate ? 'Check-in melewati jam toleransi kantor' : undefined,
    };

    if (existing) {
      const idx = attendanceList.findIndex((a) => a.id === existing.id);
      attendanceList[idx] = newRecord;
    } else {
      attendanceList.unshift(newRecord);
    }

    LocalStore.setAttendance(attendanceList);
    return {
      success: true,
      message: `Check-in berhasil tercatat pukul ${checkInTime} WIB.${isLate ? ' (Terlambat)' : ''}`,
      record: newRecord,
    };
  },

  checkOut(employeeId: string): { success: boolean; message: string; record?: AttendanceRecord } {
    const today = getTodayDateStr();
    const attendanceList = LocalStore.getAttendance();
    const record = attendanceList.find(
      (a) => a.employeeId === employeeId && a.date === today
    );

    if (!record || record.status === 'BELUM_CHECK_IN') {
      return {
        success: false,
        message: 'Anda belum melakukan check-in hari ini.',
      };
    }

    if (record.status === 'SELESAI') {
      return {
        success: false,
        message: 'Anda sudah menyelesaikan sesi kerja hari ini.',
      };
    }

    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Calculate duration
    let durationMinutes = 480; // Default 8 hours
    if (record.checkInAt) {
      const [cinH, cinM] = record.checkInAt.split(':').map(Number);
      const startMin = cinH * 60 + cinM;
      const endMin = now.getHours() * 60 + now.getMinutes();
      durationMinutes = Math.max(1, endMin - startMin);
    }

    record.checkOutAt = checkOutTime;
    record.status = 'SELESAI';
    record.totalMinutes = durationMinutes;

    LocalStore.setAttendance(attendanceList);
    return {
      success: true,
      message: `Check-out berhasil pukul ${checkOutTime} WIB. Total kerja: ${Math.floor(
        durationMinutes / 60
      )} jam ${durationMinutes % 60} menit.`,
      record,
    };
  },

  // Reimbursements
  getClaims(roleFilter?: UserRole, currentEmployeeId?: string): ReimbursementClaim[] {
    const all = LocalStore.getClaims();
    if (roleFilter === 'EMPLOYEE' && currentEmployeeId) {
      return all.filter((c) => c.employeeId === currentEmployeeId);
    }
    return all;
  },

  getClaimById(id: string): ReimbursementClaim | undefined {
    return LocalStore.getClaims().find((c) => c.id === id);
  },

  saveClaim(claim: ReimbursementClaim): void {
    const claims = LocalStore.getClaims();
    const idx = claims.findIndex((c) => c.id === claim.id);
    if (idx >= 0) {
      claims[idx] = claim;
    } else {
      claims.unshift(claim);
    }
    LocalStore.setClaims(claims);
  },

  createClaim(
    data: {
      employeeId: string;
      title: string;
      category: ClaimCategory;
      transactionDate: string;
      amount: number;
      description: string;
      attachmentName?: string;
      isDraft?: boolean;
    },
    actor: Employee
  ): ReimbursementClaim {
    const claims = LocalStore.getClaims();
    const count = claims.length + 1;
    const today = new Date();
    const yyyymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const claimNumber = `CLM-${yyyymm}-${String(count).padStart(3, '0')}`;
    const claimId = `clm-${Date.now()}`;
    const timestamp = today.toISOString();

    const newClaim: ReimbursementClaim = {
      id: claimId,
      claimNumber,
      employeeId: data.employeeId,
      title: data.title,
      category: data.category,
      transactionDate: data.transactionDate,
      submittedAt: data.isDraft ? undefined : timestamp,
      amount: data.amount,
      description: data.description,
      attachmentName: data.attachmentName || 'bukti_transaksi.jpg',
      status: data.isDraft ? 'Draft' : 'Menunggu Persetujuan Manager',
      activities: data.isDraft
        ? []
        : [
            {
              id: `act-${Date.now()}`,
              claimId,
              action: 'Pengajuan Dikirim',
              actorId: actor.id,
              actorName: actor.fullName,
              actorRole: actor.role,
              timestamp,
              note: 'Pengajuan klaim baru dikirim ke Manager.',
            },
          ],
    };

    claims.unshift(newClaim);
    LocalStore.setClaims(claims);
    return newClaim;
  },

  submitDraft(claimId: string, actor: Employee): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };
    if (claim.status !== 'Draft') {
      return { success: false, message: 'Hanya draft yang dapat diajukan.' };
    }

    const timestamp = new Date().toISOString();
    claim.status = 'Menunggu Persetujuan Manager';
    claim.submittedAt = timestamp;
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Pengajuan Dikirim',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: 'Draft resmi diajukan.',
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Klaim berhasil diajukan ke Manager.' };
  },

  // Direct Streamlined Workflow for Direktur Utama (Dirut)
  dirutQuickApprove(claimId: string, actor: Employee, note?: string): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    const timestamp = new Date().toISOString();
    claim.status = 'Siap Dibayar';
    claim.managerNote = note || 'Disetujui langsung oleh Direktur Utama.';
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Disetujui Dirut (Siap Transfer)',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: claim.managerNote,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: `Klaim ${claim.claimNumber} berhasil disetujui Dirut dan siap ditransfer!` };
  },

  dirutQuickPay(claimId: string, actor: Employee, method: 'Transfer Bank' | 'Tunai' = 'Transfer Bank', note?: string): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    const timestamp = new Date().toISOString();
    claim.status = 'Dibayar';
    claim.paymentDetails = {
      paidAt: timestamp.replace('T', ' ').substring(0, 16),
      method,
      note: note || 'Transfer berhasil diproses.',
      disbursedBy: actor.fullName,
    };
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Dana Dicairkan / Ditransfer',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: `Telah dicairkan via ${method}. ${note || ''}`,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: `Klaim ${claim.claimNumber} berhasil dicatat sebagai DIBAYAR!` };
  },

  // Centralized Workflow Business Logic: Manager Decisions
  managerApprove(claimId: string, actor: Employee, note?: string): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    if (claim.status !== 'Menunggu Persetujuan Manager') {
      return { success: false, message: 'Status klaim tidak valid untuk persetujuan Manager.' };
    }

    const timestamp = new Date().toISOString();
    claim.status = 'Menunggu Verifikasi Finance';
    claim.managerNote = note || 'Disetujui oleh Manager.';
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Disetujui Manager',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: claim.managerNote,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Klaim berhasil disetujui dan diteruskan ke Finance.' };
  },

  managerReject(claimId: string, actor: Employee, reason: string): { success: boolean; message: string } {
    if (!reason || reason.trim() === '') {
      return { success: false, message: 'Alasan penolakan wajib diisi.' };
    }

    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    if (claim.status !== 'Menunggu Persetujuan Manager') {
      return { success: false, message: 'Status klaim tidak valid untuk penolakan Manager.' };
    }

    const timestamp = new Date().toISOString();
    claim.status = 'Ditolak Manager';
    claim.managerNote = reason;
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Ditolak Manager',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: reason,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Klaim telah ditolak oleh Manager.' };
  },

  // Centralized Workflow Business Logic: Finance Verification
  financeRequestRevision(claimId: string, actor: Employee, revisionNote: string): { success: boolean; message: string } {
    if (!revisionNote || revisionNote.trim() === '') {
      return { success: false, message: 'Catatan revisi wajib diisi.' };
    }

    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    if (claim.status !== 'Menunggu Verifikasi Finance') {
      return { success: false, message: 'Klaim harus dalam status Menunggu Verifikasi Finance.' };
    }

    const timestamp = new Date().toISOString();
    claim.status = 'Perlu Revisi Finance';
    claim.financeNote = revisionNote;
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Perlu Revisi Finance',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: revisionNote,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Permintaan revisi berhasil dikirim ke karyawan.' };
  },

  financeApproveForPayment(claimId: string, actor: Employee, note?: string): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    if (claim.status !== 'Menunggu Verifikasi Finance') {
      return { success: false, message: 'Klaim belum berstatus verifikasi Finance.' };
    }

    const timestamp = new Date().toISOString();
    claim.status = 'Siap Dibayar';
    claim.financeNote = note || 'Diverifikasi dan siap untuk pembayaran.';
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Siap Dibayar',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: claim.financeNote,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Klaim berhasil diverifikasi dan ditandai Siap Dibayar.' };
  },

  financeRecordPayment(
    claimId: string,
    actor: Employee,
    payment: { paidAt: string; method: 'Transfer Bank' | 'Tunai'; note?: string }
  ): { success: boolean; message: string } {
    const claims = LocalStore.getClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return { success: false, message: 'Klaim tidak ditemukan.' };

    if (claim.status !== 'Siap Dibayar') {
      return { success: false, message: 'Hanya klaim berstatus Siap Dibayar yang dapat dibayar.' };
    }

    const timestamp = new Date().toISOString();
    const paymentDetails: PaymentDetails = {
      paidAt: payment.paidAt,
      method: payment.method,
      note: payment.note,
      disbursedBy: actor.fullName,
    };

    claim.status = 'Dibayar';
    claim.paymentDetails = paymentDetails;
    claim.activities = claim.activities || [];
    claim.activities.push({
      id: `act-${Date.now()}`,
      claimId,
      action: 'Pembayaran Dicatat',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      timestamp,
      note: `Metode: ${payment.method}. Catatan: ${payment.note || '-'}`,
    });

    LocalStore.setClaims(claims);
    return { success: true, message: 'Pencatatan pembayaran berhasil disimpan.' };
  },

  // Settings
  getSettings(): CompanySettings {
    return LocalStore.getSettings();
  },

  updateSettings(settings: CompanySettings): void {
    LocalStore.setSettings(settings);
  },

  resetAll(): void {
    LocalStore.resetAllData();
  },
};
