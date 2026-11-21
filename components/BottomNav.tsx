'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { TabType } from '@/lib/types';
import { Home, Calendar, Baby, Search, FileText } from 'lucide-react';

export function BottomNav() {
  const { currentTab, setCurrentTab, closeCalendarDropdown } = useBaby();

  const handleTabChange = (tab: TabType) => {
    closeCalendarDropdown();
    setCurrentTab(tab);
  };

  const navItems: Array<{
    id: TabType;
    label: string;
    ariaLabel: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'hoje', label: 'Hoje', ariaLabel: 'Aba Hoje', Icon: Home },
    { id: 'calendario', label: 'Calendário', ariaLabel: 'Aba Calendário', Icon: Calendar },
    { id: 'meu_bebe', label: 'Meu bebê', ariaLabel: 'Aba Meu bebê', Icon: Baby },
    { id: 'buscar', label: 'Buscar', ariaLabel: 'Aba Buscar e Favoritos', Icon: Search },
    { id: 'relatorios', label: 'Relatórios', ariaLabel: 'Aba Relatórios e Exportar PDF', Icon: FileText },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F3ECE2]/95 dark:bg-[#121224]/95 backdrop-blur-xl border-t border-stone-300 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] transition-colors pb-safe"
      aria-label="Navegação inferior principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {navItems.map(({ id, label, ariaLabel, Icon }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-all duration-200 active:scale-95 group ${
                isActive
                  ? 'text-[#24473D] dark:text-emerald-400 font-bold'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={ariaLabel}
            >
              <div
                className={`w-9 h-7 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#DCE9DF]/70 dark:bg-[#24473D]/50 shadow-2xs'
                    : 'bg-transparent'
                }`}
              >
                <Icon
                  className={`w-[19px] h-[19px] transition-transform duration-200 ${
                    isActive
                      ? 'scale-110 stroke-[2.4]'
                      : 'stroke-[1.8] group-hover:scale-105'
                  }`}
                />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
