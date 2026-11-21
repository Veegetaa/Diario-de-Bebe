'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { Edit3, Plus, Sparkles } from 'lucide-react';

export function DayNoteBox() {
  const { openSheet } = useBaby();

  return (
    <div className="w-full pt-2 pb-6">
      <button
        onClick={() => openSheet('nota')}
        className="w-full relative overflow-hidden flex items-center justify-between p-4 rounded-3xl bg-white hover:bg-[#FFF8FA] dark:bg-gradient-to-r dark:from-[#211a28] dark:via-[#1a1a33] dark:to-[#211a28] dark:hover:from-[#281f33] border border-[#F2C5D5] dark:border-amber-900/60 shadow-[0_2px_12px_rgba(84,38,57,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] active:scale-[0.99] transition-all text-left group cursor-pointer"
        aria-label="Adicionar anotação: Como foi o dia?"
      >
        {/* Ambient top light (dark mode only) */}
        <div className="hidden dark:block absolute top-0 right-0 w-32 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#FCE7EF] dark:bg-gradient-to-br dark:from-amber-900/50 dark:to-amber-800/30 text-[#D64D83] dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs border border-[#F2C5D5] dark:border-amber-700/30 group-hover:scale-105 transition-transform">
            <Edit3 className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-bold text-sm text-[#542639] dark:text-slate-100 tracking-tight">
                Como foi o dia?
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-[#D64D83] dark:text-amber-400 opacity-85" />
            </div>
            <p className="text-xs text-[#886576] dark:text-stone-400 mt-0.5 truncate">
              Adicione anotações, marcos ou observações do dia…
            </p>
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-[#FCE7EF] dark:bg-slate-800 flex items-center justify-center text-[#D64D83] dark:text-stone-300 group-hover:bg-[#D64D83] group-hover:text-white dark:group-hover:bg-emerald-500 dark:group-hover:text-white transition-all shrink-0 ml-2 shadow-2xs border border-[#F2C5D5] dark:border-slate-700/70">
          <Plus className="w-4 h-4 stroke-[2.4]" />
        </div>
      </button>
    </div>
  );
}
