'use client';

import React, { useState, useEffect } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  formatFriendlyDate,
  formatDuration,
  getTodayDateString,
} from '@/lib/date-utils';
import { Moon, Clock, Sparkles } from 'lucide-react';

export function SummaryCard() {
  const {
    activeSleep,
    totalSleepMinutesForSelectedDate,
    selectedDate,
    recordsForSelectedDate,
    openSheet,
  } = useBaby();

  const today = getTodayDateString();
  const isToday = selectedDate === today;

  // Live timer for active sleep
  const [minutesAsleep, setMinutesAsleep] = useState(0);

  useEffect(() => {
    if (!activeSleep) return;

    const updateMinutes = () => {
      const diffMs = Date.now() - activeSleep.startedAtTimestamp;
      setMinutesAsleep(Math.max(0, Math.floor(diffMs / (1000 * 60))));
    };

    updateMinutes();
    const interval = setInterval(updateMinutes, 30000); // every 30s
    return () => clearInterval(interval);
  }, [activeSleep]);

  const hasAnyRecords = recordsForSelectedDate.length > 0 || activeSleep !== null;

  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-white via-white to-[#FAF6F0] dark:from-[#1b1b36] dark:via-[#181830] dark:to-[#141427] rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] border border-stone-300 dark:border-slate-800 transition-all">
      {/* Top subtle ambient light */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header: Context date & Routine Title */}
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 dark:border-slate-800 mb-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#24473D] dark:text-emerald-400 block mb-0.5">
            {isToday ? 'Rotina de Hoje' : 'Histórico do Dia'}
          </span>
          <h2 className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
            {formatFriendlyDate(selectedDate)}
          </h2>
        </div>

        {/* Status of Baby Sleep */}
        {activeSleep ? (
          <button
            onClick={() => openSheet('sono')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#EDE4F5] to-[#E2D5ED] dark:from-[#3a2752] dark:to-[#2c1c40] text-indigo-950 dark:text-indigo-200 text-xs font-semibold shadow-xs border border-indigo-300/40 dark:border-indigo-500/30 active:scale-95 transition-all group"
            title="Tocar para registrar que acordou"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 relative" />
            </div>
            <Moon className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500 stroke-[2.2]" />
            <span>Dormindo ({formatDuration(minutesAsleep)})</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 text-stone-200 text-xs font-medium border border-slate-700/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 stroke-[2.2]" />
            <span>Acordado(a)</span>
          </div>
        )}
      </div>

      {/* Sleep summary for this day */}
      <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Sono contabilizado nesta data:
          </span>
        </div>
        <span className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
          {formatDuration(totalSleepMinutesForSelectedDate)}
        </span>
      </div>

      {/* Empty state guidance if day is completely blank */}
      {!hasAnyRecords && (
        <div className="mt-3.5 p-3 rounded-2xl bg-[#DCE9DF]/30 dark:bg-[#24473D]/15 border border-[#DCE9DF]/70 dark:border-[#24473D]/30 text-center">
          <p className="text-xs text-[#24473D] dark:text-emerald-300">
            {isToday
              ? 'Nenhum registro marcado hoje ainda. Seus registros de outros dias continuam salvos no histórico!'
              : 'Nenhum registro encontrado nesta data.'}
          </p>
        </div>
      )}
    </section>
  );
}
