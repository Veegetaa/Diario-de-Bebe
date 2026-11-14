'use client';

import React, { useState, useMemo } from 'react';
import { useBaby } from '@/context/BabyContext';
import { RecordCard } from './RecordCard';
import { BabyRecord } from '@/lib/types';
import {
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  History,
  ArrowRight,
} from 'lucide-react';
import {
  getTodayDateString,
  getYesterdayDateString,
  formatFriendlyDate,
} from '@/lib/date-utils';

const INITIAL_LIMIT = 4;

export function Timeline() {
  const {
    records,
    recordsForSelectedDate,
    selectedDate,
    setSelectedDate,
    toggleCalendarDropdown,
  } = useBaby();
  const [isExpanded, setIsExpanded] = useState(false);

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const isToday = selectedDate === today;
  const isYesterday = selectedDate === yesterday;

  // Count records for today and yesterday
  const countToday = useMemo(() => {
    return records.filter((r) => {
      if (r.type === 'sono') {
        return today >= r.startDate && today <= r.endDate;
      }
      return r.date === today;
    }).length;
  }, [records, today]);

  const countYesterday = useMemo(() => {
    return records.filter((r) => {
      if (r.type === 'sono') {
        return yesterday >= r.startDate && yesterday <= r.endDate;
      }
      return r.date === yesterday;
    }).length;
  }, [records, yesterday]);

  // Helper to extract 24h time for chronological ordering
  const getTimeString = (record: BabyRecord): string => {
    if (record.type === 'sono') {
      return record.endTime || record.startTime;
    }
    return record.time || '00:00';
  };

  // Sort all records chronologically from newest to oldest within the 24h day
  const sortedRecords = [...recordsForSelectedDate].sort((a, b) => {
    const timeA = getTimeString(a);
    const timeB = getTimeString(b);
    if (timeA !== timeB) {
      return timeB.localeCompare(timeA);
    }
    return b.createdAt - a.createdAt;
  });

  const totalCount = sortedRecords.length;

  if (totalCount === 0) {
    return (
      <div className="w-full space-y-3 pb-2">
        {/* Quick Date Switcher Bar (Hoje / Ontem / Calendário) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider pl-1 shrink-0">
            Exibindo:
          </span>
          <button
            onClick={() => setSelectedDate(today)}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all min-h-[36px] ${
              isToday
                ? 'bg-[#24473D] text-white shadow-2xs'
                : 'bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70'
            }`}
          >
            Hoje ({countToday})
          </button>
          <button
            onClick={() => setSelectedDate(yesterday)}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all min-h-[36px] ${
              isYesterday
                ? 'bg-[#24473D] text-white shadow-2xs'
                : 'bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70'
            }`}
          >
            Ontem ({countYesterday})
          </button>
          <button
            onClick={toggleCalendarDropdown}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full font-medium whitespace-nowrap bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70 min-h-[36px]"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Outra Data</span>
          </button>
        </div>

        {/* Informative Reassuring Empty State */}
        <div className="w-full py-8 px-4 text-center bg-white dark:bg-[#1a1a33]/60 backdrop-blur-xs rounded-3xl border border-stone-300 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#24473D] dark:text-emerald-400 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-6 h-6 stroke-[1.8]" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-200">
              {isToday ? 'Nenhum registro feito hoje ainda' : `Nenhum registro em ${formatFriendlyDate(selectedDate)}`}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isToday ? (
                countYesterday > 0 ? (
                  <>
                    Seus registros de dias anteriores continuam todos salvos com segurança no banco de dados! Ontem você teve{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">{countYesterday} registros</strong> salvos.
                  </>
                ) : (
                  'Use os botões acima para registrar a primeira mamada, sono ou fralda do dia com um toque!'
                )
              ) : (
                'Para ver os registros deste diário, volte para Hoje ou selecione uma data no calendário.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {isToday && countYesterday > 0 && (
              <button
                onClick={() => setSelectedDate(yesterday)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#24473D] text-white text-xs font-semibold active:scale-95 transition-all shadow-xs min-h-[38px]"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver o que foi marcado ontem ({countYesterday})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="px-4 py-2 rounded-xl bg-[#24473D] text-white text-xs font-semibold active:scale-95 transition-all shadow-xs min-h-[38px]"
              >
                Voltar para Hoje ({countToday})
              </button>
            )}

            <button
              onClick={toggleCalendarDropdown}
              className="px-3.5 py-2 rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-300/80 min-h-[38px]"
            >
              Abrir Calendário
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display only 4 if not expanded, or all if expanded
  const displayedRecords = isExpanded ? sortedRecords : sortedRecords.slice(0, INITIAL_LIMIT);
  const remainingCount = totalCount - INITIAL_LIMIT;

  return (
    <div className="w-full space-y-3.5 pb-2">
      {/* Quick Date Switcher Bar (Hoje / Ontem / Calendário) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider pl-1 shrink-0">
          Exibindo:
        </span>
        <button
          onClick={() => setSelectedDate(today)}
          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all min-h-[36px] ${
            isToday
              ? 'bg-[#24473D] text-white shadow-2xs'
              : 'bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70'
          }`}
        >
          Hoje ({countToday})
        </button>
        <button
          onClick={() => setSelectedDate(yesterday)}
          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all min-h-[36px] ${
            isYesterday
              ? 'bg-[#24473D] text-white shadow-2xs'
              : 'bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70'
          }`}
        >
          Ontem ({countYesterday})
        </button>
        <button
          onClick={toggleCalendarDropdown}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-medium whitespace-nowrap bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/70 min-h-[36px]"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Outra Data</span>
        </button>
      </div>

      {/* 24h Timeline Header with refined typography */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#DCE9DF]/60 dark:bg-[#24473D]/40 text-[#24473D] dark:text-emerald-300 flex items-center justify-center shadow-2xs">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="font-serif font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">
            Linha do Tempo
          </span>
          <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 tabular-nums">
            ({isToday ? 'Hoje' : isYesterday ? 'Ontem' : formatFriendlyDate(selectedDate)})
          </span>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-stone-300 tabular-nums border border-stone-200/60 dark:border-slate-700/60">
          {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Unified 24h Chronological list */}
      <div className="space-y-2.5">
        {displayedRecords.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>

      {/* "Ver mais" / "Ocultar" Expand/Collapse Control */}
      {totalCount > INITIAL_LIMIT && (
        <div className="pt-1">
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full py-3 px-4 rounded-2xl bg-white/80 dark:bg-[#1a1a33]/80 hover:bg-white dark:hover:bg-[#20203f] border border-stone-200/80 dark:border-slate-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs font-semibold text-[#24473D] dark:text-emerald-300 min-h-[44px] cursor-pointer group"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Ocultar registros adicionais' : `Ver mais ${remainingCount} registros`}
          >
            {isExpanded ? (
              <>
                <span>Ocultar registros (mostrar 4)</span>
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              </>
            ) : (
              <>
                <span>Ver mais ({remainingCount} {remainingCount === 1 ? 'restante' : 'restantes'})</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
