'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  getCurrentTimeString,
  getTodayDateString,
  validateNotFuture,
} from '@/lib/date-utils';
import {
  BabyRecord,
  BreastfeedingRecord,
  BottleRecord,
  SleepRecord,
  DiaperRecord,
  NoteRecord,
} from '@/lib/types';
import {
  X,
  History,
  Calendar,
  Clock,
  Sparkles,
  Edit3,
  AlertCircle,
  Save,
} from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function ForgottenRecordSheet() {
  const { activeSheet, closeSheet, addRecord, selectedDate } = useBaby();

  const [date, setDate] = useState(selectedDate || getTodayDateString());
  const [time, setTime] = useState(() => getCurrentTimeString());
  const [category, setCategory] = useState<'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota'>('peito');

  // Specific sub-fields
  const [side, setSide] = useState<'esquerdo' | 'direito' | 'ambos'>('esquerdo');
  const [volumeMl, setVolumeMl] = useState<number | ''>(120);
  const [sleepMinutes, setSleepMinutes] = useState(45);
  const [diaperType, setDiaperType] = useState<'xixi' | 'coco' | 'ambos'>('xixi');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (activeSheet !== 'esquecido') return null;

  const handleSave = () => {
    const timeErr = validateNotFuture(date, time);
    if (timeErr) {
      setError(timeErr);
      return;
    }

    const now = Date.now();
    let newRecord: BabyRecord;

    if (category === 'peito') {
      const rec: BreastfeedingRecord = {
        id: `rec-esq-peito-${now}`,
        type: 'peito',
        date,
        hasSpecificTime: true,
        time,
        side,
        createdAt: now,
      };
      newRecord = rec;
    } else if (category === 'mamadeira') {
      const rec: BottleRecord = {
        id: `rec-esq-mam-${now}`,
        type: 'mamadeira',
        date,
        hasSpecificTime: true,
        time,
        volumeMl: typeof volumeMl === 'number' ? volumeMl : null,
        createdAt: now,
      };
      newRecord = rec;
    } else if (category === 'sono') {
      const [h, m] = time.split(':').map(Number);
      const endTotalM = h * 60 + m + sleepMinutes;
      const endH = String(Math.floor((endTotalM / 60) % 24)).padStart(2, '0');
      const endM = String(endTotalM % 60).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const rec: SleepRecord = {
        id: `rec-esq-sono-${now}`,
        type: 'sono',
        startDate: date,
        startTime: time,
        endDate: date,
        endTime,
        durationMinutes: sleepMinutes,
        createdAt: now,
      };
      newRecord = rec;
    } else if (category === 'fralda') {
      const rec: DiaperRecord = {
        id: `rec-esq-fralda-${now}`,
        type: 'fralda',
        date,
        hasSpecificTime: true,
        time,
        diaperType,
        createdAt: now,
      };
      newRecord = rec;
    } else {
      const rec: NoteRecord = {
        id: `rec-esq-nota-${now}`,
        type: 'nota',
        date,
        hasSpecificTime: true,
        time,
        content: description.trim() || 'Registro esquecido',
        isFavorite: false,
        createdAt: now,
      };
      newRecord = rec;
    }

    // If description was provided for non-note, we can save it as note or log it
    if (category !== 'nota' && description.trim()) {
      addRecord(newRecord, 'Registro esquecido salvo');
      // Also add accompanying note if written
      addRecord({
        id: `rec-esq-nota-extra-${now + 1}`,
        type: 'nota',
        date,
        hasSpecificTime: true,
        time,
        content: `[${category.toUpperCase()}] ${description.trim()}`,
        isFavorite: false,
        createdAt: now + 1,
      });
    } else {
      addRecord(newRecord, 'Registro esquecido salvo');
    }

    closeSheet();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-0" onClick={closeSheet} aria-hidden="true" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgotten-sheet-title"
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <History className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2
                id="forgotten-sheet-title"
                className="font-serif font-semibold text-lg text-slate-800 dark:text-slate-100"
              >
                Registro Esquecido
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-light">
                Informe a data, o horário e o que aconteceu
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

        <div className="space-y-4">
          {/* 1. Date & Time Selection */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data da ocorrência
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Horário (24h)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                />
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTimeString())}
                  className="px-2 py-2 rounded-xl bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300 transition-colors shrink-0"
                >
                  Agora
                </button>
              </div>
            </div>
          </div>

          {/* 2. Category selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              O que você quer registrar?
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <button
                type="button"
                onClick={() => setCategory('peito')}
                className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                  category === 'peito'
                    ? 'bg-[#DCE9DF] dark:bg-[#203427] text-[#24473D] dark:text-emerald-300 border-emerald-600/30 ring-1 ring-emerald-500/30'
                    : 'bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <CategoryIcon category="peito" size={20} />
                <span className="text-[10px] font-medium">Peito</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('mamadeira')}
                className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                  category === 'mamadeira'
                    ? 'bg-[#F6E3D9] dark:bg-[#38261e] text-orange-950 dark:text-orange-200 border-orange-600/30 ring-1 ring-orange-500/30'
                    : 'bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <CategoryIcon category="mamadeira" size={20} />
                <span className="text-[10px] font-medium">Mamadeira</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('sono')}
                className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                  category === 'sono'
                    ? 'bg-[#EAE3F2] dark:bg-[#2d223f] text-purple-950 dark:text-purple-200 border-purple-600/30 ring-1 ring-purple-500/30'
                    : 'bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <CategoryIcon category="sono" size={20} />
                <span className="text-[10px] font-medium">Sono</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('fralda')}
                className={`p-2 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                  category === 'fralda'
                    ? 'bg-[#F1E9D8] dark:bg-[#342e20] text-amber-950 dark:text-amber-200 border-amber-600/30 ring-1 ring-amber-500/30'
                    : 'bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <CategoryIcon category="fralda" size={20} />
                <span className="text-[10px] font-medium">Fralda</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('nota')}
                className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 transition-all border ${
                  category === 'nota'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-500/30 ring-1 ring-amber-500/30'
                    : 'bg-stone-50 dark:bg-slate-800/60 text-stone-600 dark:text-stone-400 border-stone-200/60 dark:border-slate-700'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-[10px] font-medium">Nota</span>
              </button>
            </div>
          </div>

          {/* 3. Sub-options for the chosen category */}
          {category === 'peito' && (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Lado do peito:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSide('esquerdo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    side === 'esquerdo'
                      ? 'bg-[#24473D] text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Esquerdo
                </button>
                <button
                  type="button"
                  onClick={() => setSide('direito')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    side === 'direito'
                      ? 'bg-[#24473D] text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Direito
                </button>
                <button
                  type="button"
                  onClick={() => setSide('ambos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    side === 'ambos'
                      ? 'bg-[#24473D] text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Ambos os peitos
                </button>
              </div>
            </div>
          )}

          {category === 'mamadeira' && (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Volume:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="350"
                  step="5"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ml"
                  className="w-20 px-2 py-1.5 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-center font-bold text-sm text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                />
                <span className="text-xs text-stone-500">ml</span>
              </div>
            </div>
          )}

          {category === 'sono' && (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Duração estimada:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="720"
                  step="5"
                  value={sleepMinutes}
                  onChange={(e) => setSleepMinutes(Math.max(5, Number(e.target.value)))}
                  className="w-20 px-2 py-1.5 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-center font-bold text-sm text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                />
                <span className="text-xs text-stone-500">minutos</span>
              </div>
            </div>
          )}

          {category === 'fralda' && (
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Tipo:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDiaperType('xixi')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    diaperType === 'xixi'
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Xixi
                </button>
                <button
                  type="button"
                  onClick={() => setDiaperType('coco')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    diaperType === 'coco'
                      ? 'bg-amber-800 text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Cocô
                </button>
                <button
                  type="button"
                  onClick={() => setDiaperType('ambos')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    diaperType === 'ambos'
                      ? 'bg-[#24473D] text-white'
                      : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  Ambos
                </button>
              </div>
            </div>
          )}

          {/* 4. Box: O que registrar / Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              O que registrar / Observações
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que aconteceu (ex: Mamou com calma e arrotou; acordou tranquilo…)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/80 dark:border-slate-800 text-sm font-normal text-slate-800 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#24473D] resize-none leading-relaxed"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1b362e] dark:hover:bg-emerald-500 text-white font-serif font-semibold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Registro Esquecido</span>
          </button>
        </div>
      </div>
    </div>
  );
}
