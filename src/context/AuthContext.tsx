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

/** Wrap a promise with a timeout so it never hangs forever */
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
  const loadingRef = useRef(false); // Prevent concurrent loadData calls

  const loadData = useCallback(async (userId?: string) => {
    // Prevent concurrent calls - if already loading, skip
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      // Fetch employees and settings with 8-second timeout each
      const [employees, fetchedSettings] = await Promise.all([
        withTimeout(SupabaseService.getEmployees(), 8000, []),
        withTimeout(SupabaseService.getSettings(), 8000, DEFAULT_SETTINGS),
      ]);

      setAllEmployees(employees);
      setSettings(fetchedSettings);

      if (userId) {
        const profile = employees.find((e) => e.id === userId);
        if (profile) {
          setCurrentUser(profile);
        } else {
          // Profile not in employees list - try direct fetch with timeout
          const fresh = await withTimeout(SupabaseService.getCurrentUser(), 5000, null);
          if (fresh) {
            setCurrentUser(fresh);
          } else {
            // Absolute fallback - at least set user ID so auth guard works
            setCurrentUser({
              ...DEFAULT_USER,
              id: userId,
              isActive: true,
              accountStatus: 'ACTIVE',
            });
          }
        }
      } else {
        setCurrentUser(DEFAULT_USER);
      }
    } catch (err) {
      console.error('[AuthContext] loadData error:', err);
      // Even on error, if we have userId, set minimal user so app doesn't stuck
      if (userId) {
        setCurrentUser((prev) =>
          prev.id === userId ? prev : { ...DEFAULT_USER, id: userId, isActive: true, accountStatus: 'ACTIVE' }
        );
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Supabase Auth state listener - single source of truth
  useEffect(() => {
    let isMounted = true;

    // 1. Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadData(session.user.id);
      } else {
        setCurrentUser(DEFAULT_USER);
      }
      if (isMounted) setIsLoaded(true);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await loadData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(DEFAULT_USER);
        setAllEmployees([]);
        setSettings(DEFAULT_SETTINGS);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silently refresh data on token refresh
        await loadData(session.user.id);
      }

      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Supabase Realtime subscriptions
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
      if (!data.session?.user) return { success: false, message: 'Sesi tidak ditemukan setelah login.' };

      // DON'T call loadData here - onAuthStateChange SIGNED_IN will handle it
      // This prevents double-loading race condition
      // But we DO need to wait until loadData finishes from the listener
      // So we manually call it once to ensure data is ready before returning
      await loadData(data.session.user.id);

      return { success: true, message: 'Login berhasil.' };
    } catch (err: any) {
      console.error('[AuthContext] signIn error:', err);
      return { success: false, message: err?.message || 'Terjadi kesalahan saat login.' };
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
        // Legacy no-op shims
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
