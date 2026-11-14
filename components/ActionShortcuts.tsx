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
        {/* 1. PEITO (Sage Luxury Tone) */}
        <button
          onClick={() => openSheet('peito')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-gradient-to-b from-[#E7F1E9] to-[#DCE9DF] dark:from-[#23382b] dark:to-[#1b2b21] hover:from-[#e0ece2] hover:to-[#d4e4d8] dark:hover:from-[#284132] dark:hover:to-[#1f3226] border border-emerald-600/35 dark:border-emerald-400/30 shadow-[0_4px_16px_rgba(36,71,61,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar mamada no peito"
        >
          {/* Subtle ambient gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/50 dark:from-white/5 to-transparent pointer-events-none" />

          {/* Frosted icon vessel */}
          <div className="w-12 h-12 rounded-2xl bg-white/95 dark:bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-white dark:border-white/10 p-2">
            <CategoryIcon category="peito" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-[#24473D] dark:text-emerald-200 tracking-tight">
            Peito
          </span>
        </button>

        {/* 2. MAMADEIRA (Peach Luxury Tone) */}
        <button
          onClick={() => openSheet('mamadeira')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-gradient-to-b from-[#FCECE4] to-[#F6E3D9] dark:from-[#3d2a21] dark:to-[#302019] hover:from-[#f8e5dc] hover:to-[#eedcd1] dark:hover:from-[#463127] dark:hover:to-[#38261e] border border-orange-500/35 dark:border-orange-400/30 shadow-[0_4px_16px_rgba(154,66,30,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar mamadeira"
        >
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/50 dark:from-white/5 to-transparent pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white/95 dark:bg-orange-950/80 backdrop-blur-xs flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-white dark:border-white/10 p-2">
            <CategoryIcon category="mamadeira" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-orange-950 dark:text-orange-200 tracking-tight">
            Mamadeira
          </span>
        </button>

        {/* 3. SONO / ACORDAR (Lavender Luxury Tone) */}
        <button
          onClick={() => openSheet('sono')}
          className={`group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl border shadow-[0_4px_16px_rgba(88,43,124,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden ${
            activeSleep
              ? 'bg-gradient-to-b from-[#EDE4F5] to-[#E2D5ED] dark:from-[#432d5a] dark:to-[#322046] border-indigo-500/80 dark:border-indigo-400 ring-2 ring-indigo-400/40'
              : 'bg-gradient-to-b from-[#F2ECF7] to-[#EAE3F2] dark:from-[#312543] dark:to-[#241a34] hover:from-[#eae2f2] hover:to-[#dfd6e8] dark:hover:from-[#392c4f] dark:hover:to-[#2c2040] border-purple-500/35 dark:border-purple-400/30'
          }`}
          aria-label={activeSleep ? 'Registrar que o bebê acordou' : 'Registrar sono do bebê'}
        >
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/50 dark:from-white/5 to-transparent pointer-events-none" />

          <div
            className={`w-12 h-12 rounded-2xl backdrop-blur-xs flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-white dark:border-white/10 p-2 ${
              activeSleep
                ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                : 'bg-white/95 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300'
            }`}
          >
            {activeSleep ? (
              <Sparkles className="w-6 h-6 stroke-[2.2] animate-pulse text-indigo-100" />
            ) : (
              <CategoryIcon category="sono" size={28} />
            )}
          </div>

          <span className="font-serif font-bold text-base text-purple-950 dark:text-purple-200 tracking-tight">
            {activeSleep ? 'Acordar' : 'Sono'}
          </span>
        </button>

        {/* 4. FRALDA (Sand Luxury Tone) */}
        <button
          onClick={() => openSheet('fralda')}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 min-h-[96px] rounded-3xl bg-gradient-to-b from-[#F7F1E4] to-[#F1E9D8] dark:from-[#3a3224] dark:to-[#2e261a] hover:from-[#f0e7d5] hover:to-[#e7dcbf] dark:hover:from-[#433b2a] dark:hover:to-[#362e20] border border-amber-600/35 dark:border-amber-400/30 shadow-[0_4px_16px_rgba(146,104,33,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.97] transition-all cursor-pointer text-center w-full select-none overflow-hidden"
          aria-label="Registrar troca de fralda"
        >
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/50 dark:from-white/5 to-transparent pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white/95 dark:bg-amber-950/80 backdrop-blur-xs flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-1.5 transition-transform duration-200 group-hover:scale-105 border border-white dark:border-white/10 p-2">
            <CategoryIcon category="fralda" size={28} />
          </div>

          <span className="font-serif font-bold text-base text-amber-950 dark:text-amber-200 tracking-tight">
            Fralda
          </span>
        </button>
      </div>
    </section>
  );
}
