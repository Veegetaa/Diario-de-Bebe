'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { DiaperRecord } from '@/lib/types';
import { getCurrentTimeString, validateNotFuture } from '@/lib/date-utils';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import { X, Sparkles, Droplet, Smile } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function DiaperSheet() {
  const { activeSheet, closeSheet, addRecord, selectedDate } = useBaby();

  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [time, setTime] = useState(() => getCurrentTimeString());
  const [timeError, setTimeError] = useState<string | null>(null);

  if (activeSheet !== 'fralda') return null;

  const handleSelectType = (diaperType: 'xixi' | 'coco' | 'ambos') => {
    const finalTime = hasSpecificTime ? time : getCurrentTimeString();
    if (hasSpecificTime) {
      const err = validateNotFuture(selectedDate, finalTime);
      if (err) {
        setTimeError(err);
        return;
      }
    }

    const newRecord: DiaperRecord = {
      id: `rec-fralda-${Date.now()}`,
      type: 'fralda',
      date: selectedDate,
      hasSpecificTime: true,
      time: finalTime,
      diaperType,
      createdAt: Date.now(),
    };

    let label = 'Xixi';
    if (diaperType === 'coco') label = 'Cocô';
    if (diaperType === 'ambos') label = 'Xixi e Cocô (Ambos)';

    addRecord(newRecord, `Fralda registrada (${label})`);
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
        aria-labelledby="diaper-sheet-title"
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F1E9D8] dark:bg-[#322c20] flex items-center justify-center p-1.5 shadow-2xs">
              <CategoryIcon category="fralda" size={20} />
            </div>
            <div>
              <h2
                id="diaper-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Troca de Fralda
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Toque no tipo para registrar com o horário atual
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

        {/* Three Big Choices: Xixi, Cocô, Ambos (Natural Thumb Reach) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={() => handleSelectType('xixi')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F1E9D8] dark:bg-[#322c20] hover:bg-[#e6dcc6] dark:hover:bg-[#3e3728] text-amber-950 dark:text-amber-200 border border-amber-800/10 dark:border-amber-500/20 active:scale-97 transition-all shadow-xs min-h-[88px] cursor-pointer"
            aria-label="Registrar fralda molhada: Xixi"
          >
            <Droplet className="w-6 h-6 text-amber-700 dark:text-amber-400 mb-1" />
            <span className="font-serif font-bold text-base">Xixi</span>
            <span className="text-[10px] text-amber-900/60 dark:text-amber-300/70">
              Molhada
            </span>
          </button>

          <button
            onClick={() => handleSelectType('coco')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F1E9D8] dark:bg-[#322c20] hover:bg-[#e6dcc6] dark:hover:bg-[#3e3728] text-amber-950 dark:text-amber-200 border border-amber-800/10 dark:border-amber-500/20 active:scale-97 transition-all shadow-xs min-h-[88px] cursor-pointer"
            aria-label="Registrar fralda suja: Cocô"
          >
            <Smile className="w-6 h-6 text-amber-800 dark:text-amber-400 mb-1" />
            <span className="font-serif font-bold text-base">Cocô</span>
            <span className="text-[10px] text-amber-900/60 dark:text-amber-300/70">
              Suja
            </span>
          </button>

          <button
            onClick={() => handleSelectType('ambos')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F1E9D8] dark:bg-[#322c20] hover:bg-[#e6dcc6] dark:hover:bg-[#3e3728] text-amber-950 dark:text-amber-200 border border-amber-800/10 dark:border-amber-500/20 active:scale-97 transition-all shadow-xs min-h-[88px] cursor-pointer"
            aria-label="Registrar troca com ambos: Xixi e Cocô"
          >
            <Sparkles className="w-6 h-6 text-amber-900 dark:text-amber-300 mb-1" />
            <span className="font-serif font-bold text-base">Ambos</span>
            <span className="text-[10px] text-amber-900/60 dark:text-amber-300/70">
              Xixi + Cocô
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
