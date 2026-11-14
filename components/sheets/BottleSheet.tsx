'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { BottleRecord } from '@/lib/types';
import { getCurrentTimeString, validateNotFuture } from '@/lib/date-utils';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import { X, Plus, Minus } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function BottleSheet() {
  const { activeSheet, closeSheet, addRecord, selectedDate } = useBaby();

  const [volumeMl, setVolumeMl] = useState(120); // Default 120ml
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [time, setTime] = useState(() => getCurrentTimeString());
  const [timeError, setTimeError] = useState<string | null>(null);

  if (activeSheet !== 'mamadeira') return null;

  const handleStep = (delta: number) => {
    setVolumeMl((prev) => {
      const next = prev + delta;
      return Math.min(350, Math.max(0, next));
    });
  };

  const handleSaveWithVolume = () => {
    const finalTime = hasSpecificTime ? time : getCurrentTimeString();
    if (hasSpecificTime) {
      const err = validateNotFuture(selectedDate, finalTime);
      if (err) {
        setTimeError(err);
        return;
      }
    }

    const newRecord: BottleRecord = {
      id: `rec-mamadeira-${Date.now()}`,
      type: 'mamadeira',
      date: selectedDate,
      hasSpecificTime: true,
      time: finalTime,
      volumeMl,
      createdAt: Date.now(),
    };

    addRecord(newRecord, `Mamadeira registrada (${volumeMl} ml)`);
    closeSheet();
  };

  const handleSaveWithoutVolume = () => {
    const finalTime = hasSpecificTime ? time : getCurrentTimeString();
    if (hasSpecificTime) {
      const err = validateNotFuture(selectedDate, finalTime);
      if (err) {
        setTimeError(err);
        return;
      }
    }

    const newRecord: BottleRecord = {
      id: `rec-mamadeira-${Date.now()}`,
      type: 'mamadeira',
      date: selectedDate,
      hasSpecificTime: true,
      time: finalTime,
      volumeMl: null,
      createdAt: Date.now(),
    };

    addRecord(newRecord, 'Mamadeira registrada (sem volume medido)');
    closeSheet();
  };

  // Percentage of bottle filled (0 to 100%)
  const fillPercentage = Math.min(100, Math.max(0, (volumeMl / 350) * 100));

  const ticks = [350, 300, 250, 200, 150, 100, 50, 0];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="fixed inset-0"
        onClick={closeSheet}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottle-sheet-title"
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F6E3D9] dark:bg-[#34241d] flex items-center justify-center p-1.5 shadow-2xs">
              <CategoryIcon category="mamadeira" size={20} />
            </div>
            <div>
              <h2
                id="bottle-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Mamadeira
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ajuste o volume com efeito visual de enchimento
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

        {/* VISUAL BABY BOTTLE (Ilustração interativa com efeito de enchimento e ml na lateral) */}
        <div className="bg-[#FBF7F1] dark:bg-[#15152b] rounded-3xl p-4 border border-stone-200/70 dark:border-slate-800 mb-4 flex flex-col items-center">
          <div className="relative flex items-center justify-center my-2 select-none">
            {/* Left measurement labels & tick marks */}
            <div className="h-44 flex flex-col justify-between items-end pr-2.5 py-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 tabular-nums">
              {ticks.map((t) => (
                <div key={t} className="flex items-center gap-1">
                  <span>{t}</span>
                  <span className={`w-2.5 h-[1.5px] ${volumeMl >= t ? 'bg-orange-400 dark:bg-orange-300' : 'bg-stone-300 dark:bg-slate-700'}`} />
                </div>
              ))}
            </div>

            {/* The Baby Bottle Body */}
            <div className="relative w-28 h-52 flex flex-col items-center">
              {/* Teat / Bico */}
              <div className="w-8 h-6 bg-amber-100/90 dark:bg-amber-200/80 rounded-t-full border border-amber-300/80 shadow-2xs z-10 -mb-0.5" />

              {/* Collar / Rosca da mamadeira */}
              <div className="w-20 h-4 bg-[#F6E3D9] dark:bg-[#432d24] rounded-lg border border-orange-300/60 dark:border-orange-500/40 shadow-xs z-10 flex items-center justify-center">
                <div className="w-12 h-1 bg-orange-200/70 dark:bg-orange-700/50 rounded-full" />
              </div>

              {/* Bottle transparent Chamber */}
              <div className="relative w-24 h-44 rounded-b-3xl border-2 border-stone-300 dark:border-slate-600 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs overflow-hidden shadow-inner flex flex-col justify-end">
                {/* Glass reflection streak on left */}
                <div className="absolute left-1.5 top-2 bottom-3 w-1.5 rounded-full bg-white/40 dark:bg-white/10 z-20 pointer-events-none" />

                {/* Milk liquid with smooth animated height */}
                <div
                  className="w-full bg-gradient-to-t from-amber-100 via-amber-50 to-white dark:from-orange-200/90 dark:via-amber-100/90 dark:to-white/95 transition-all duration-300 ease-out relative border-t-2 border-amber-200/80 dark:border-amber-100"
                  style={{ height: `${fillPercentage}%` }}
                >
                  {/* Subtle liquid surface bubble wave */}
                  {fillPercentage > 4 && (
                    <div className="absolute -top-1 left-0 right-0 h-2 bg-white/60 dark:bg-white/40 rounded-full blur-[0.5px] animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Right lateral ml indicator (Mostrando o ml na lateral em tempo real) */}
            <div className="pl-3 flex flex-col justify-center min-w-[75px]">
              <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-[#32231b] border border-orange-200/80 dark:border-orange-800/80 text-center shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-800 dark:text-orange-300 block">
                  Volume
                </span>
                <span className="font-serif font-bold text-2xl text-orange-950 dark:text-orange-100 tabular-nums leading-none">
                  {volumeMl}
                </span>
                <span className="text-xs text-orange-700/80 dark:text-orange-300/80 font-medium ml-0.5">
                  ml
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons & Slider in thumb zone */}
          <div className="w-full flex items-center gap-3 mt-2 px-1">
            <button
              onClick={() => handleStep(-5)}
              disabled={volumeMl <= 0}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#20203d] border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0 min-h-[48px] min-w-[48px]"
              aria-label="Diminuir 5 mililitros"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="350"
                step="5"
                value={volumeMl}
                onChange={(e) => setVolumeMl(Number(e.target.value))}
                className="w-full h-3 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#24473D]"
                aria-label={`Volume em mililitros: ${volumeMl}`}
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-medium px-0.5 mt-1">
                <span>0 ml</span>
                <span>175 ml</span>
                <span>350 ml</span>
              </div>
            </div>

            <button
              onClick={() => handleStep(5)}
              disabled={volumeMl >= 350}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-[#20203d] border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0 min-h-[48px] min-w-[48px]"
              aria-label="Aumentar 5 mililitros"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horário específico Toggle (mostra apenas horário ao ativar) */}
        <SpecificTimeToggle
          hasSpecificTime={hasSpecificTime}
          onToggle={(val) => {
            setHasSpecificTime(val);
            setTimeError(null);
          }}
          time={time}
          onTimeChange={(val) => {
            setTime(val);
            setTimeError(null);
          }}
          timeError={timeError}
          hideDate={true}
        />

        {/* Bottom Action Buttons (Natural Thumb Reach) */}
        <div className="space-y-2.5">
          <button
            onClick={handleSaveWithVolume}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
          >
            Salvar mamadeira ({volumeMl} ml)
          </button>

          <button
            onClick={handleSaveWithoutVolume}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 font-medium text-xs flex items-center justify-center active:scale-98 transition-all min-h-[44px]"
          >
            Salvar sem volume (quantidade não medida)
          </button>
        </div>
      </div>
    </div>
  );
}
