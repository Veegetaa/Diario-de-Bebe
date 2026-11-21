'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { getTodayDateString, formatFriendlyDate, format24hTime } from '@/lib/date-utils';
import { MedicationRecord, VaccineRecord } from '@/lib/types';
import { Timeline } from './Timeline';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  ShieldAlert,
  AlertTriangle,
  Pill,
  Syringe,
  X,
} from 'lucide-react';

export function CalendarTab() {
  const {
    selectedDate,
    setSelectedDate,
    records,
    openSheet,
    dayColors,
    setDayColor,
    setViewingRecord,
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
  const daysWithMedications = new Set<string>();
  const daysWithVaccines = new Set<string>();

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
    if (r.type === 'remedio') {
      daysWithMedications.add(r.date);
    }
    if (r.type === 'vacina') {
      daysWithVaccines.add(r.date);
    }
  });

  // Selected day specific markers
  const selectedDayAlert = dayColors[selectedDate];
  const selectedDayMeds = records.filter(
    (r): r is MedicationRecord => r.type === 'remedio' && r.date === selectedDate
  );
  const selectedDayVaccines = records.filter(
    (r): r is VaccineRecord => r.type === 'vacina' && r.date === selectedDate
  );
  const hasSelectedDayMarkers =
    Boolean(selectedDayAlert) || selectedDayMeds.length > 0 || selectedDayVaccines.length > 0;

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
              <div key={`cal-empty-${i}`} className="h-11" />
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
              const hasMed = daysWithMedications.has(dateStr);
              const hasVaccine = daysWithVaccines.has(dateStr);

              const dayColor = dayColors[dateStr];
              const isRed = dayColor === 'vermelho';
              const isYellow = dayColor === 'amarelo';

              // Determine classes for day circle styling (red or yellow circled)
              let dayClasses = '';
              if (isSelected) {
                if (isRed) {
                  dayClasses =
                    'bg-[#24473D] text-white shadow-xs ring-2 ring-rose-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a33] font-bold';
                } else if (isYellow) {
                  dayClasses =
                    'bg-[#24473D] text-white shadow-xs ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a33] font-bold';
                } else {
                  dayClasses = 'bg-[#24473D] text-white shadow-xs';
                }
              } else if (isRed) {
                dayClasses =
                  'border-2 border-rose-500 text-rose-500 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] font-bold';
              } else if (isYellow) {
                dayClasses =
                  'border-2 border-amber-400 text-amber-600 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 shadow-[0_0_8px_rgba(251,191,36,0.3)] font-bold';
              } else if (isTodayDate) {
                dayClasses =
                  'border-2 border-[#24473D] dark:border-emerald-400 text-[#24473D] dark:text-emerald-300 bg-stone-100/60 dark:bg-slate-800/60';
              } else {
                dayClasses =
                  'text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800/60';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-11 w-full rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 text-xs font-semibold ${dayClasses}`}
                  aria-label={`${dayNum} de ${monthNames[viewMonth - 1]}${
                    isRed ? ' - Dia Perigoso / Alerta' : isYellow ? ' - Dia de Atenção' : ''
                  }${hasMed ? ' - Remédio' : ''}${hasVaccine ? ' - Vacina' : ''}`}
                >
                  <span className="leading-none">{dayNum}</span>

                  <div className="flex items-center justify-center gap-0.5 h-3 mt-0.5">
                    {hasMed && (
                      <Pill
                        className={`w-2.5 h-2.5 ${
                          isSelected ? 'text-cyan-200' : 'text-cyan-400'
                        }`}
                      />
                    )}
                    {hasVaccine && (
                      <Syringe
                        className={`w-2.5 h-2.5 ${
                          isSelected ? 'text-violet-200' : 'text-violet-400'
                        }`}
                      />
                    )}
                    {!hasMed && !hasVaccine && (
                      <>
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
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Compact Legend */}
          <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500" />
              <span>Vermelho</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-400" />
              <span>Amarelo</span>
            </span>
            <span className="flex items-center gap-1">
              <Pill className="w-3 h-3 text-cyan-400" />
              <span>Remédio</span>
            </span>
            <span className="flex items-center gap-1">
              <Syringe className="w-3 h-3 text-violet-400" />
              <span>Vacina</span>
            </span>
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

      {/* Selected Day Header & Registrar Button (4 options: Vermelho, Amarelo, Remédio, Vacina) */}
      <div className="pt-1 space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Dia Selecionado
            </span>
            <h2 className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100 truncate">
              {formatFriendlyDate(selectedDate)}
            </h2>
          </div>

          <button
            onClick={() => openSheet('calendario_registrar')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all shadow-xs min-h-[44px] shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar</span>
          </button>
        </div>

        {/* Active Day Markers Summary (Alert Color, Medications, Vaccines) */}
        {hasSelectedDayMarkers && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-2.5 shadow-xs">
            {/* Alert color row */}
            {selectedDayAlert && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {selectedDayAlert === 'vermelho' ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-rose-400">Alerta Vermelho · Dia Perigoso</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="text-amber-300">Alerta Amarelo · Dia de Atenção</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDayColor(selectedDate, null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-slate-200 hover:bg-slate-800 min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Remover cor do dia"
                  aria-label="Remover sinalização de cor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Medications on this day */}
            {selectedDayMeds.length > 0 && (
              <div
                className={`space-y-1.5 ${
                  selectedDayAlert ? 'pt-2 border-t border-slate-800' : ''
                }`}
              >
                {selectedDayMeds.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => setViewingRecord(med)}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/35 hover:bg-cyan-100/80 dark:hover:bg-cyan-950/55 border border-cyan-200 dark:border-cyan-500/25 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Pill className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#4A2034] dark:text-slate-100 truncate">
                          {med.name}
                        </span>
                        {med.notes && (
                          <span className="block text-[11px] text-[#8C5A70] dark:text-stone-400 truncate">
                            {med.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    {med.time && (
                      <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 tabular-nums shrink-0">
                        {format24hTime(med.time)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Vaccines on this day */}
            {selectedDayVaccines.length > 0 && (
              <div
                className={`space-y-1.5 ${
                  selectedDayAlert || selectedDayMeds.length > 0
                    ? 'pt-2 border-t border-rose-100 dark:border-slate-800'
                    : ''
                }`}
              >
                {selectedDayVaccines.map((vac) => (
                  <button
                    key={vac.id}
                    type="button"
                    onClick={() => setViewingRecord(vac)}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-fuchsia-50 dark:bg-violet-950/35 hover:bg-fuchsia-100/80 dark:hover:bg-violet-950/55 border border-fuchsia-200 dark:border-violet-500/25 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Syringe className="w-4 h-4 text-fuchsia-600 dark:text-violet-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#4A2034] dark:text-slate-100 truncate">
                          Vacina · {vac.name}
                        </span>
                        {vac.notes && (
                          <span className="block text-[11px] text-[#8C5A70] dark:text-stone-400 truncate">
                            {vac.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    {vac.time && (
                      <span className="text-[11px] font-semibold text-fuchsia-700 dark:text-violet-300 tabular-nums shrink-0">
                        {format24hTime(vac.time)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline for Selected Date */}
        <Timeline />
      </div>
    </div>
  );
}
