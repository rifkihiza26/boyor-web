import { supabase } from '@/lib/supabase/client';
import {
  Employee,
  AttendanceRecord,
  ReimbursementClaim,
  CompanySettings,
  ClaimCategory,
  PaymentDetails,
  ActivityLog,
} from '@/types';
import { getTodayDateStr } from '@/lib/formatters';

// Map database profile row to Employee model
function mapProfileToEmployee(row: any): Employee {
  return {
    id: row.id,
    employeeCode: row.employee_code || '',
    fullName: row.full_name || '',
    email: row.email || '',
    department: row.department || 'Umum',
    jobTitle: row.job_title || 'Staf',
    role: row.role || 'EMPLOYEE',
    isActive: row.is_active ?? true,
    accountStatus: row.account_status || 'PENDING',
    avatarUrl: row.avatar_url,
    phone: row.phone,
    bankAccount: row.bank_name
      ? {
          bankName: row.bank_name,
          accountNumber: row.bank_account_number || '',
          accountHolder: row.bank_account_holder || '',
        }
      : undefined,
  };
}

// Map database attendance row to AttendanceRecord
function mapAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    checkInAt: row.check_in_at ? row.check_in_at.slice(0, 5) : undefined,
    checkOutAt: row.check_out_at ? row.check_out_at.slice(0, 5) : undefined,
    status: row.status,
    totalMinutes: row.total_minutes || 0,
    isLate: row.is_late ?? false,
    distanceMeters: row.distance_meters,
    note: row.note,
  };
}

// Map database claim row to ReimbursementClaim
function mapClaim(row: any, activities: ActivityLog[] = []): ReimbursementClaim {
  return {
    id: row.id,
    claimNumber: row.claim_number,
    employeeId: row.employee_id,
    title: row.title,
    category: row.category,
    transactionDate: row.transaction_date,
    submittedAt: row.submitted_at,
    amount: Number(row.amount),
    description: row.description,
    attachmentName: row.attachment_name,
    attachmentUrl: row.attachment_url,
    status: row.status,
    managerNote: row.manager_note,
    financeNote: row.finance_note,
    paymentDetails: row.paid_at
      ? {
          paidAt: row.paid_at,
          method: row.payment_method || 'Transfer Bank',
          disbursedBy: row.disbursed_by,
        }
      : undefined,
    activities,
  };
}

export const SupabaseService = {
  // ==========================================
  // AUTH & PROFILES
  // ==========================================
  async getCurrentUser(): Promise<Employee | null> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return profile ? mapProfileToEmployee(profile) : null;
  },

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map(mapProfileToEmployee);
  },

  async approveEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'ACTIVE', is_active: true })
      .eq('id', id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Akun pegawai berhasil disetujui.' };
  },

  async rejectEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'REJECTED', is_active: false })
      .eq('id', id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Pendaftaran akun ditolak.' };
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/employees/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Fallback langsung via client Supabase jika API gagal
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) return { success: false, message: data.message || error.message };
        return { success: true, message: 'Akun pegawai berhasil dihapus.' };
      }
      return data;
    } catch {
      // Fallback langsung via client Supabase
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Akun pegawai berhasil dihapus.' };
    }
  },

  // ==========================================
  // COMPANY SETTINGS
  // ==========================================
  async getSettings(): Promise<CompanySettings> {
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (!data) {
      return {
        companyName: 'PT PROTEKSI ALFA SOLUSI (PROASI)',
        officeName: 'Kantor Pusat PROASI',
        officeAddress: 'Jakarta, Indonesia',
        checkInStartTime: '07:00',
        workStartTime: '09:00',
        workEndTime: '18:00',
        lateToleranceMinutes: 15,
      };
    }

    return {
      companyName: data.company_name,
      officeName: data.office_name,
      officeAddress: data.office_address,
      checkInStartTime: data.check_in_start_time ? data.check_in_start_time.slice(0, 5) : '07:00',
      workStartTime: data.work_start_time ? data.work_start_time.slice(0, 5) : '09:00',
      workEndTime: data.work_end_time ? data.work_end_time.slice(0, 5) : '18:00',
      lateToleranceMinutes: data.late_tolerance_minutes || 15,
    };
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<boolean> {
    const payload: any = {};
    if (settings.companyName) payload.company_name = settings.companyName;
    if (settings.officeName) payload.office_name = settings.officeName;
    if (settings.officeAddress) payload.office_address = settings.officeAddress;
    if (settings.checkInStartTime) payload.check_in_start_time = `${settings.checkInStartTime}:00`;
    if (settings.workStartTime) payload.work_start_time = `${settings.workStartTime}:00`;
    if (settings.workEndTime) payload.work_end_time = `${settings.workEndTime}:00`;
    if (settings.lateToleranceMinutes !== undefined) payload.late_tolerance_minutes = settings.lateToleranceMinutes;

    const { error } = await supabase
      .from('company_settings')
      .update(payload)
      .eq('id', 1);

    return !error;
  },

  // ==========================================
  // ATTENDANCE
  // ==========================================
  async getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
    const today = getTodayDateStr();
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    return data ? mapAttendance(data) : null;
  },

  async getAttendanceHistory(employeeId?: string): Promise<AttendanceRecord[]> {
    let query = supabase.from('attendance_records').select('*').order('date', { ascending: false });
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    const { data } = await query;
    return (data || []).map(mapAttendance);
  },

  async checkIn(employeeId: string, settings: CompanySettings): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const today = getTodayDateStr();
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Validasi 1: Batas awal absensi dibuka (earliest check-in)
    const earliestTime = settings.checkInStartTime || '07:00';
    const [earlyH, earlyM] = earliestTime.split(':').map(Number);
    const earliestMinutes = earlyH * 60 + earlyM;

    if (currentMinutes < earliestMinutes) {
      return {
        success: false,
        message: `Absensi belum dibuka. Presensi masuk baru dibuka pukul ${earliestTime} WIB.`,
      };
    }

    // Validasi 2: Perhitungan keterlambatan
    const [startH, startM] = (settings.workStartTime || '09:00').split(':').map(Number);
    const scheduledMinutes = startH * 60 + startM + (settings.lateToleranceMinutes || 0);
    const isLate = currentMinutes > scheduledMinutes;

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert({
        employee_id: employeeId,
        date: today,
        check_in_at: `${checkInTime}:00`,
        check_out_at: null,
        total_minutes: null,
        status: 'SEDANG_BEKERJA',
        is_late: isLate,
        note: isLate ? 'Check-in melewati batas jam toleransi kantor' : 'Tepat waktu',
      }, { onConflict: 'employee_id,date' })
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return {
      success: true,
      message: `Presensi masuk tercatat pukul ${checkInTime} WIB.${isLate ? ' (Terlambat)' : ''}`,
      record: mapAttendance(data),
    };
  },

  async checkOut(employeeId: string): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
    const today = getTodayDateStr();
    const { data: current } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (!current || current.status === 'BELUM_CHECK_IN') {
      return { success: false, message: 'Anda belum melakukan check-in hari ini.' };
    }
    if (current.status === 'SELESAI') {
      return { success: false, message: 'Anda sudah menyelesaikan sesi kerja hari ini.' };
    }

    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let durationMinutes = 480;
    if (current.check_in_at) {
      const [cinH, cinM] = current.check_in_at.split(':').map(Number);
      durationMinutes = Math.max(1, (now.getHours() * 60 + now.getMinutes()) - (cinH * 60 + cinM));
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        check_out_at: `${checkOutTime}:00`,
        status: 'SELESAI',
        total_minutes: durationMinutes,
      })
      .eq('id', current.id)
      .select()
      .single();

    if (error) return { success: false, message: error.message };
    return {
      success: true,
      message: `Presensi pulang tercatat pukul ${checkOutTime} WIB. Total: ${Math.floor(durationMinutes / 60)}j ${durationMinutes % 60}m`,
      record: mapAttendance(data),
    };
  },

  async resetTodayAttendance(employeeId: string): Promise<{ success: boolean; message: string }> {
    const today = getTodayDateStr();
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', today);

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Presensi hari ini telah di-reset ke status awal.' };
  },

  // ==========================================
  // REIMBURSEMENTS
  // ==========================================
  async getClaims(employeeId?: string): Promise<ReimbursementClaim[]> {
    let query = supabase
      .from('reimbursement_claims')
      .select('*, claim_activities(*)')
      .order('created_at', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data } = await query;
    if (!data) return [];

    return (data as any[]).map((row: any) => {
      const acts: ActivityLog[] = (row.claim_activities || []).map((a: any) => ({
        id: a.id,
        claimId: a.claim_id,
        action: a.action,
        actorId: a.actor_id,
        actorName: a.actor_name,
        actorRole: a.actor_role,
        timestamp: a.created_at,
        note: a.note,
      }));
      return mapClaim(row, acts);
    });
  },

  async uploadReceipt(file: File): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { success: false, message: error.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(data.path);

      return { success: true, url: publicUrlData.publicUrl };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal mengupload berkas bukti.' };
    }
  },

  async createClaim(data: {
    employeeId: string;
    title: string;
    category: ClaimCategory;
    transactionDate: string;
    amount: number;
    description: string;
    attachmentName?: string;
    attachmentUrl?: string;
    isDraft?: boolean;
    actor: Employee;
  }): Promise<{ success: boolean; message: string; claim?: ReimbursementClaim }> {
    const today = new Date();
    const yyyymm = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    const claimNumber = `CLM-${yyyymm}-${rand}`;

    const { data: claim, error } = await supabase
      .from('reimbursement_claims')
      .insert({
        claim_number: claimNumber,
        employee_id: data.employeeId,
        title: data.title,
        category: data.category,
        transaction_date: data.transactionDate,
        amount: data.amount,
        description: data.description,
        attachment_name: data.attachmentName || 'bukti_nota.jpg',
        attachment_url: data.attachmentUrl,
        status: data.isDraft ? 'Draft' : 'Menunggu Persetujuan Manager',
      })
      .select()
      .single();

    if (error || !claim) return { success: false, message: error?.message || 'Gagal menyimpan klaim.' };

    if (!data.isDraft) {
      await supabase.from('claim_activities').insert({
        claim_id: claim.id,
        actor_id: data.actor.id,
        actor_name: data.actor.fullName,
        actor_role: data.actor.role,
        action: 'Pengajuan Dikirim',
        note: 'Pengajuan klaim baru dikirim ke Atasan.',
      });
    }

    return {
      success: true,
      message: data.isDraft ? 'Draft tersimpan.' : 'Pengajuan klaim berhasil dikirim.',
      claim: mapClaim(claim),
    };
  },

  async dirutQuickApprove(claimId: string, actor: Employee, note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({
        status: 'Siap Dibayar',
        manager_note: note || 'Disetujui langsung oleh Direktur Utama',
      })
      .eq('id', claimId);

    if (error) return { success: false, message: error.message };

    await supabase.from('claim_activities').insert({
      claim_id: claimId,
      actor_id: actor.id,
      actor_name: actor.fullName,
      actor_role: actor.role,
      action: 'Disetujui Direktur Utama',
      note: note || 'Disetujui langsung oleh Direktur Utama. Siap ditransfer.',
    });

    return { success: true, message: 'Klaim telah disetujui & berstatus Siap Dibayar.' };
  },

  async dirutQuickPay(claimId: string, actor: Employee, method: 'Transfer Bank' | 'Tunai', note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({
        status: 'Dibayar',
        paid_at: new Date().toISOString(),
        payment_method: method,
        disbursed_by: actor.id,
        finance_note: note || `Telah dicairkan via ${method}`,
      })
      .eq('id', claimId);

    if (error) return { success: false, message: error.message };

    await supabase.from('claim_activities').insert({
      claim_id: claimId,
      actor_id: actor.id,
      actor_name: actor.fullName,
      actor_role: actor.role,
      action: 'Pencairan Selesai',
      note: `Dana telah ditransfer (${method}). Catatan: ${note || '-'}`,
    });

    return { success: true, message: 'Pembayaran reimbursement berhasil dicatat lunas.' };
  },

  // ==========================================
  // EMPLOYEE MANAGEMENT
  // ==========================================
  async saveEmployee(employee: Employee): Promise<{ success: boolean; message: string }> {
    const payload: Record<string, unknown> = {
      employee_code: employee.employeeCode,
      full_name: employee.fullName,
      email: employee.email,
      department: employee.department,
      job_title: employee.jobTitle,
      role: employee.role,
      is_active: employee.isActive,
      account_status: employee.accountStatus || 'PENDING',
      phone: employee.phone || null,
      bank_name: employee.bankAccount?.bankName || null,
      bank_account_number: employee.bankAccount?.accountNumber || null,
      bank_account_holder: employee.bankAccount?.accountHolder || null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', employee.id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Data pegawai berhasil disimpan.' };
  },

  async toggleEmployeeActive(id: string, currentActive: boolean): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true, message: !currentActive ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.' };
  },

  // ==========================================
  // CLAIM APPROVAL WORKFLOW
  // ==========================================
  async managerApprove(claimId: string, actor: Employee, note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Menunggu Verifikasi Finance', manager_note: note || 'Disetujui Manager' })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Disetujui Manager', note: note || 'Pengajuan disetujui oleh Manager.',
    });
    return { success: true, message: 'Klaim disetujui oleh Manager.' };
  },

  async managerReject(claimId: string, actor: Employee, note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Ditolak Manager', manager_note: note })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Ditolak Manager', note: note || 'Pengajuan ditolak oleh Manager.',
    });
    return { success: true, message: 'Klaim ditolak.' };
  },

  async financeApproveForPayment(claimId: string, actor: Employee, note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Siap Dibayar', finance_note: note || 'Terverifikasi Finance' })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Diverifikasi Finance', note: note || 'Klaim siap dicairkan.',
    });
    return { success: true, message: 'Klaim siap dibayar.' };
  },

  async financeRequestRevision(claimId: string, actor: Employee, note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Perlu Revisi Finance', finance_note: note })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Perlu Revisi', note: note || 'Diminta revisi oleh Finance.',
    });
    return { success: true, message: 'Klaim diminta revisi.' };
  },

  async recordPayment(claimId: string, actor: Employee, method: 'Transfer Bank' | 'Tunai', note?: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Dibayar', paid_at: new Date().toISOString(), payment_method: method, disbursed_by: actor.id, finance_note: note })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Pembayaran Dicatat', note: `Dibayar via ${method}. ${note || ''}`,
    });
    return { success: true, message: 'Pembayaran berhasil dicatat.' };
  },

  async withdrawClaim(claimId: string, actor: Employee): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('reimbursement_claims')
      .update({ status: 'Dibatalkan' })
      .eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Klaim Dibatalkan', note: 'Klaim ditarik kembali oleh pengaju.',
    });
    return { success: true, message: 'Klaim berhasil dibatalkan.' };
  },

  async updateClaimAndResubmit(claimId: string, updates: { title?: string; amount?: number; description?: string }, actor: Employee): Promise<{ success: boolean; message: string }> {
    const payload: Record<string, unknown> = { status: 'Menunggu Persetujuan Manager' };
    if (updates.title) payload.title = updates.title;
    if (updates.amount) payload.amount = updates.amount;
    if (updates.description) payload.description = updates.description;

    const { error } = await supabase.from('reimbursement_claims').update(payload).eq('id', claimId);
    if (error) return { success: false, message: error.message };
    await supabase.from('claim_activities').insert({
      claim_id: claimId, actor_id: actor.id, actor_name: actor.fullName, actor_role: actor.role,
      action: 'Direvisi & Dikirim Ulang', note: 'Klaim diperbarui dan dikirim ulang.',
    });
    return { success: true, message: 'Klaim berhasil diperbarui dan dikirim ulang.' };
  },

  async getClaimById(claimId: string): Promise<import('@/types').ReimbursementClaim | null> {
    const { data } = await supabase
      .from('reimbursement_claims')
      .select('*, claim_activities(*)')
      .eq('id', claimId)
      .maybeSingle();

    if (!data) return null;

    const acts: import('@/types').ActivityLog[] = (data.claim_activities || []).map((a: any) => ({
      id: a.id,
      claimId: a.claim_id,
      action: a.action,
      actorId: a.actor_id,
      actorName: a.actor_name,
      actorRole: a.actor_role,
      timestamp: a.created_at,
      note: a.note,
    }));

    return {
      id: data.id,
      claimNumber: data.claim_number,
      employeeId: data.employee_id,
      title: data.title,
      category: data.category,
      transactionDate: data.transaction_date,
      submittedAt: data.submitted_at,
      amount: Number(data.amount),
      description: data.description,
      attachmentName: data.attachment_name,
      attachmentUrl: data.attachment_url,
      status: data.status,
      managerNote: data.manager_note,
      financeNote: data.finance_note,
      paymentDetails: data.paid_at ? {
        paidAt: data.paid_at,
        method: data.payment_method || 'Transfer Bank',
        disbursedBy: data.disbursed_by,
      } : undefined,
      activities: acts,
    };
  },
};
