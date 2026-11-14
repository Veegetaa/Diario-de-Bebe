'use client';

import React from 'react';
import { validateNotFuture, getCurrentTimeString } from '@/lib/date-utils';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface SpecificTimeToggleProps {
  hasSpecificTime: boolean;
  onToggle: (checked: boolean) => void;
  date?: string;
  onDateChange?: (date: string) => void;
  time: string;
  onTimeChange: (time: string) => void;
  timeError?: string | null;
  hideDate?: boolean;
}

export function SpecificTimeToggle({
  hasSpecificTime,
  onToggle,
  date,
  onDateChange,
  time,
  onTimeChange,
  timeError,
  hideDate = false,
}: SpecificTimeToggleProps) {
  const handleNow = () => {
    onTimeChange(getCurrentTimeString());
  };

  return (
    <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3.5 border border-stone-200/60 dark:border-slate-800/80 mb-4 transition-all">
      {/* Switch Row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="specific-time-toggle"
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <Clock className="w-4 h-4 text-stone-500 dark:text-stone-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Horário específico
          </span>
        </label>

        {/* Toggle switch */}
        <button
          type="button"
          id="specific-time-toggle"
          role="switch"
          aria-checked={hasSpecificTime}
          onClick={() => onToggle(!hasSpecificTime)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center p-0.5`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              hasSpecificTime ? 'translate-x-2.5 bg-[#24473D]' : '-translate-x-2.5 bg-stone-300'
            }`}
          />
        </button>
      </div>

      {/* Expanded controls when toggled ON */}
      {hasSpecificTime && (
        <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-slate-800 space-y-2.5 animate-in fade-in-50 duration-150">
          <div className={hideDate ? 'w-full' : 'grid grid-cols-2 gap-2.5'}>
            {/* Time picker */}
            <div>
              <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
                Horário (24h)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Selecionar horário"
                />
                <button
                  type="button"
                  onClick={handleNow}
                  className="px-3 py-2 rounded-xl bg-stone-200/70 dark:bg-slate-700 text-stone-800 dark:text-stone-100 text-xs font-semibold hover:bg-stone-300 transition-colors shrink-0 min-h-[38px]"
                  title="Definir horário atual"
                >
                  Agora
                </button>
              </div>
            </div>

            {/* Date picker (only if hideDate is false) */}
            {!hideDate && (
              <div>
                <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={date || ''}
                  onChange={(e) => onDateChange?.(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Selecionar data"
                />
              </div>
            )}
          </div>

          {/* Validation error message */}
          {timeError && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{timeError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
