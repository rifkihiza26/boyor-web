'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Employee, UserRole, CompanySettings } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { SupabaseService } from '@/lib/supabase-services';

const DEFAULT_USER: Employee = {
  id: '',
  employeeCode: '',
  fullName: 'Tamu',
  email: '',
  department: '',
  jobTitle: '',
  role: 'EMPLOYEE',
  isActive: false,
  accountStatus: 'PENDING',
};

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'PT PROTEKSI ALFA SOLUSI (PROASI)',
  officeName: 'Kantor Pusat PROASI',
  officeAddress: 'Jakarta, Indonesia',
  checkInStartTime: '07:00',
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateToleranceMinutes: 15,
};

interface AuthContextType {
  currentUser: Employee;
  allEmployees: Employee[];
  role: UserRole;
  gpsCondition: 'INSIDE' | 'OUTSIDE';
  settings: CompanySettings;
  setGpsCondition: (condition: 'INSIDE' | 'OUTSIDE') => void;
  refreshData: () => void;
  isLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  // Legacy compat shims (no-op)
  switchUser: (id: string) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee>(DEFAULT_USER);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [gpsCondition, setGpsConditionState] = useState<'INSIDE' | 'OUTSIDE'>('OUTSIDE');
  const [isLoaded, setIsLoaded] = useState(false);
  const loadingRef = useRef(false);

  const loadData = useCallback(async (userId?: string) => {
    if (!userId) {
      setCurrentUser(DEFAULT_USER);
      setAllEmployees([]);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      // Step 1: Immediately fetch current user's profile first so authentication succeeds immediately
      const profilePromise = Promise.resolve(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      );
      const myProfile: any = await withTimeout(
        profilePromise,
        4000,
        { data: null, error: null } as any
      );

      if (myProfile.data) {
        const row: any = myProfile.data;
        setCurrentUser({
          id: row.id,
          employeeCode: row.employee_code || '',
          fullName: row.full_name || '',
          email: row.email || '',
          department: row.department || 'Umum',
          jobTitle: row.job_title || 'Staf',
          role: (row.role as UserRole) || 'EMPLOYEE',
          isActive: row.is_active ?? true,
          accountStatus: row.account_status || 'ACTIVE',
          phone: row.phone,
          avatarUrl: row.avatar_url,
          bankAccount: row.bank_name ? {
            bankName: row.bank_name,
            accountNumber: row.bank_account_number || '',
            accountHolder: row.bank_account_holder || '',
          } : undefined,
        });
      } else {
        // Fallback user if profile fetch timed out or not yet inserted
        setCurrentUser((prev) => (prev.id === userId ? prev : {
          ...DEFAULT_USER,
          id: userId,
          isActive: true,
          accountStatus: 'ACTIVE',
        }));
      }

      // Step 2: Fetch all employees and settings concurrently (non-blocking for auth)
      const [employees, fetchedSettings] = await Promise.all([
        withTimeout(SupabaseService.getEmployees(), 6000, []),
        withTimeout(SupabaseService.getSettings(), 5000, DEFAULT_SETTINGS),
      ]);

      if (employees.length > 0) setAllEmployees(employees);
      if (fetchedSettings) setSettings(fetchedSettings);
    } catch (err) {
      console.error('[AuthContext] loadData error:', err);
      setCurrentUser((prev) => (prev.id === userId ? prev : {
        ...DEFAULT_USER,
        id: userId,
        isActive: true,
        accountStatus: 'ACTIVE',
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Supabase Auth listener with hard safety timeout for isLoaded
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: isLoaded MUST be true within 2.5 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoaded(true);
    }, 2500);

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadData(session.user.id);
      } else {
        setCurrentUser(DEFAULT_USER);
      }
      if (isMounted) setIsLoaded(true);
    }).catch(() => {
      if (isMounted) setIsLoaded(true);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        await loadData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(DEFAULT_USER);
        setAllEmployees([]);
        setSettings(DEFAULT_SETTINGS);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadData(session.user.id);
      }

      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Realtime updates
  useEffect(() => {
    const profileChannel = supabase
      .channel('rt-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) loadData(data.session.user.id);
        });
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel('rt-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) loadData(data.session.user.id);
        });
      })
      .subscribe();

    const claimsChannel = supabase
      .channel('rt-claims')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursement_claims' }, () => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) loadData(data.session.user.id);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(claimsChannel);
    };
  }, [loadData]);

  const refreshData = useCallback(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadData(data.session.user.id);
    });
  }, [loadData]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      if (!data.session?.user) return { success: false, message: 'Sesi login tidak terbentuk.' };

      await loadData(data.session.user.id);
      return { success: true, message: 'Login berhasil.' };
    } catch (err: any) {
      console.error('[AuthContext] signIn error:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat masuk.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] signOut error:', err);
    }
    setCurrentUser(DEFAULT_USER);
    setAllEmployees([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const setGpsCondition = (condition: 'INSIDE' | 'OUTSIDE') => {
    setGpsConditionState(condition);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allEmployees,
        role: currentUser.role,
        gpsCondition,
        settings,
        setGpsCondition,
        refreshData,
        isLoaded,
        signIn,
        signOut,
        switchUser: () => {},
        resetDemoData: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
