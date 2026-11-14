'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { History, Plus } from 'lucide-react';

export function ForgottenRecordBox() {
  const { openSheet } = useBaby();

  return (
    <div className="w-full pt-1 pb-6">
      <button
        onClick={() => openSheet('esquecido')}
        className="w-full relative overflow-hidden flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-stone-100/90 via-white to-stone-50/80 dark:from-[#1e1e38] dark:via-[#1a1a33] dark:to-[#1e1e38] hover:from-stone-200/80 dark:hover:from-[#252545] border border-stone-300 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all text-left group cursor-pointer"
        aria-label="Adicionar registro esquecido com data e horário"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 shadow-2xs border border-stone-200/70 dark:border-slate-700/60 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-semibold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                Registro Esquecido
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate font-light">
              Esqueceu de anotar algo? Adicione com data, horário e descrição…
            </p>
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:bg-[#24473D] group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-all shrink-0 ml-2 shadow-2xs border border-stone-200/70 dark:border-slate-700/70">
          <Plus className="w-4 h-4 stroke-[2]" />
        </div>
      </button>
    </div>
  );
}
