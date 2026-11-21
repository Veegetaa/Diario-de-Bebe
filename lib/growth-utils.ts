import { GrowthRecord } from './types';

/**
 * Parses a YYYY-MM-DD (or DD/MM/YYYY fallback) date string into an exact UTC calendar timestamp.
 * Guarantees strictly chronological calendar ordering independent of insertion order or locale.
 */
export function parseCalendarDateMs(dateStr: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map((p) => Number.parseInt(p, 10));
    if (parts.length === 3 && !parts.some(Number.isNaN)) {
      const [y, m, d] = parts;
      return Date.UTC(y, m - 1, d);
    }
  }

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map((p) => Number.parseInt(p, 10));
    if (parts.length === 3 && !parts.some(Number.isNaN)) {
      const [d, m, y] = parts;
      return Date.UTC(y, m - 1, d);
    }
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Sorts growth measurements strictly in ascending calendar order (Jan -> Feb -> ... -> Dec).
 * If two measurements fall on the exact same calendar day, orders by createdAt ascending.
 */
export function sortGrowthRecordsAsc(records: GrowthRecord[]): GrowthRecord[] {
  return [...records].sort((a, b) => {
    const diff = parseCalendarDateMs(a.date) - parseCalendarDateMs(b.date);
    if (diff !== 0) return diff;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

/**
 * Returns the most recent growth measurement according to calendar date.
 */
export function getLatestGrowthRecord(records: GrowthRecord[]): GrowthRecord | null {
  if (!records || records.length === 0) return null;
  const sorted = sortGrowthRecordsAsc(records);
  return sorted[sorted.length - 1];
}

export function formatWeightKg(val: number): string {
  return val.toFixed(2).replace('.', ',');
}

export function formatHeightCm(val: number): string {
  return val.toFixed(1).replace('.', ',');
}
