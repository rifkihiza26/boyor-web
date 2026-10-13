import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'ID karyawan wajib disertakan.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Gunakan service role key jika ada (bisa hapus dari auth.users dan cascade ke profiles),
    // atau fallback ke anon client untuk delete profiles
    const adminClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    const standardClient = createClient(supabaseUrl, anonKey);

    // Cek apakah target bukan DIRUT utama
    const { data: targetProfile } = await (adminClient || standardClient)
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

    if (adminClient) {
      // 1. Coba hapus dari auth.users terlebih dahulu (ini otomatis ON DELETE CASCADE ke profiles & data terkait)
      const { error: authError } = await adminClient.auth.admin.deleteUser(employeeId);
      if (authError) {
        // Jika user tidak ada di auth.users (misal data mock/manual), hapus langsung dari profiles
        const { error: profileError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', employeeId);

        if (profileError) {
          return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
        }
      }
    } else {
      // Fallback anon delete profile
      const { error: delError } = await standardClient
        .from('profiles')
        .delete()
        .eq('id', employeeId);

      if (delError) {
        return NextResponse.json({ success: false, message: delError.message }, { status: 500 });
      }
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
