'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { Sparkles } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function ActionShortcuts() {
  const { openSheet, activeSleep } = useBaby();

  return (
    <section className="w-full my-4" aria-label="Atalhos principais de registro">
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* 1. PEITO (Uniform Rosa delicado #FCE7EF in light / Sage in dark) */}
        <button
          onClick={() => openSheet('peito')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-[#FCE7EF] hover:bg-[#F9DCE7] dark:bg-gradient-to-b dark:from-[#23382b] dark:to-[#1b2b21] dark:hover:from-[#284132] dark:hover:to-[#1f3226] border border-[#F2C5D5] dark:border-emerald-400/30 shadow-[0_2px_10px_rgba(84,38,57,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar mamada no peito"
        >
          <div className="hidden dark:block absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-950/80 flex items-center justify-center shadow-[0_1px_4px_rgba(84,38,57,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-[#F2C5D5]/70 dark:border-white/10 p-2">
            <CategoryIcon category="peito" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-[#542639] dark:text-emerald-200 tracking-tight">
            Peito
          </span>
        </button>

        {/* 2. MAMADEIRA (Uniform Rosa delicado #FCE7EF in light / Peach in dark) */}
        <button
          onClick={() => openSheet('mamadeira')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-[#FCE7EF] hover:bg-[#F9DCE7] dark:bg-gradient-to-b dark:from-[#3d2a21] dark:to-[#302019] dark:hover:from-[#463127] dark:hover:to-[#38261e] border border-[#F2C5D5] dark:border-orange-400/30 shadow-[0_2px_10px_rgba(84,38,57,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar mamadeira"
        >
          <div className="hidden dark:block absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-orange-950/80 flex items-center justify-center shadow-[0_1px_4px_rgba(84,38,57,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-[#F2C5D5]/70 dark:border-white/10 p-2">
            <CategoryIcon category="mamadeira" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-[#542639] dark:text-orange-200 tracking-tight">
            Mamadeira
          </span>
        </button>

        {/* 3. SONO / ACORDAR (Uniform Rosa delicado #FCE7EF in light / Lavender in dark) */}
        <button
          onClick={() => openSheet('sono')}
          className={`group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl border shadow-[0_2px_10px_rgba(84,38,57,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden ${
            activeSleep
              ? 'bg-[#FCE7EF] dark:bg-gradient-to-b dark:from-[#432d5a] dark:to-[#322046] border-[#D64D83] dark:border-indigo-400 ring-2 ring-[#D64D83]/30 dark:ring-indigo-400/40'
              : 'bg-[#FCE7EF] hover:bg-[#F9DCE7] dark:bg-gradient-to-b dark:from-[#312543] dark:to-[#241a34] dark:hover:from-[#392c4f] dark:hover:to-[#2c2040] border-[#F2C5D5] dark:border-purple-400/30'
          }`}
          aria-label={activeSleep ? 'Registrar que o bebê acordou' : 'Registrar sono do bebê'}
        >
          <div className="hidden dark:block absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_1px_4px_rgba(84,38,57,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-[#F2C5D5]/70 dark:border-white/10 p-2 ${
              activeSleep
                ? 'bg-[#D64D83] dark:bg-indigo-600 text-white shadow-[#D64D83]/30 dark:shadow-indigo-500/30'
                : 'bg-white dark:bg-purple-950/80 text-[#542639] dark:text-purple-300'
            }`}
          >
            {activeSleep ? (
              <Sparkles className="w-6 h-6 stroke-[2.2] animate-pulse text-white dark:text-indigo-100" />
            ) : (
              <CategoryIcon category="sono" size={28} />
            )}
          </div>

          <span className="font-serif font-bold text-base text-[#542639] dark:text-purple-200 tracking-tight">
            {activeSleep ? 'Acordar' : 'Sono'}
          </span>
        </button>

        {/* 4. FRALDA (Uniform Rosa delicado #FCE7EF in light / Sand in dark) */}
        <button
          onClick={() => openSheet('fralda')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-[#FCE7EF] hover:bg-[#F9DCE7] dark:bg-gradient-to-b dark:from-[#3a3224] dark:to-[#2e261a] dark:hover:from-[#433b2a] dark:hover:to-[#362e20] border border-[#F2C5D5] dark:border-amber-400/30 shadow-[0_2px_10px_rgba(84,38,57,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar troca de fralda"
        >
          <div className="hidden dark:block absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-amber-950/80 flex items-center justify-center shadow-[0_1px_4px_rgba(84,38,57,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-[#F2C5D5]/70 dark:border-white/10 p-2">
            <CategoryIcon category="fralda" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-[#542639] dark:text-amber-200 tracking-tight">
            Fralda
          </span>
        </button>
      </div>
    </section>
  );
}
