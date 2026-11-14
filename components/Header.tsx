'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { formatShortDate, getTodayDateString } from '@/lib/date-utils';
import { Calendar as CalendarIcon, Moon, Baby, ChevronDown, Users, RotateCw } from 'lucide-react';
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
    refreshData,
    isManualRefreshing,
  } = useBaby();

  const today = getTodayDateString();
  const isToday = selectedDate === today;

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F3ECE2]/95 dark:bg-[#121224]/95 backdrop-blur-md border-b border-stone-300 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* Baby profile pill / trigger */}
        <button
          onClick={() => openSheet('profile')}
          className="flex items-center gap-2 py-1.5 px-2.5 rounded-full hover:bg-stone-200/70 dark:hover:bg-slate-800/50 transition-colors active:scale-95 text-left shrink-0"
          title="Ver perfil do bebê"
          aria-label={`Perfil de ${profile.name}`}
        >
          <div className="w-8 h-8 rounded-full bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-[#DCE9DF] flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-900/15 dark:border-emerald-400/20">
            {profile.name ? profile.name.charAt(0).toUpperCase() : <Baby className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate max-w-[110px]">
              {profile.name ? `Diário de ${profile.name}` : 'Diário do Bebê'}
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 -mt-0.5">
              Toque p/ editar
            </span>
          </div>
        </button>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Calendar button with selected date */}
          <button
            onClick={toggleCalendarDropdown}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 min-h-[38px] ${
              isCalendarDropdownOpen
                ? 'bg-[#24473D] text-white shadow-xs'
                : isToday
                ? 'bg-stone-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-stone-300/80 border border-stone-300/70 dark:border-slate-700'
                : 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60'
            }`}
            aria-expanded={isCalendarDropdownOpen}
            aria-label="Abrir ou fechar calendário de datas"
          >
            <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[105px]">
              {isToday ? 'Hoje' : formatShortDate(selectedDate)}
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isCalendarDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* If looking at past date, button to quickly return to today */}
          {!isToday && currentTab === 'hoje' && (
            <button
              onClick={resetToToday}
              className="text-[11px] font-semibold text-[#24473D] dark:text-emerald-300 px-2.5 py-1 rounded-md bg-[#DCE9DF] dark:bg-[#24473D]/50 hover:bg-[#cde0d1] transition-colors border border-emerald-700/20"
              title="Voltar para a data de hoje"
            >
              Hoje
            </button>
          )}

          {/* Sincronização / Conta da Família Button */}
          <button
            onClick={() => openSheet('sync')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 min-h-[38px] ${
              authUser || isCloudConnected
                ? 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 border border-emerald-400/80 dark:border-emerald-700/80 shadow-2xs'
                : 'bg-stone-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-stone-300/80 border border-stone-300/70 dark:border-slate-700'
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
            <Users className="w-3.5 h-3.5 shrink-0 text-[#24473D] dark:text-emerald-300" />
            <span className="font-sans text-[11px] font-bold truncate max-w-[75px] sm:max-w-[100px]">
              {authUser
                ? authUser.email?.split('@')[0] || 'Conectado'
                : familyCode
                ? familyCode
                : 'Entrar'}
            </span>
            {(authUser || isCloudConnected) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={() => refreshData()}
            disabled={isManualRefreshing}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-2xs min-h-[38px] min-w-[38px] ${
              isManualRefreshing
                ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300'
                : 'bg-stone-200/80 dark:bg-slate-800 hover:bg-stone-300/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-stone-300/70 dark:border-slate-700'
            }`}
            title="Atualizar diário e sincronizar com a nuvem (ou puxe para baixo na tela)"
            aria-label="Atualizar diário"
          >
            <RotateCw
              className={`w-4 h-4 transition-transform duration-300 ${
                isManualRefreshing ? 'animate-spin text-emerald-400' : 'group-hover:rotate-45'
              }`}
            />
          </button>

          {/* PWA Install Button (Android & iPhone) */}
          <PWAInstallButton variant="compact" />

          {/* Night Mode Badge (exclusively dark night with starry sky) */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 shadow-2xs"
            title="Modo Noite com Céu Estrelado Ativo"
            aria-label="Modo Noturno Estrelado"
          >
            <Moon className="w-4 h-4 fill-indigo-300/30" />
          </div>
        </div>
      </div>
    </header>
  );
}
