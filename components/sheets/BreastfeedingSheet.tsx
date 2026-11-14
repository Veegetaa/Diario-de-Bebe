'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { BreastfeedingRecord } from '@/lib/types';
import { getCurrentTimeString, validateNotFuture } from '@/lib/date-utils';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import { X } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function BreastfeedingSheet() {
  const { activeSheet, closeSheet, addRecord, selectedDate } = useBaby();

  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [time, setTime] = useState(() => getCurrentTimeString());
  const [timeError, setTimeError] = useState<string | null>(null);

  if (activeSheet !== 'peito') return null;

  const handleSelectSide = (side: 'esquerdo' | 'direito' | 'ambos') => {
    const finalTime = hasSpecificTime ? time : getCurrentTimeString();
    if (hasSpecificTime) {
      const err = validateNotFuture(selectedDate, finalTime);
      if (err) {
        setTimeError(err);
        return;
      }
    }

    const newRecord: BreastfeedingRecord = {
      id: `rec-peito-${Date.now()}`,
      type: 'peito',
      date: selectedDate,
      hasSpecificTime: true,
      time: finalTime,
      side,
      createdAt: Date.now(),
    };

    const sideLabel =
      side === 'esquerdo' ? 'Esquerdo' : side === 'direito' ? 'Direito' : 'Ambos os peitos';
    addRecord(newRecord, `Mamada registrada (Peito · ${sideLabel})`);
    closeSheet();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="fixed inset-0"
        onClick={closeSheet}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="breastfeeding-sheet-title"
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#DCE9DF] dark:bg-[#1e2f24] flex items-center justify-center p-1.5 shadow-2xs">
              <CategoryIcon category="peito" size={20} />
            </div>
            <div>
              <h2
                id="breastfeeding-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Mamada no Peito
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Toque no lado para registrar
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

        {/* Action Buttons (Natural Thumb Reach) */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <button
            onClick={() => handleSelectSide('esquerdo')}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#DCE9DF] dark:bg-[#203427] hover:bg-[#cfded3] dark:hover:bg-[#284232] text-[#24473D] dark:text-emerald-200 border border-emerald-800/10 dark:border-emerald-500/20 active:scale-97 transition-all shadow-xs min-h-[88px] cursor-pointer"
            aria-label="Registrar mamada no peito esquerdo"
          >
            <span className="font-serif font-bold text-xl mb-1">Esquerdo</span>
            <span className="text-xs text-emerald-900/70 dark:text-emerald-300/80">
              Toque para salvar
            </span>
          </button>

          <button
            onClick={() => handleSelectSide('direito')}
            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#DCE9DF] dark:bg-[#203427] hover:bg-[#cfded3] dark:hover:bg-[#284232] text-[#24473D] dark:text-emerald-200 border border-emerald-800/10 dark:border-emerald-500/20 active:scale-97 transition-all shadow-xs min-h-[88px] cursor-pointer"
            aria-label="Registrar mamada no peito direito"
          >
            <span className="font-serif font-bold text-xl mb-1">Direito</span>
            <span className="text-xs text-emerald-900/70 dark:text-emerald-300/80">
              Toque para salvar
            </span>
          </button>

          <button
            onClick={() => handleSelectSide('ambos')}
            className="col-span-2 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#DCE9DF] dark:bg-[#203427] hover:bg-[#cfded3] dark:hover:bg-[#284232] text-[#24473D] dark:text-emerald-200 border border-emerald-800/10 dark:border-emerald-500/20 active:scale-97 transition-all shadow-xs min-h-[76px] cursor-pointer"
            aria-label="Registrar mamada em ambos os peitos"
          >
            <span className="font-serif font-bold text-xl mb-0.5">Ambos os peitos</span>
            <span className="text-xs text-emerald-900/70 dark:text-emerald-300/80">
              Toque para salvar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
