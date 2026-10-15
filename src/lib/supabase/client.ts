import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zckysqcytofpxfuqaexe.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpja3lzcWN5dG9mcHhmdXFhZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3ODk3MDEsImV4cCI6MjEwNzM2NTcwMX0.Ldpy1Bqd_tJmlTOtE8_DOShQLfg3YLl885zaGBKbpVI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Bypass Web Locks API on iOS Safari to prevent permanent orphaned lock deadlock
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    },
  },
});
