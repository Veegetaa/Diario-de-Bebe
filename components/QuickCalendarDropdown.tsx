'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { getTodayDateString, getYesterdayDateString } from '@/lib/date-utils';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export function QuickCalendarDropdown() {
  const {
    selectedDate,
    setSelectedDate,
    resetToToday,
    records,
    isCalendarDropdownOpen,
    dayColors,
  } = useBaby();

  const today = getTodayDateString();

  // Selected date components
  const [selectedY, selectedM] = selectedDate.split('-').map(Number);
  // View month/year state within the calendar
  const [viewYear, setViewYear] = useState(selectedY);
  const [viewMonth, setViewMonth] = useState(selectedM); // 1-12

  if (!isCalendarDropdownOpen) return null;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Days in month calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0-6
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Pre-calculate records markers for this month
  const daysWithRecords = new Set<string>();
  const daysWithFavorites = new Set<string>();

  records.forEach((r) => {
    if (r.type === 'sono') {
      // Might span across multiple days
      daysWithRecords.add(r.startDate);
      daysWithRecords.add(r.endDate);
    } else {
      daysWithRecords.add(r.date);
    }

    if (r.type === 'nota' && r.isFavorite) {
      daysWithFavorites.add(r.date);
    }
  });

  return (
    <div className="w-full bg-[#FBF7F1] dark:bg-[#18182f] border-b border-stone-200/80 dark:border-slate-800 shadow-sm transition-all px-4 py-3">
      <div className="max-w-md mx-auto">
        {/* Month header & Navigation */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              {monthNames[viewMonth - 1]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              {selectedDate !== today && (
                <button
                  onClick={resetToToday}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-[#DCE9DF] font-semibold hover:opacity-90 transition-opacity"
                >
                  Hoje
                </button>
              )}
              {selectedDate !== getYesterdayDateString() && (
                <button
                  onClick={() => setSelectedDate(getYesterdayDateString())}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-stone-300 font-semibold hover:opacity-90 transition-opacity"
                >
                  Ontem
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 dark:text-stone-500 mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className="py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const formattedDayStr = String(dayNum).padStart(2, '0');
            const formattedMonthStr = String(viewMonth).padStart(2, '0');
            const dateStr = `${viewYear}-${formattedMonthStr}-${formattedDayStr}`;

            const isSelected = dateStr === selectedDate;
            const isTodayDate = dateStr === today;
            const hasRecords = daysWithRecords.has(dateStr);
            const hasFavorite = daysWithFavorites.has(dateStr);
            const dayColor = dayColors[dateStr];
            const isRed = dayColor === 'vermelho';
            const isYellow = dayColor === 'amarelo';

            let dayClasses = '';
            if (isSelected) {
              if (isRed) {
                dayClasses = 'bg-[#24473D] text-white font-bold shadow-xs ring-2 ring-rose-500';
              } else if (isYellow) {
                dayClasses = 'bg-[#24473D] text-white font-bold shadow-xs ring-2 ring-amber-400';
              } else {
                dayClasses = 'bg-[#24473D] text-white font-bold shadow-xs';
              }
            } else if (isRed) {
              dayClasses = 'border-2 border-rose-500 text-rose-500 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-950/40 shadow-[0_0_6px_rgba(244,63,94,0.3)]';
            } else if (isYellow) {
              dayClasses = 'border-2 border-amber-400 text-amber-600 dark:text-amber-300 font-bold bg-amber-50/50 dark:bg-amber-950/40 shadow-[0_0_6px_rgba(251,191,36,0.3)]';
            } else if (isTodayDate) {
              dayClasses = 'border border-[#24473D] dark:border-emerald-400 text-[#24473D] dark:text-emerald-300 font-semibold bg-stone-100/60 dark:bg-slate-800/60';
            } else {
              dayClasses = 'text-slate-700 dark:text-slate-300 hover:bg-stone-200/50 dark:hover:bg-slate-800/50';
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 text-xs font-medium ${dayClasses}`}
                aria-label={`${dayNum} de ${monthNames[viewMonth - 1]}`}
              >
                <span>{dayNum}</span>

                {/* Markers: dot for records, star for favorites */}
                <div className="flex items-center gap-0.5 h-1.5 -mb-1">
                  {isRed ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  ) : isYellow ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ) : hasFavorite ? (
                    <Star
                      className={`w-2 h-2 ${
                        isSelected
                          ? 'text-amber-300 fill-amber-300'
                          : 'text-amber-500 fill-amber-500'
                      }`}
                    />
                  ) : hasRecords ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#24473D] dark:bg-emerald-400'
                      }`}
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
