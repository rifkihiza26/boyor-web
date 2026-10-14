'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee>(DEFAULT_USER);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [gpsCondition, setGpsConditionState] = useState<'INSIDE' | 'OUTSIDE'>('OUTSIDE');
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async (userId?: string) => {
    const [employees, fetchedSettings] = await Promise.all([
      SupabaseService.getEmployees(),
      SupabaseService.getSettings(),
    ]);
    setAllEmployees(employees);
    setSettings(fetchedSettings);

    if (userId) {
      const profile = employees.find((e) => e.id === userId);
      if (profile) setCurrentUser(profile);
      else {
        const fresh = await SupabaseService.getCurrentUser();
        if (fresh) setCurrentUser(fresh);
      }
    } else {
      setCurrentUser(DEFAULT_USER);
    }
  }, []);

  // Supabase Auth state listener
  useEffect(() => {
    let isMounted = true;

    // Check initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadData(session.user.id);
      } else {
        setCurrentUser(DEFAULT_USER);
      }
      setIsLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadData(session.user.id);
      } else {
        setCurrentUser(DEFAULT_USER);
        setAllEmployees([]);
      }
      setIsLoaded(true);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Login berhasil.' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(DEFAULT_USER);
    setAllEmployees([]);
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
