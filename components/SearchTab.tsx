'use client';

import React, { useState, useMemo } from 'react';
import { useBaby } from '@/context/BabyContext';
import { NoteRecord } from '@/lib/types';
import {
  matchesSearchTerms,
  getHighlightedSnippetData,
} from '@/lib/search-utils';
import {
  formatFriendlyDate,
  format24hTime,
  getTodayDateString,
} from '@/lib/date-utils';
import {
  Search as SearchIcon,
  Star,
  Calendar as CalendarIcon,
  X,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';

export function SearchTab() {
  const {
    records,
    toggleFavoriteNote,
    jumpToDate,
    setViewingRecord,
    dayColors,
    openSheet,
    setSelectedDate,
  } = useBaby();

  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [period, setPeriod] = useState<'todos' | '7dias' | '30dias' | 'mes'>('todos');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Today reference & Month navigation for search calendar
  const today = getTodayDateString();
  const [todayY, todayM] = today.split('-').map(Number);
  const [calYear, setCalYear] = useState(todayY);
  const [calMonth, setCalMonth] = useState(todayM); // 1-12

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Filter only note records
  const allNotes = useMemo(() => {
    return records.filter((r): r is NoteRecord => r.type === 'nota');
  }, [records]);

  // Notes count mapped by date
  const notesByDateCount = useMemo(() => {
    const map: Record<string, number> = {};
    allNotes.forEach((n) => {
      map[n.date] = (map[n.date] || 0) + 1;
    });
    return map;
  }, [allNotes]);

  // Compute filtered & searched notes
  const filteredNotes = useMemo(() => {
    const todayDateObj = new Date(today);

    return allNotes
      .filter((note) => {
        // 1. Check specific day filter if chosen
        if (selectedDateFilter) {
          if (note.date !== selectedDateFilter) {
            return false;
          }
        } else {
          // 2. Check period filter only when no specific day is selected
          if (period !== 'todos') {
            const noteDateObj = new Date(note.date);
            const diffMs = todayDateObj.getTime() - noteDateObj.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (period === '7dias' && diffDays > 7) return false;
            if (period === '30dias' && diffDays > 30) return false;
            if (period === 'mes') {
              const [ny, nm] = note.date.split('-');
              const [ty, tm] = today.split('-');
              if (ny !== ty || nm !== tm) return false;
            }
          }
        }

        // 3. Check favorites filter
        if (onlyFavorites && !note.isFavorite) {
          return false;
        }

        // 4. Search query matching (all words, prefix, accent-insensitive)
        if (query.trim()) {
          return matchesSearchTerms(note.content, query);
        }

        return true;
      })
      .sort((a, b) => {
        // Order newest to oldest
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        if (a.hasSpecificTime && b.hasSpecificTime && a.time && b.time) {
          return b.time.localeCompare(a.time);
        }
        return b.createdAt - a.createdAt;
      });
  }, [allNotes, query, onlyFavorites, period, selectedDateFilter, today]);

  const totalFavoritesCount = allNotes.filter((n) => n.isFavorite).length;

  const handleClearFilters = () => {
    setQuery('');
    setOnlyFavorites(false);
    setPeriod('todos');
    setSelectedDateFilter(null);
  };

  const handleSelectDay = (dateStr: string) => {
    if (selectedDateFilter === dateStr) {
      setSelectedDateFilter(null);
    } else {
      setSelectedDateFilter(dateStr);
    }
  };

  const handlePrevCalMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleWriteNoteForDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    openSheet('nota');
  };

  // Calendar calculations
  const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100">
            Buscar Anotações
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Pesquise palavras ou selecione um dia no calendário
          </p>
        </div>

        {/* Quick Favoritos badge / shortcut */}
        <button
          onClick={() => {
            setOnlyFavorites((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
            onlyFavorites
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
              : 'bg-stone-200/60 dark:bg-slate-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
          }`}
          aria-pressed={onlyFavorites}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              onlyFavorites
                ? 'fill-amber-400 text-amber-400'
                : 'text-stone-400 dark:text-stone-500'
            }`}
          />
          <span>Favoritos ({totalFavoritesCount})</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por palavra (ex: cólica, sorriu, vacina)…"
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#24473D] shadow-xs"
          aria-label="Campo de busca"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Limpar termo de busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar Toggle & Date Picker trigger */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowCalendar((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all min-h-[40px] border shadow-xs ${
            showCalendar || selectedDateFilter
              ? 'bg-[#24473D] text-white border-[#24473D] shadow-sm'
              : 'bg-white dark:bg-[#1a1a33] text-stone-700 dark:text-stone-300 border-stone-200/70 dark:border-slate-800 hover:border-stone-300'
          }`}
          aria-expanded={showCalendar}
        >
          <CalendarDays className="w-4 h-4" />
          <span>
            {selectedDateFilter
              ? `Dia: ${formatFriendlyDate(selectedDateFilter)}`
              : 'Selecionar dia no calendário'}
          </span>
        </button>

        {selectedDateFilter && (
          <button
            onClick={() => setSelectedDateFilter(null)}
            className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 min-h-[40px]"
            title="Remover filtro de dia"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar dia</span>
          </button>
        )}
      </div>

      {/* Interactive Month Calendar Picker (Collapsible / Expandable) */}
      {showCalendar && (
        <div className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 shadow-sm animate-in fade-in duration-200">
          {/* Calendar Header with Month & Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                {monthNames[calMonth - 1]} {calYear}
              </span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Toque em um dia para ver apenas o que foi escrito nele
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const [ty, tm] = today.split('-').map(Number);
                  setCalYear(ty);
                  setCalMonth(tm);
                  setSelectedDateFilter(today);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#24473D] dark:text-emerald-400 bg-stone-100 dark:bg-slate-800 rounded-lg hover:bg-stone-200 min-h-[32px]"
              >
                Hoje
              </button>
              <button
                onClick={handlePrevCalMonth}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextCalMonth}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map((w, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-bold ${
                  idx === 0 ? 'text-rose-400' : 'text-stone-400'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for start day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day Numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayStr = String(day).padStart(2, '0');
              const monthStr = String(calMonth).padStart(2, '0');
              const dateStr = `${calYear}-${monthStr}-${dayStr}`;

              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDateFilter;
              const notesCount = notesByDateCount[dateStr] || 0;
              const hasNotes = notesCount > 0;
              const alertColor = dayColors ? dayColors[dateStr] : undefined;

              // Compute alert borders
              let alertClasses = '';
              if (alertColor === 'vermelho') {
                alertClasses = isSelected
                  ? 'ring-2 ring-rose-500 font-bold'
                  : 'border-2 border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-500 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)]';
              } else if (alertColor === 'amarelo') {
                alertClasses = isSelected
                  ? 'ring-2 ring-amber-400 font-bold'
                  : 'border-2 border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-600 font-bold shadow-[0_0_8px_rgba(251,191,36,0.3)]';
              }

              return (
                <button
                  key={day}
                  onClick={() => handleSelectDay(dateStr)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all min-h-[38px] min-w-[38px] ${
                    isSelected
                      ? 'bg-[#24473D] text-white shadow-sm font-bold scale-105 z-10'
                      : isToday
                      ? 'border border-[#24473D] dark:border-emerald-500 text-[#24473D] dark:text-emerald-400 font-bold hover:bg-stone-100 dark:hover:bg-slate-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                  } ${alertClasses}`}
                  aria-label={`Selecionar ${dayStr}/${monthStr}/${calYear}`}
                >
                  <span className="text-xs leading-none">{day}</span>

                  {/* Indicator dot if notes exist on this day */}
                  {hasNotes && (
                    <div className="flex items-center gap-0.5 mt-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-300'
                            : alertColor === 'vermelho'
                            ? 'bg-rose-500'
                            : alertColor === 'amarelo'
                            ? 'bg-amber-500'
                            : 'bg-emerald-600 dark:bg-emerald-400'
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick shortcuts & legend */}
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Com anotações</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-100 dark:bg-amber-950" />
                <span>Alerta Amarelo</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-100 dark:bg-rose-950" />
                <span>Alerta Vermelho</span>
              </span>
            </div>

            <button
              onClick={() => setShowCalendar(false)}
              className="text-[#24473D] dark:text-emerald-400 font-semibold hover:underline"
            >
              Fechar calendário
            </button>
          </div>
        </div>
      )}

      {/* Period Filter (Active when no specific date is selected) */}
      {!selectedDateFilter && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider pl-1 shrink-0">
            Período:
          </span>
          <button
            onClick={() => setPeriod('todos')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              period === 'todos'
                ? 'bg-[#24473D] text-white'
                : 'bg-stone-200/60 dark:bg-slate-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setPeriod('7dias')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              period === '7dias'
                ? 'bg-[#24473D] text-white'
                : 'bg-stone-200/60 dark:bg-slate-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriod('30dias')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              period === '30dias'
                ? 'bg-[#24473D] text-white'
                : 'bg-stone-200/60 dark:bg-slate-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => setPeriod('mes')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              period === 'mes'
                ? 'bg-[#24473D] text-white'
                : 'bg-stone-200/60 dark:bg-slate-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            Este mês
          </button>
        </div>
      )}

      {/* Selected Day Status Banner */}
      {selectedDateFilter && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200/70 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <CalendarIcon className="w-4 h-4 text-[#24473D] dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Mostrando apenas: {formatFriendlyDate(selectedDateFilter)}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {filteredNotes.length}{' '}
                {filteredNotes.length === 1 ? 'anotação escrita' : 'anotações escritas'} neste dia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleWriteNoteForDay(selectedDateFilter)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#24473D] text-white text-xs font-semibold hover:opacity-90 min-h-[34px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Escrever</span>
            </button>
            <button
              onClick={() => setSelectedDateFilter(null)}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 min-h-[34px] min-w-[34px] flex items-center justify-center"
              title="Ver todos os dias"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1 pt-1">
        <span>
          {filteredNotes.length}{' '}
          {filteredNotes.length === 1 ? 'anotação encontrada' : 'anotações encontradas'}
        </span>
        {(query || onlyFavorites || period !== 'todos' || selectedDateFilter) && (
          <button
            onClick={handleClearFilters}
            className="text-[#24473D] dark:text-emerald-400 font-semibold hover:underline"
          >
            Limpar todos os filtros
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const { prefixEllipsis, segments, suffixEllipsis } = getHighlightedSnippetData(
              note.content,
              query
            );

            return (
              <div
                key={note.id}
                onClick={() => setViewingRecord(note)}
                className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 shadow-xs hover:border-stone-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
              >
                {/* Note Top Bar: Date & Favorite Star */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <CalendarIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatFriendlyDate(note.date)}</span>
                    {note.hasSpecificTime && note.time && (
                      <>
                        <span>·</span>
                        <span className="tabular-nums">{format24hTime(note.time)}</span>
                      </>
                    )}
                  </div>

                  {/* Favorite Star button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteNote(note.id);
                    }}
                    className="p-2 -mr-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-500"
                    aria-label={
                      note.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'
                    }
                  >
                    <Star
                      className={`w-4 h-4 ${
                        note.isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 dark:text-stone-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Highlighted text snippet */}
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {prefixEllipsis}
                  {segments.map((seg, idx) =>
                    seg.isMatch ? (
                      <mark
                        key={idx}
                        className="bg-amber-200 dark:bg-amber-800 text-slate-900 dark:text-amber-100 rounded px-0.5 font-medium"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={idx}>{seg.text}</span>
                    )
                  )}
                  {suffixEllipsis}
                </p>

                {/* Quick Action: Ver dia no calendário / linha do tempo */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400 text-[11px]">Toque para ver detalhes</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToDate(note.date);
                    }}
                    className="flex items-center gap-1 text-[#24473D] dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <span>Ver na Linha do Tempo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty Search / No Results State */
          <div className="py-12 px-4 text-center bg-white/60 dark:bg-[#1a1a33]/50 rounded-3xl border border-dashed border-stone-200 dark:border-slate-800">
            <BookOpen className="w-9 h-9 mx-auto text-stone-300 dark:text-stone-600 mb-2.5" />
            <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-200">
              {selectedDateFilter
                ? `Nenhuma anotação neste dia (${formatFriendlyDate(selectedDateFilter)})`
                : query || onlyFavorites || period !== 'todos'
                ? 'Nenhuma anotação encontrada'
                : 'Busque no diário do bebê'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {selectedDateFilter ? (
                'Não foi escrita nenhuma anotação nesta data selecionada. Deseja adicionar uma agora?'
              ) : query || onlyFavorites || period !== 'todos' ? (
                'Tente buscar por termos diferentes ou limpe os filtros ativos para ver mais resultados.'
              ) : (
                'Digite palavras-chave, escolha um dia no calendário ou toque no botão de Favoritos acima.'
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {selectedDateFilter && (
                <>
                  <button
                    onClick={() => handleWriteNoteForDay(selectedDateFilter)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#24473D] text-white text-xs font-semibold active:scale-95 transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Escrever anotação para este dia</span>
                  </button>
                  <button
                    onClick={() => jumpToDate(selectedDateFilter)}
                    className="px-4 py-2 rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-xs font-semibold active:scale-95 transition-all"
                  >
                    Ver Linha do Tempo deste dia
                  </button>
                </>
              )}

              {(query || onlyFavorites || period !== 'todos' || selectedDateFilter) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-600 dark:text-stone-300 text-xs font-semibold active:scale-95 transition-all"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
