'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { getTodayDateString, formatFriendlyDate, formatShortDate } from '@/lib/date-utils';
import { Timeline } from './Timeline';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Calendar as CalendarIcon,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export function CalendarTab() {
  const {
    selectedDate,
    setSelectedDate,
    records,
    openSheet,
    recordsForSelectedDate,
    dayColors,
    setDayColor,
  } = useBaby();

  const today = getTodayDateString();
  const [viewMode, setViewMode] = useState<'mes' | 'ano'>('mes');

  const [selectedY, selectedM] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(selectedY);
  const [viewMonth, setViewMonth] = useState(selectedM); // 1-12

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Days in month calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
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

  // Pre-calculate records markers
  const daysWithRecords = new Set<string>();
  const daysWithFavorites = new Set<string>();

  records.forEach((r) => {
    if (r.type === 'sono') {
      daysWithRecords.add(r.startDate);
      daysWithRecords.add(r.endDate);
    } else {
      daysWithRecords.add(r.date);
    }

    if (r.type === 'nota' && r.isFavorite) {
      daysWithFavorites.add(r.date);
    }
  });

  const isSelectedDateEligibleForAdd = selectedDate <= today;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Top Bar with Mode Selector (Mês / Ano) */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100">
          Calendário
        </h1>

        {/* Segmented Switch: Mês | Ano */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
              viewMode === 'mes'
                ? 'bg-white dark:bg-[#1a1a33] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
              viewMode === 'ano'
                ? 'bg-white dark:bg-[#1a1a33] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Ano
          </button>
        </div>
      </div>

      {/* VIEW: MÊS */}
      {viewMode === 'mes' && (
        <div className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 shadow-xs">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
              {monthNames[viewMonth - 1]} {viewYear}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 mb-2">
            {weekDays.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`cal-empty-${i}`} className="h-10" />
            ))}

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

              // Determine classes for day circle styling (red or yellow circled as requested)
              let dayClasses = '';
              if (isSelected) {
                if (isRed) {
                  dayClasses = 'bg-[#24473D] text-white shadow-xs ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a33] font-bold';
                } else if (isYellow) {
                  dayClasses = 'bg-[#24473D] text-white shadow-xs ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a33] font-bold';
                } else {
                  dayClasses = 'bg-[#24473D] text-white shadow-xs';
                }
              } else if (isRed) {
                // Circled in red
                dayClasses = 'border-2 border-rose-500 text-rose-500 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] font-bold';
              } else if (isYellow) {
                // Circled in yellow
                dayClasses = 'border-2 border-amber-400 text-amber-600 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 shadow-[0_0_8px_rgba(251,191,36,0.3)] font-bold';
              } else if (isTodayDate) {
                dayClasses = 'border-2 border-[#24473D] dark:border-emerald-400 text-[#24473D] dark:text-emerald-300 bg-stone-100/60 dark:bg-slate-800/60';
              } else {
                dayClasses = 'text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800/60';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-10 w-full rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 text-xs font-semibold ${dayClasses}`}
                  aria-label={`${dayNum} de ${monthNames[viewMonth - 1]}${isRed ? ' - Dia Perigoso / Alerta' : isYellow ? ' - Dia de Atenção' : ''}`}
                >
                  <span>{dayNum}</span>

                  <div className="flex items-center gap-0.5 h-1.5 -mb-1">
                    {isRed ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-xs" title="Dia perigoso / alerta" />
                    ) : isYellow ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs" title="Dia de atenção" />
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
      )}

      {/* VIEW: ANO (12 meses com contagem de atividades) */}
      {viewMode === 'ano' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-serif font-bold text-xl text-slate-800 dark:text-slate-100">
              Ano {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewYear((y) => y - 1)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="Ano anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewYear((y) => y + 1)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-stone-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="Próximo ano"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {monthNames.map((name, idx) => {
              const mNum = idx + 1;
              const formattedM = String(mNum).padStart(2, '0');
              const isCurrentViewMonth = viewMonth === mNum;

              // Count records in this month
              const monthRecordCount = records.filter((r) => {
                if (r.type === 'sono') {
                  return (
                    r.startDate.startsWith(`${viewYear}-${formattedM}`) ||
                    r.endDate.startsWith(`${viewYear}-${formattedM}`)
                  );
                }
                return r.date.startsWith(`${viewYear}-${formattedM}`);
              }).length;

              return (
                <button
                  key={name}
                  onClick={() => {
                    setViewMonth(mNum);
                    setViewMode('mes');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 min-h-[80px] flex flex-col justify-between ${
                    isCurrentViewMonth
                      ? 'bg-[#DCE9DF]/40 dark:bg-[#1e2f24]/50 border-[#24473D] dark:border-emerald-500'
                      : 'bg-white dark:bg-[#1a1a33] border-stone-200/70 dark:border-slate-800 hover:border-stone-300'
                  }`}
                >
                  <span className="font-serif font-bold text-sm text-slate-800 dark:text-slate-100">
                    {name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {monthRecordCount > 0
                      ? `${monthRecordCount} ${monthRecordCount === 1 ? 'registro' : 'registros'}`
                      : 'Sem registros'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Header & Quick Add */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Dia Selecionado
            </span>
            <h2 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
              {formatFriendlyDate(selectedDate)}
            </h2>
          </div>

          {/* If past or today date, allow adding a record directly */}
          {isSelectedDateEligibleForAdd && (
            <button
              onClick={() => openSheet('peito')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#24473D] text-white text-xs font-semibold active:scale-95 transition-all shadow-xs min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar</span>
            </button>
          )}
        </div>

        {/* Day Color / Danger Alert Selector Card */}
        <div className="mb-4 p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Sinalizar dia:
                </span>
                {dayColors[selectedDate] === 'vermelho' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    🔴 Dia Perigoso / Alerta
                  </span>
                )}
                {dayColors[selectedDate] === 'amarelo' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    🟡 Dia de Atenção
                  </span>
                )}
                {!dayColors[selectedDate] && (
                  <span className="text-[11px] font-medium text-stone-400">
                    ⚪ Normal / Sem aviso
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Escolha a cor para destacar no calendário (ex: febre, reação ou observação importante):
              </p>
            </div>

            {/* 3 Color Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDayColor(selectedDate, 'vermelho')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[38px] ${
                  dayColors[selectedDate] === 'vermelho'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40 ring-2 ring-rose-400'
                    : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60'
                }`}
                title="Marcar dia como Perigoso / Alerta (Vermelho)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span>Vermelho</span>
              </button>

              <button
                onClick={() => setDayColor(selectedDate, 'amarelo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[38px] ${
                  dayColors[selectedDate] === 'amarelo'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 ring-2 ring-amber-300'
                    : 'bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60'
                }`}
                title="Marcar dia como Atenção (Amarelo)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Amarelo</span>
              </button>

              {dayColors[selectedDate] && (
                <button
                  onClick={() => setDayColor(selectedDate, null)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 border border-stone-200/50 dark:border-slate-800 transition-colors min-h-[38px]"
                  title="Limpar cor deste dia"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline for Selected Date */}
        <Timeline />
      </div>
    </div>
  );
}
