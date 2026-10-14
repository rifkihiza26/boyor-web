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
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja3lzcWN5dG9mcHhmdXFhZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODk3MDEsImV4cCI6MjEwNzM2NTcwMX0.Ldpy1Bqd_tJmlTOtE8_DOShQLfg3YLl885zaGBKbpVI';

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

    // 1. Hapus dari auth.users (ini membuat user seketika TIDAK BISA LOGIN LAGI)
    const { error: authError } = await adminClient.auth.admin.deleteUser(employeeId);
    if (authError && !authError.message.toLowerCase().includes('not found')) {
      console.error('Error deleting from auth.users:', authError);
    }

    // 2. Hapus secara eksplisit dari profiles dan relasinya agar bersih dari daftar
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', employeeId);

    if (profileError) {
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Akun karyawan ${targetProfile?.full_name || ''} berhasil dihapus secara permanen.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Terjadi kesalahan server saat menghapus akun.' },
      { status: 500 }
    );
  }
}
