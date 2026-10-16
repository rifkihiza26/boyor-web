import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'ID karyawan wajib disertakan.' }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zckysqcytofpxfuqaexe.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja3lzcWN5dG9mcHhmdXFhZXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTc4OTcwMSwiZXhwIjoyMTA3MzY1NzAxfQ.jWYqG3TzP8RrtXRXhoC8_Jh3l_SwuJavfEJCVzYmHcU';
    const activeServiceKey = serviceRoleKey || defaultServiceKey;

    const adminClient = createClient(supabaseUrl, activeServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Cek target profil & lindungi akun DIRUT
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', employeeId)
      .single();

    if (targetProfile?.role === 'DIRUT') {
      return NextResponse.json(
        { success: false, message: 'Akun Direktur Utama tidak dapat dihapus.' },
        { status: 403 }
      );
    }

    // ─── Hapus data terkait secara berurutan sesuai dependency ───

    // 1. Hapus claim_activities di mana karyawan ini adalah ACTOR
    const { error: actorActivitiesError } = await adminClient
      .from('claim_activities')
      .delete()
      .eq('actor_id', employeeId);

    if (actorActivitiesError) {
      console.error('Error deleting actor activities:', actorActivitiesError.message);
    }

    // 2. Ambil semua klaim milik karyawan ini
    const { data: employeeClaims } = await adminClient
      .from('reimbursement_claims')
      .select('id')
      .eq('employee_id', employeeId);

    const claimIds = (employeeClaims || []).map((c: { id: string }) => c.id);

    if (claimIds.length > 0) {
      // 3. Hapus claim_activities dari klaim milik karyawan ini
      const { error: claimActivitiesError } = await adminClient
        .from('claim_activities')
        .delete()
        .in('claim_id', claimIds);

      if (claimActivitiesError) {
        console.error('Error deleting claim activities:', claimActivitiesError.message);
      }

      // 4. Hapus reimbursement_claims milik karyawan ini
      const { error: claimsError } = await adminClient
        .from('reimbursement_claims')
        .delete()
        .eq('employee_id', employeeId);

      if (claimsError) {
        console.error('Error deleting claims:', claimsError.message);
      }
    }

    // 5. Hapus attendance_records milik karyawan ini
    const { error: attendanceError } = await adminClient
      .from('attendance_records')
      .delete()
      .eq('employee_id', employeeId);

    if (attendanceError) {
      console.error('Error deleting attendance:', attendanceError.message);
    }

    // 6. Hapus dari auth.users (user tidak bisa login lagi)
    const { error: authError } = await adminClient.auth.admin.deleteUser(employeeId);
    if (authError && !authError.message.toLowerCase().includes('not found')) {
      console.error('Error deleting from auth.users:', authError.message);
    }

    // 7. Hapus profil karyawan
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', employeeId);

    if (profileError) {
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Akun karyawan ${targetProfile?.full_name || ''} beserta seluruh datanya berhasil dihapus secara permanen.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Terjadi kesalahan server saat menghapus akun.' },
      { status: 500 }
    );
  }
}
