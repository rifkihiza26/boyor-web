import {
  Employee,
  AttendanceRecord,
  ReimbursementClaim,
  CompanySettings,
  UserRole,
} from '@/types';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_CLAIMS,
} from '@/lib/mock-data/seed';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'proasi_v2_current_user_id',
  SIMULATED_LOCATION: 'proasi_v2_simulated_location',
  EMPLOYEES: 'proasi_v2_employees',
  ATTENDANCE: 'proasi_v2_attendance',
  CLAIMS: 'proasi_v2_claims',
  SETTINGS: 'proasi_v2_settings',
};

// Safe localStorage helper
let legacyPurged = false;
function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  if (!legacyPurged) {
    legacyPurged = true;
    ['byr_current_user_id', 'byr_simulated_location', 'byr_employees', 'byr_attendance', 'byr_claims', 'byr_settings'].forEach((k) => {
      try { window.localStorage.removeItem(k); } catch {}
    });
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

export const LocalStore = {
  // Current user / demo role
  getCurrentUserId(): string {
    return safeGet<string>(STORAGE_KEYS.CURRENT_USER_ID, 'emp-1'); // Default Admin (DIRUT)
  },
  setCurrentUserId(id: string): void {
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  // Simulated GPS condition ('INSIDE' = within radius, 'OUTSIDE' = out of radius)
  getSimulatedLocation(): 'INSIDE' | 'OUTSIDE' {
    return safeGet<'INSIDE' | 'OUTSIDE'>(STORAGE_KEYS.SIMULATED_LOCATION, 'INSIDE');
  },
  setSimulatedLocation(condition: 'INSIDE' | 'OUTSIDE'): void {
    safeSet(STORAGE_KEYS.SIMULATED_LOCATION, condition);
  },

  // Employees
  getEmployees(): Employee[] {
    return safeGet<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  },
  setEmployees(employees: Employee[]): void {
    safeSet(STORAGE_KEYS.EMPLOYEES, employees);
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return safeGet<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  setAttendance(records: AttendanceRecord[]): void {
    safeSet(STORAGE_KEYS.ATTENDANCE, records);
  },

  // Claims
  getClaims(): ReimbursementClaim[] {
    return safeGet<ReimbursementClaim[]>(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
  },
  setClaims(claims: ReimbursementClaim[]): void {
    safeSet(STORAGE_KEYS.CLAIMS, claims);
  },

  // Settings
  getSettings(): CompanySettings {
    return safeGet<CompanySettings>(STORAGE_KEYS.SETTINGS, INITIAL_COMPANY_SETTINGS);
  },
  setSettings(settings: CompanySettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  // Reset demo data
  resetAllData(): void {
    if (typeof window === 'undefined') return;
    ['byr_current_user_id', 'byr_simulated_location', 'byr_employees', 'byr_attendance', 'byr_claims', 'byr_settings',
     STORAGE_KEYS.CURRENT_USER_ID, STORAGE_KEYS.SIMULATED_LOCATION, STORAGE_KEYS.EMPLOYEES, STORAGE_KEYS.ATTENDANCE, STORAGE_KEYS.CLAIMS, STORAGE_KEYS.SETTINGS
    ].forEach((k) => window.localStorage.removeItem(k));
  },
};
