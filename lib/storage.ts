import { BabyProfile, BabyRecord, ActiveSleepSession, DayColorsMap } from './types';
import { getTodayDateString } from './date-utils';

const STORAGE_KEYS = {
  RECORDS: 'diario_do_bebe_records_v1',
  PROFILE: 'diario_do_bebe_profile_v1',
  ACTIVE_SLEEP: 'diario_do_bebe_active_sleep_v1',
  THEME_OVERRIDE: 'diario_do_bebe_theme_override_v1', // 'auto' | 'light' | 'dark'
  HAS_SEEN_WELCOME: 'diario_do_bebe_has_seen_welcome_v1',
  FAMILY_CODE: 'diario_do_bebe_family_code_v1',
  DAY_COLORS: 'diario_do_bebe_day_colors_v1',
};

export const DEFAULT_PROFILE: BabyProfile = {
  id: 'profile-default',
  name: 'Maya',
  birthDate: '2026-08-15',
  gender: 'menina',
  notes: 'Nosso raio de sol.',
};

/**
 * Retorna lista vazia no primeiro acesso conforme solicitado pelo usuário
 */
export function generateInitialRecords(): BabyRecord[] {
  return [];
}

export function loadProfileFromStorage(): BabyProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading profile from localStorage', e);
  }
  return DEFAULT_PROFILE;
}

export function saveProfileToStorage(profile: BabyProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile to localStorage', e);
  }
}

export function loadRecordsFromStorage(): BabyRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any mock/seed records so user has a clean empty timeline
        const userOnly = parsed.filter(
          (r: BabyRecord) => !r.id.startsWith('rec-init-')
        );
        if (userOnly.length !== parsed.length) {
          saveRecordsToStorage(userOnly);
        }
        return userOnly;
      }
    }
  } catch (e) {
    console.error('Error reading records from localStorage', e);
  }
  return [];
}

export function saveRecordsToStorage(records: BabyRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records to localStorage', e);
  }
}

export function loadActiveSleepFromStorage(): ActiveSleepSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SLEEP);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading active sleep from localStorage', e);
  }
  return null;
}

export function saveActiveSleepToStorage(session: ActiveSleepSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SLEEP, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SLEEP);
    }
  } catch (e) {
    console.error('Error saving active sleep to localStorage', e);
  }
}

export function loadThemeOverrideFromStorage(): 'auto' | 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME_OVERRIDE);
    if (raw === 'dark') return 'dark';
  } catch (e) {
    console.error('Error reading theme from localStorage', e);
  }
  return 'dark';
}

export function saveThemeOverrideToStorage(mode: 'auto' | 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_OVERRIDE, mode);
  } catch (e) {
    console.error('Error saving theme to localStorage', e);
  }
}

export function loadFamilyCodeFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAMILY_CODE);
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim().toUpperCase();
    }
  } catch (e) {
    console.error('Error reading family code from localStorage', e);
  }
  return null;
}

export function saveFamilyCodeToStorage(code: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      localStorage.setItem(STORAGE_KEYS.FAMILY_CODE, code.trim().toUpperCase());
    } else {
      localStorage.removeItem(STORAGE_KEYS.FAMILY_CODE);
    }
  } catch (e) {
    console.error('Error saving family code to localStorage', e);
  }
}

export function loadDayColorsFromStorage(): DayColorsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAY_COLORS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading day colors from localStorage', e);
  }
  return {};
}

export function saveDayColorsToStorage(colors: DayColorsMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.DAY_COLORS, JSON.stringify(colors));
  } catch (e) {
    console.error('Error saving day colors to localStorage', e);
  }
}

