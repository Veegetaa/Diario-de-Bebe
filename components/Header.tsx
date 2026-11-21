'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { formatShortDate, getTodayDateString } from '@/lib/date-utils';
import { Calendar as CalendarIcon, Moon, Baby, ChevronDown, Users } from 'lucide-react';
import { PWAInstallButton } from '@/components/PWAInstallButton';

export function Header() {
  const {
    profile,
    selectedDate,
    resetToToday,
    isCalendarDropdownOpen,
    toggleCalendarDropdown,
    openSheet,
    currentTab,
    familyCode,
    isCloudConnected,
    authUser,
    effectiveTheme,
    setThemeMode,
  } = useBaby();

  const today = getTodayDateString();
  const isToday = selectedDate === today;
  const isDark = effectiveTheme === 'dark';

  const handleToggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFF8FA] dark:bg-[#121224]/95 dark:backdrop-blur-md border-b border-[#F2C5D5] dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-xl mx-auto px-2.5 sm:px-4 h-14 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Baby profile pill / trigger */}
        <button
          onClick={() => openSheet('profile')}
          className="min-w-0 flex-1 flex items-center gap-2 py-1 pl-0.5 pr-1.5 sm:px-2 rounded-full hover:bg-[#FCE7EF] dark:hover:bg-slate-800/50 transition-colors active:scale-95 text-left cursor-pointer"
          title="Ver perfil do bebê"
          aria-label={`Perfil de ${profile.name}`}
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#FCE7EF] dark:bg-[#24473D] text-[#D64D83] dark:text-[#DCE9DF] flex items-center justify-center font-bold text-sm shadow-xs border border-[#F2C5D5] dark:border-emerald-400/20">
            {profile.name ? profile.name.charAt(0).toUpperCase() : <Baby className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-serif font-bold text-[13px] sm:text-sm tracking-tight text-[#542639] dark:text-slate-100 truncate">
              {profile.name ? `Diário de ${profile.name}` : 'Diário do Bebê'}
            </span>
            <span className="text-[10px] text-[#886576] dark:text-stone-400 -mt-0.5 truncate">
              Toque p/ editar
            </span>
          </div>
        </button>

        {/* Right controls — sized to fit cleanly without horizontal overflow */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Calendar button with selected date */}
          <button
            onClick={toggleCalendarDropdown}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-8 sm:h-9 rounded-full text-[11px] sm:text-xs font-medium transition-all active:scale-95 shrink-0 cursor-pointer ${
              isCalendarDropdownOpen
                ? 'bg-[#D64D83] dark:bg-[#24473D] text-white shadow-xs'
                : isToday
                ? 'bg-white dark:bg-slate-800 text-[#542639] dark:text-slate-200 hover:bg-[#FCE7EF] border border-[#F2C5D5] dark:border-slate-700'
                : 'bg-[#FCE7EF] dark:bg-amber-950/60 text-[#542639] dark:text-amber-200 border border-[#F2C5D5] dark:border-amber-800/60'
            }`}
            aria-expanded={isCalendarDropdownOpen}
            aria-label="Abrir ou fechar calendário de datas"
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[64px] sm:max-w-[105px]">
              {isToday ? 'Hoje' : formatShortDate(selectedDate)}
            </span>
            <ChevronDown
              className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                isCalendarDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* If looking at past date, compact button to quickly return to today */}
          {!isToday && currentTab === 'hoje' && (
            <button
              onClick={resetToToday}
              className="text-[10px] sm:text-[11px] font-semibold text-[#D64D83] dark:text-emerald-300 px-2 h-8 sm:h-9 rounded-full bg-[#FCE7EF] dark:bg-[#24473D]/50 hover:bg-[#F2C5D5]/60 transition-colors border border-[#F2C5D5] dark:border-emerald-700/20 shrink-0 cursor-pointer"
              title="Voltar para a data de hoje"
            >
              Hoje
            </button>
          )}

          {/* Sincronização / Conta da Família Button (Verde sálvia when connected) */}
          <button
            onClick={() => openSheet('sync')}
            className={`relative flex items-center justify-center sm:gap-1.5 w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 rounded-full text-xs font-medium transition-all active:scale-95 shrink-0 cursor-pointer ${
              authUser || isCloudConnected
                ? 'bg-[#DCEADF] dark:bg-emerald-950/70 text-[#24473D] dark:text-emerald-200 border border-[#BFD6C5] dark:border-emerald-700/80 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-[#542639] dark:text-slate-200 hover:bg-[#FCE7EF] border border-[#F2C5D5] dark:border-slate-700'
            }`}
            title={
              authUser
                ? `Conta Conectada: ${authUser.email}`
                : familyCode
                ? `Código Conectado: ${familyCode}`
                : 'Entrar com e-mail/senha para sincronizar'
            }
            aria-label="Sincronização e conta da família"
          >
            <Users
              className={`w-3.5 h-3.5 shrink-0 ${
                authUser || isCloudConnected
                  ? 'text-[#24473D] dark:text-emerald-300'
                  : 'text-[#D64D83] dark:text-emerald-300'
              }`}
            />
            <span className="hidden sm:inline font-sans text-[11px] font-bold truncate max-w-[90px]">
              {authUser
                ? authUser.email?.split('@')[0] || 'Conectado'
                : familyCode
                ? familyCode
                : 'Entrar'}
            </span>
            {(authUser || isCloudConnected) && (
              <span className="absolute top-1 right-1 sm:static w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />
            )}
          </button>

          {/* PWA Install Button (Android & iPhone) */}
          <PWAInstallButton variant="compact" />

          {/* Theme Toggle Button on Moon Icon (Dark Starry Night <-> Light Pastel Pink) */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border shadow-2xs transition-all active:scale-90 shrink-0 cursor-pointer ${
              isDark
                ? 'bg-indigo-950/80 border-indigo-700/70 text-indigo-300 hover:bg-indigo-900/80'
                : 'bg-[#FCE7EF] border-[#F2C5D5] text-[#D64D83] hover:bg-[#F2C5D5]/60'
            }`}
            title={
              isDark
                ? 'Trocar para tema rosinha claro'
                : 'Trocar para tema noite estrelada (escuro)'
            }
            aria-label={
              isDark
                ? 'Mudar para tema rosinha claro'
                : 'Voltar para tema escuro noite estrelada'
            }
            aria-pressed={!isDark}
          >
            <Moon
              className={`w-4 h-4 transition-colors ${
                isDark
                  ? 'fill-indigo-300/30 text-indigo-300'
                  : 'fill-[#D64D83]/25 text-[#D64D83]'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
