'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { TabType } from '@/lib/types';
import { Home, Calendar, Search, FileText } from 'lucide-react';

export function BottomNav() {
  const { currentTab, setCurrentTab, closeCalendarDropdown } = useBaby();

  const handleTabChange = (tab: TabType) => {
    closeCalendarDropdown();
    setCurrentTab(tab);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F3ECE2]/95 dark:bg-[#121224]/95 backdrop-blur-xl border-t border-stone-300 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] transition-colors pb-safe"
      aria-label="Navegação inferior principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {/* Tab 1: Hoje */}
        <button
          onClick={() => handleTabChange('hoje')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-200 active:scale-95 group ${
            currentTab === 'hoje'
              ? 'text-[#24473D] dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
          aria-current={currentTab === 'hoje' ? 'page' : undefined}
          aria-label="Aba Hoje"
        >
          <div
            className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'hoje'
                ? 'bg-[#DCE9DF]/70 dark:bg-[#24473D]/50 shadow-2xs'
                : 'bg-transparent'
            }`}
          >
            <Home
              className={`w-5 h-5 transition-transform duration-200 ${
                currentTab === 'hoje'
                  ? 'scale-110 stroke-[2.4]'
                  : 'stroke-[1.8] group-hover:scale-105'
              }`}
            />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium whitespace-nowrap">
            Hoje
          </span>
        </button>

        {/* Tab 2: Calendário */}
        <button
          onClick={() => handleTabChange('calendario')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-200 active:scale-95 group ${
            currentTab === 'calendario'
              ? 'text-[#24473D] dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
          aria-current={currentTab === 'calendario' ? 'page' : undefined}
          aria-label="Aba Calendário"
        >
          <div
            className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'calendario'
                ? 'bg-[#DCE9DF]/70 dark:bg-[#24473D]/50 shadow-2xs'
                : 'bg-transparent'
            }`}
          >
            <Calendar
              className={`w-5 h-5 transition-transform duration-200 ${
                currentTab === 'calendario'
                  ? 'scale-110 stroke-[2.4]'
                  : 'stroke-[1.8] group-hover:scale-105'
              }`}
            />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium whitespace-nowrap">
            Calendário
          </span>
        </button>

        {/* Tab 3: Buscar */}
        <button
          onClick={() => handleTabChange('buscar')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-200 active:scale-95 group ${
            currentTab === 'buscar'
              ? 'text-[#24473D] dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
          aria-current={currentTab === 'buscar' ? 'page' : undefined}
          aria-label="Aba Buscar e Favoritos"
        >
          <div
            className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'buscar'
                ? 'bg-[#DCE9DF]/70 dark:bg-[#24473D]/50 shadow-2xs'
                : 'bg-transparent'
            }`}
          >
            <Search
              className={`w-5 h-5 transition-transform duration-200 ${
                currentTab === 'buscar'
                  ? 'scale-110 stroke-[2.4]'
                  : 'stroke-[1.8] group-hover:scale-105'
              }`}
            />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium whitespace-nowrap">
            Buscar
          </span>
        </button>

        {/* Tab 4: Relatórios */}
        <button
          onClick={() => handleTabChange('relatorios')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-200 active:scale-95 group ${
            currentTab === 'relatorios'
              ? 'text-[#24473D] dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
          aria-current={currentTab === 'relatorios' ? 'page' : undefined}
          aria-label="Aba Relatórios e Exportar PDF"
        >
          <div
            className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'relatorios'
                ? 'bg-[#DCE9DF]/70 dark:bg-[#24473D]/50 shadow-2xs'
                : 'bg-transparent'
            }`}
          >
            <FileText
              className={`w-5 h-5 transition-transform duration-200 ${
                currentTab === 'relatorios'
                  ? 'scale-110 stroke-[2.4]'
                  : 'stroke-[1.8] group-hover:scale-105'
              }`}
            />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium whitespace-nowrap">
            Relatórios
          </span>
        </button>
      </div>
    </nav>
  );
}
