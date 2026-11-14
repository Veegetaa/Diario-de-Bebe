import { SleepRecord } from './types';

/**
 * Returns today's date in local device timezone formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date in local device timezone formatted as YYYY-MM-DD
 */
export function getYesterdayDateString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date string shifted by offsetDays (e.g. -1 for previous day, +1 for next day)
 */
export function getAdjacentDateString(dateStr: string, offsetDays: number): string {
  if (!dateStr) return getTodayDateString();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time in local device timezone formatted as HH:mm (24 hours)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats YYYY-MM-DD into friendly Portuguese format
 * e.g., "Hoje, 9 de novembro", "Ontem", "Segunda, 9 de nov.", etc.
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  
  // Calculate day difference
  const [ty, tm, td] = today.split('-').map(Number);
  const todayObj = new Date(ty, tm - 1, td);
  const diffTime = target.getTime() - todayObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  if (diffDays === 0) {
    return `Hoje, ${d} de ${monthNames[m - 1]}`;
  } else if (diffDays === -1) {
    return `Ontem, ${d} de ${monthNames[m - 1]}`;
  } else if (diffDays === 1) {
    return `Amanhã, ${d} de ${monthNames[m - 1]}`;
  }

  const dayWeek = dayNames[target.getDay()];
  return `${dayWeek.charAt(0).toUpperCase() + dayWeek.slice(1)}, ${d} de ${monthNames[m - 1]}`;
}

/**
 * Short date format: "09/11" or "09/11/2026"
 */
export function formatShortDate(dateStr: string, includeYear = false): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return includeYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

/**
 * Formats time from HH:mm to friendly "14h30" or "14:30"
 */
export function format24hTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}h${m}`;
}

/**
 * Converts minutes to friendly duration: e.g. "1h15", "45min", "2h00"
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}min`;
  }
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Validates that a date and optional time is not in the future.
 * Returns an error string if invalid, or null if valid.
 */
export function validateNotFuture(dateStr: string, timeStr?: string): string | null {
  const today = getTodayDateString();
  if (dateStr > today) {
    return 'Data não pode estar no futuro';
  }
  if (dateStr === today && timeStr) {
    const currentTime = getCurrentTimeString();
    if (timeStr > currentTime) {
      return 'Horário não pode estar no futuro';
    }
  }
  return null;
}

/**
 * Calculates duration in minutes between start date/time and end date/time.
 * Supports cross-midnight sessions.
 */
export function calculateSleepDuration(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [sh, smin] = startTime.split(':').map(Number);
  const start = new Date(sy, sm - 1, sd, sh, smin, 0);

  const [ey, em, ed] = endDate.split('-').map(Number);
  const [eh, emin] = endTime.split(':').map(Number);
  const end = new Date(ey, em - 1, ed, eh, emin, 0);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Validates sleep session dates and times:
 * 1. Start not in future
 * 2. End not in future
 * 3. End >= Start
 */
export function validateSleepSession(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): { isValid: boolean; errorField?: 'start' | 'end'; errorMessage?: string } {
  const startFuture = validateNotFuture(startDate, startTime);
  if (startFuture) {
    return { isValid: false, errorField: 'start', errorMessage: 'Início não pode ser no futuro' };
  }
  const endFuture = validateNotFuture(endDate, endTime);
  if (endFuture) {
    return { isValid: false, errorField: 'end', errorMessage: 'Fim não pode ser no futuro' };
  }

  const duration = calculateSleepDuration(startDate, startTime, endDate, endTime);
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [sh, smin] = startTime.split(':').map(Number);
  const start = new Date(sy, sm - 1, sd, sh, smin, 0);

  const [ey, em, ed] = endDate.split('-').map(Number);
  const [eh, emin] = endTime.split(':').map(Number);
  const end = new Date(ey, em - 1, ed, eh, emin, 0);

  if (end < start) {
    return {
      isValid: false,
      errorField: 'end',
      errorMessage: 'Horário de término deve ser igual ou após o início',
    };
  }

  return { isValid: true };
}

/**
 * Checks if a sleep session intersects with a given target date (YYYY-MM-DD),
 * and computes how many minutes of sleep belong specifically to that day.
 */
export function getSleepMinutesForDate(record: SleepRecord, targetDate: string): number {
  if (targetDate < record.startDate || targetDate > record.endDate) {
    return 0;
  }

  const [sh, sm] = record.startTime.split(':').map(Number);
  const startMinutesOfDay = sh * 60 + sm;

  const [eh, em] = record.endTime.split(':').map(Number);
  const endMinutesOfDay = eh * 60 + em;

  // Case 1: Session is contained entirely in this day
  if (record.startDate === targetDate && record.endDate === targetDate) {
    return Math.max(0, endMinutesOfDay - startMinutesOfDay);
  }

  // Case 2: Session started on this day, but ended on a subsequent day
  if (record.startDate === targetDate && record.endDate > targetDate) {
    // From start time until 24:00 (1440 minutes)
    return Math.max(0, 1440 - startMinutesOfDay);
  }

  // Case 3: Session started on a previous day and ended on this day
  if (record.startDate < targetDate && record.endDate === targetDate) {
    // From 00:00 until end time
    return Math.max(0, endMinutesOfDay);
  }

  // Case 4: Session started before this day and ended after this day (covers entire day)
  if (record.startDate < targetDate && record.endDate > targetDate) {
    return 1440;
  }

  return 0;
}

/**
 * Formats sleep record display label:
 * E.g., "Dormiu 13h20 · Acordou 14h35 · Duração 1h15"
 * Or cross-midnight: "Dormiu 23h40 (09/11) · Acordou 00h20 (10/11) · Duração 0h40"
 */
export function formatSleepCardSummary(record: SleepRecord): string {
  const isDifferentDate = record.startDate !== record.endDate;
  const startFmt = format24hTime(record.startTime);
  const endFmt = format24hTime(record.endTime);
  const durFmt = formatDuration(record.durationMinutes);

  if (!isDifferentDate) {
    return `Dormiu ${startFmt} · Acordou ${endFmt} · Duração ${durFmt}`;
  }

  const startDateShort = formatShortDate(record.startDate);
  const endDateShort = formatShortDate(record.endDate);
  return `Dormiu ${startFmt} (${startDateShort}) · Acordou ${endFmt} (${endDateShort}) · Duração ${durFmt}`;
}
