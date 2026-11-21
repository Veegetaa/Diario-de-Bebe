'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayDateString } from '@/lib/date-utils';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface InteractiveDatePickerProps {
  id?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
}

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const fallback = getTodayDateString().split('-').map(Number);
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { year: fallback[0], month: fallback[1] - 1, day: fallback[2] };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return {
    year: Number.isFinite(y) ? y : fallback[0],
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m - 1 : fallback[1] - 1,
    day: Number.isFinite(d) && d >= 1 && d <= 31 ? d : fallback[2],
  };
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatBrazilianDisplay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function InteractiveDatePicker({
  id,
  value,
  onChange,
}: InteractiveDatePickerProps) {
  const todayStr = getTodayDateString();
  const parsedValue = useMemo(() => parseDateParts(value), [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [viewYear, setViewYear] = useState<number>(parsedValue.year);
  const [viewMonth, setViewMonth] = useState<number>(parsedValue.month);
  const [yearGridStart, setYearGridStart] = useState<number>(parsedValue.year - 5);

  const toggleOpen = () => {
    if (!isOpen) {
      setViewYear(parsedValue.year);
      setViewMonth(parsedValue.month);
      setYearGridStart(parsedValue.year - 5);
      setViewMode('days');
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === 'months') {
      setViewYear((y) => y - 1);
    } else {
      setYearGridStart((s) => s - 12);
    }
  };

  const handleNext = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === 'months') {
      setViewYear((y) => y + 1);
    } else {
      setYearGridStart((s) => s + 12);
    }
  };

  const calendarCells = useMemo(() => {
    const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      iso: string;
      day: number;
      inCurrentMonth: boolean;
    }> = [];

    // Leading days from previous month
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push({
        iso: toIsoDate(prevMonthYear, prevMonthIdx, day),
        day,
        inCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        iso: toIsoDate(viewYear, viewMonth, d),
        day: d,
        inCurrentMonth: true,
      });
    }

    // Trailing days from next month to fill full weeks
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const remainder = cells.length % 7;
    const trailingCount = remainder === 0 ? 0 : 7 - remainder;
    for (let d = 1; d <= trailingCount; d++) {
      cells.push({
        iso: toIsoDate(nextMonthYear, nextMonthIdx, d),
        day: d,
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const yearsList = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => yearGridStart + idx);
  }, [yearGridStart]);

  const handleSelectDay = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectMonth = (monthIdx: number) => {
    setViewMonth(monthIdx);
    // Keep same day (clamped to max days in newly selected month) so the date updates immediately
    const maxDay = new Date(viewYear, monthIdx + 1, 0).getDate();
    const clampedDay = Math.min(parsedValue.day, maxDay);
    onChange(toIsoDate(viewYear, monthIdx, clampedDay));
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    const maxDay = new Date(year, viewMonth + 1, 0).getDate();
    const clampedDay = Math.min(parsedValue.day, maxDay);
    onChange(toIsoDate(year, viewMonth, clampedDay));
    setViewMode('days');
  };

  const handleSelectToday = () => {
    const todayParts = parseDateParts(todayStr);
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
    onChange(todayStr);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Clickable Date Display Trigger with Green Calendar Icon */}
      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label="Selecionar data da medição"
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border text-left transition-all min-h-[46px] cursor-pointer ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
            : 'border-stone-200 dark:border-slate-700 hover:border-emerald-500/50'
        }`}
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
          {formatBrazilianDisplay(value)}
        </span>

        <span className="w-9 h-9 -mr-1.5 rounded-lg flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 shrink-0">
          <Calendar className="w-5 h-5 stroke-[2.2]" />
        </span>
      </button>

      {/* Interactive Calendar Panel (Clickable Month, Year, and Day) */}
      {isOpen && (
        <div className="rounded-2xl bg-white dark:bg-[#121226] border border-[#F2C5D5] dark:border-emerald-500/30 p-3.5 shadow-[0_12px_32px_rgba(84,38,57,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] space-y-3">
          {/* Calendar Header: Prev / Clickable Month / Clickable Year / Next */}
          <div className="flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-xl bg-[#FCE7EF] dark:bg-[#1a1a33] border border-[#F2C5D5] dark:border-slate-700/70 text-[#542639] dark:text-slate-200 hover:border-[#D64D83] dark:hover:border-emerald-500/50 hover:text-[#D64D83] dark:hover:text-emerald-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 flex-1 min-w-0">
              {/* Clickable Month Button */}
              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === 'months' ? 'days' : 'months'))
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                  viewMode === 'months'
                    ? 'bg-[#D64D83] dark:bg-emerald-500 text-white dark:text-slate-950'
                    : 'bg-[#FCE7EF] dark:bg-[#1a1a33] text-[#542639] dark:text-slate-100 border border-[#F2C5D5] dark:border-slate-700/70 hover:border-[#D64D83] dark:hover:border-emerald-500/50'
                }`}
              >
                <span className="truncate">{MONTH_NAMES[viewMonth]}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>

              {/* Clickable Year Button */}
              <button
                type="button"
                onClick={() => {
                  if (viewMode !== 'years') {
                    setYearGridStart(viewYear - 5);
                    setViewMode('years');
                  } else {
                    setViewMode('days');
                  }
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold tabular-nums transition-all min-h-[40px] cursor-pointer ${
                  viewMode === 'years'
                    ? 'bg-[#D64D83] dark:bg-emerald-500 text-white dark:text-slate-950'
                    : 'bg-[#FCE7EF] dark:bg-[#1a1a33] text-[#542639] dark:text-slate-100 border border-[#F2C5D5] dark:border-slate-700/70 hover:border-[#D64D83] dark:hover:border-emerald-500/50'
                }`}
              >
                <span>{viewYear}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-xl bg-[#FCE7EF] dark:bg-[#1a1a33] border border-[#F2C5D5] dark:border-slate-700/70 text-[#542639] dark:text-slate-200 hover:border-[#D64D83] dark:hover:border-emerald-500/50 hover:text-[#D64D83] dark:hover:text-emerald-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* VIEW 1: DAYS GRID */}
          {viewMode === 'days' && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((dayName) => (
                  <div
                    key={dayName}
                    className="text-[11px] font-semibold text-[#886576] dark:text-stone-400 py-1"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const isSelected = cell.iso === value;
                  const isToday = cell.iso === todayStr;

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => handleSelectDay(cell.iso)}
                      className={`h-10 rounded-xl text-xs font-semibold tabular-nums flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#D64D83] dark:bg-emerald-500 text-white dark:text-slate-950 font-bold shadow-[0_0_12px_rgba(214,77,131,0.3)] dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                          : isToday
                          ? 'border border-[#D64D83] dark:border-emerald-400/70 text-[#D64D83] dark:text-emerald-300 bg-[#FCE7EF] dark:bg-emerald-500/10 font-bold'
                          : cell.inCurrentMonth
                          ? 'text-[#542639] dark:text-slate-100 hover:bg-[#FCE7EF] dark:hover:bg-[#1f1f3d]'
                          : 'text-[#886576]/45 dark:text-slate-600 hover:bg-[#FFF8FA] dark:hover:bg-[#1a1a33] hover:text-[#886576] dark:hover:text-slate-400'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: CLICKABLE MONTHS GRID */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {SHORT_MONTH_NAMES.map((shortName, idx) => {
                const isActive = idx === viewMonth;
                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#D64D83] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-[0_0_12px_rgba(214,77,131,0.28)] dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-[#FFF8FA] dark:bg-[#1a1a33] text-[#542639] dark:text-slate-200 border border-[#F2C5D5] dark:border-slate-800 hover:border-[#D64D83] dark:hover:border-emerald-500/50 hover:text-[#D64D83] dark:hover:text-emerald-300'
                    }`}
                  >
                    {MONTH_NAMES[idx]}
                  </button>
                );
              })}
            </div>
          )}

          {/* VIEW 3: CLICKABLE YEARS GRID */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2 py-1">
              {yearsList.map((yr) => {
                const isActive = yr === viewYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleSelectYear(yr)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold tabular-nums transition-all min-h-[44px] active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-[#D64D83] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-[0_0_12px_rgba(214,77,131,0.28)] dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-[#FFF8FA] dark:bg-[#1a1a33] text-[#542639] dark:text-slate-200 border border-[#F2C5D5] dark:border-slate-800 hover:border-[#D64D83] dark:hover:border-emerald-500/50 hover:text-[#D64D83] dark:hover:text-emerald-300'
                    }`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer shortcuts */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F2C5D5]/70 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#D64D83] dark:text-emerald-400 hover:bg-[#FCE7EF] dark:hover:bg-emerald-500/10 min-h-[36px] cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#886576] dark:text-stone-400 hover:text-[#542639] dark:hover:text-slate-200 hover:bg-[#FCE7EF] dark:hover:bg-slate-800 min-h-[36px] cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
