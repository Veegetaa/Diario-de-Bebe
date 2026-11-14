'use client';

import React, { useState, useEffect } from 'react';
import { useBaby } from '@/context/BabyContext';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import {
  getCurrentTimeString,
  getTodayDateString,
  format24hTime,
  formatFriendlyDate,
  formatDuration,
  validateNotFuture,
  calculateSleepDuration,
  validateSleepSession,
} from '@/lib/date-utils';
import { SleepRecord } from '@/lib/types';
import { X, Moon, Sparkles, AlertCircle } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

function SleepSheetContent() {
  const {
    closeSheet,
    activeSleep,
    startSleepSession,
    finishSleepSession,
    cancelSleepSession,
    addRecord,
    selectedDate,
  } = useBaby();

  const today = getTodayDateString();
  const isPastDate = selectedDate < today;

  // Manual / Previous sleep mode
  const [isManualPastMode, setIsManualPastMode] = useState(() => isPastDate && !activeSleep);

  // Form state for starting sleep
  const [hasSpecificStartTime, setHasSpecificStartTime] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState(() => getCurrentTimeString());
  const [startError, setStartError] = useState<string | null>(null);

  // Form state for waking up
  const [hasSpecificEndTime, setHasSpecificEndTime] = useState(false);
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [endTime, setEndTime] = useState(() => getCurrentTimeString());
  const [endError, setEndError] = useState<string | null>(null);

  // Form state for full past sleep session
  const [pastStartDate, setPastStartDate] = useState(selectedDate);
  const [pastStartTime, setPastStartTime] = useState('13:00');
  const [pastEndDate, setPastEndDate] = useState(selectedDate);
  const [pastEndTime, setPastEndTime] = useState('14:30');
  const [pastError, setPastError] = useState<string | null>(null);

  // Live timer for ongoing sleep
  const [elapsedMinutes, setElapsedMinutes] = useState(() => {
    if (!activeSleep) return 0;
    return Math.max(0, Math.floor((Date.now() - activeSleep.startedAtTimestamp) / (1000 * 60)));
  });

  useEffect(() => {
    if (!activeSleep) return;
    const interval = setInterval(() => {
      const diffMs = Date.now() - activeSleep.startedAtTimestamp;
      setElapsedMinutes(Math.max(0, Math.floor(diffMs / (1000 * 60))));
    }, 20000);
    return () => clearInterval(interval);
  }, [activeSleep]);

  // 1. Handle Start Sleep
  const handleStartSleep = () => {
    if (hasSpecificStartTime) {
      const err = validateNotFuture(startDate, startTime);
      if (err) {
        setStartError(err);
        return;
      }
      startSleepSession(startDate, startTime);
    } else {
      startSleepSession(getTodayDateString(), getCurrentTimeString());
    }
    closeSheet();
  };

  // 2. Handle Wake Up Confirmation
  const handleWakeUp = () => {
    if (hasSpecificEndTime) {
      const err = validateNotFuture(endDate, endTime);
      if (err) {
        setEndError(err);
        return;
      }

      // Check end >= start
      if (activeSleep) {
        const val = validateSleepSession(
          activeSleep.startDate,
          activeSleep.startTime,
          endDate,
          endTime
        );
        if (!val.isValid) {
          setEndError(val.errorMessage || 'Horário de término deve ser após o início');
          return;
        }
      }

      finishSleepSession(endDate, endTime);
    } else {
      finishSleepSession(getTodayDateString(), getCurrentTimeString());
    }
    closeSheet();
  };

  // 3. Handle Save Past Manual Sleep
  const handleSavePastSleep = () => {
    const val = validateSleepSession(
      pastStartDate,
      pastStartTime,
      pastEndDate,
      pastEndTime
    );
    if (!val.isValid) {
      setPastError(val.errorMessage || 'Verifique as datas e horários');
      return;
    }

    const duration = calculateSleepDuration(
      pastStartDate,
      pastStartTime,
      pastEndDate,
      pastEndTime
    );

    const newRecord: SleepRecord = {
      id: `rec-sleep-past-${Date.now()}`,
      type: 'sono',
      startDate: pastStartDate,
      startTime: pastStartTime,
      endDate: pastEndDate,
      endTime: pastEndTime,
      durationMinutes: duration,
      createdAt: Date.now(),
    };

    addRecord(newRecord, 'Sono anterior registrado com sucesso');
    closeSheet();
  };

  return (
    <div
      className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-sheet-title"
    >
      {/* Grab bar */}
      <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

      {/* Sheet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EAE3F2] dark:bg-[#282038] text-purple-900 dark:text-purple-300 flex items-center justify-center p-1.5 shadow-2xs">
            {activeSleep ? <Sparkles className="w-4 h-4 animate-pulse text-indigo-300" /> : <CategoryIcon category="sono" size={20} />}
          </div>
          <div>
            <h2
              id="sleep-sheet-title"
              className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
            >
              {activeSleep
                ? 'Confirmar que Acordou'
                : isManualPastMode
                ? 'Registrar Sono Anterior'
                : 'Registrar Sono'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {activeSleep
                ? 'Finalizar a sessão de sono em andamento'
                : isManualPastMode
                ? 'Informe início e fim de um sono passado'
                : 'Toque em Dormir para iniciar a contagem'}
            </p>
          </div>
        </div>

        <button
          onClick={closeSheet}
          className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Fechar painel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* CASE A: ACTIVE SLEEP SESSION (User tapped "Acordar") */}
      {activeSleep && !isManualPastMode && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-[#EAE3F2]/60 dark:bg-[#2c2040]/70 border border-purple-200 dark:border-purple-800 text-center">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              Sessão em Andamento
            </span>
            <div className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100 mt-1">
              Dormindo desde {format24hTime(activeSleep.startTime)}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Data de início: {formatFriendlyDate(activeSleep.startDate)} · Há {formatDuration(elapsedMinutes)}
            </div>
          </div>

          {/* Specific wake-up time toggle */}
          <SpecificTimeToggle
            hasSpecificTime={hasSpecificEndTime}
            onToggle={(val) => {
              setHasSpecificEndTime(val);
              setEndError(null);
            }}
            date={endDate}
            onDateChange={(val) => {
              setEndDate(val);
              setEndError(null);
            }}
            time={endTime}
            onTimeChange={(val) => {
              setEndTime(val);
              setEndError(null);
            }}
            timeError={endError}
          />

          {/* Action buttons (Natural Thumb Zone) */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleWakeUp}
              className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              Confirmar que acordou
            </button>

            <button
              onClick={() => {
                cancelSleepSession();
                closeSheet();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center justify-center transition-colors min-h-[44px]"
            >
              Cancelar sono em andamento (descartar sessão)
            </button>
          </div>
        </div>
      )}

      {/* CASE B: NEW SLEEP SESSION (Start now or with specific time) */}
      {!activeSleep && !isManualPastMode && (
        <div className="space-y-4">
          <SpecificTimeToggle
            hasSpecificTime={hasSpecificStartTime}
            onToggle={(val) => {
              setHasSpecificStartTime(val);
              setStartError(null);
            }}
            date={startDate}
            onDateChange={(val) => {
              setStartDate(val);
              setStartError(null);
            }}
            time={startTime}
            onTimeChange={(val) => {
              setStartTime(val);
              setStartError(null);
            }}
            timeError={startError}
          />

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleStartSleep}
              className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              <Moon className="w-5 h-5 fill-white/20" />
              <span>Dormir (iniciar sono agora)</span>
            </button>

            <button
              onClick={() => setIsManualPastMode(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 font-medium text-xs flex items-center justify-center transition-colors min-h-[44px]"
            >
              Registrar sono anterior com início e fim manuais
            </button>
          </div>
        </div>
      )}

      {/* CASE C: MANUAL PAST SLEEP FORM (Start & End dates/times) */}
      {!activeSleep && isManualPastMode && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800 space-y-3">
            {/* Start Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Início do Sono
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={pastStartDate}
                  onChange={(e) => {
                    setPastStartDate(e.target.value);
                    setPastError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Data de início do sono"
                />
                <input
                  type="time"
                  value={pastStartTime}
                  onChange={(e) => {
                    setPastStartTime(e.target.value);
                    setPastError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Horário de início do sono"
                />
              </div>
            </div>

            {/* End Date & Time (handles cross-midnight) */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Fim do Sono (Acordou)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={pastEndDate}
                  onChange={(e) => {
                    setPastEndDate(e.target.value);
                    setPastError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Data de término do sono"
                />
                <input
                  type="time"
                  value={pastEndTime}
                  onChange={(e) => {
                    setPastEndTime(e.target.value);
                    setPastError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Horário de término do sono"
                />
              </div>
            </div>

            {/* Duration Preview */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-800 text-xs">
              <span className="text-stone-500">Duração calculada:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {formatDuration(
                  calculateSleepDuration(
                    pastStartDate,
                    pastStartTime,
                    pastEndDate,
                    pastEndTime
                  )
                )}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {pastError && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pastError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSavePastSleep}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              Salvar sono anterior
            </button>

            <button
              onClick={() => setIsManualPastMode(false)}
              className="w-full py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors min-h-[44px]"
            >
              Voltar para sono em andamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SleepSheet() {
  const { activeSheet, closeSheet, selectedDate, activeSleep } = useBaby();

  if (activeSheet !== 'sono') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="fixed inset-0"
        onClick={closeSheet}
        aria-hidden="true"
      />

      <SleepSheetContent key={`${selectedDate}-${activeSleep ? activeSleep.id : 'none'}`} />
    </div>
  );
}
