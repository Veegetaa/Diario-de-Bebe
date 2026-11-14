'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  BabyRecord,
  BreastfeedingRecord,
  BottleRecord,
  SleepRecord,
  DiaperRecord,
  NoteRecord,
} from '@/lib/types';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import {
  getCurrentTimeString,
  validateNotFuture,
  calculateSleepDuration,
  validateSleepSession,
} from '@/lib/date-utils';
import { X, Save, AlertCircle, Minus, Plus } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

interface EditRecordFormProps {
  record: BabyRecord;
  onSave: (updated: BabyRecord) => void;
  onClose: () => void;
}

function EditRecordForm({ record, onSave, onClose }: EditRecordFormProps) {
  // Common fields initialized directly from record
  const [date, setDate] = useState(() => (record.type === 'sono' ? record.startDate : record.date));
  const [hasSpecificTime, setHasSpecificTime] = useState(() =>
    record.type === 'sono' ? true : record.hasSpecificTime
  );
  const [time, setTime] = useState(() =>
    record.type === 'sono' ? record.startTime : record.time || getCurrentTimeString()
  );
  const [timeError, setTimeError] = useState<string | null>(null);

  // Peito
  const [side, setSide] = useState<'esquerdo' | 'direito' | 'ambos'>(() =>
    record.type === 'peito' ? record.side : 'esquerdo'
  );

  // Mamadeira
  const [volumeMl, setVolumeMl] = useState<number | null>(() =>
    record.type === 'mamadeira' ? record.volumeMl : 120
  );

  // Sono
  const [sleepStartDate, setSleepStartDate] = useState(() =>
    record.type === 'sono' ? record.startDate : date
  );
  const [sleepStartTime, setSleepStartTime] = useState(() =>
    record.type === 'sono' ? record.startTime : '13:00'
  );
  const [sleepEndDate, setSleepEndDate] = useState(() =>
    record.type === 'sono' ? record.endDate : date
  );
  const [sleepEndTime, setSleepEndTime] = useState(() =>
    record.type === 'sono' ? record.endTime : '14:30'
  );
  const [sleepError, setSleepError] = useState<string | null>(null);

  // Fralda
  const [diaperType, setDiaperType] = useState<'xixi' | 'coco' | 'ambos'>(() =>
    record.type === 'fralda' ? record.diaperType : 'xixi'
  );

  // Nota
  const [content, setContent] = useState(() =>
    record.type === 'nota' ? record.content : ''
  );
  const [isFavorite, setIsFavorite] = useState(() =>
    record.type === 'nota' ? record.isFavorite : false
  );

  const handleSubmit = () => {
    if (record.type !== 'sono' && hasSpecificTime) {
      const err = validateNotFuture(date, time);
      if (err) {
        setTimeError(err);
        return;
      }
    }

    if (record.type === 'peito') {
      const updated: BreastfeedingRecord = {
        ...record,
        date,
        hasSpecificTime,
        time: hasSpecificTime ? time : undefined,
        side,
      };
      onSave(updated);
    } else if (record.type === 'mamadeira') {
      const updated: BottleRecord = {
        ...record,
        date,
        hasSpecificTime,
        time: hasSpecificTime ? time : undefined,
        volumeMl,
      };
      onSave(updated);
    } else if (record.type === 'sono') {
      const val = validateSleepSession(
        sleepStartDate,
        sleepStartTime,
        sleepEndDate,
        sleepEndTime
      );
      if (!val.isValid) {
        setSleepError(val.errorMessage || 'Verifique as datas e horários');
        return;
      }

      const duration = calculateSleepDuration(
        sleepStartDate,
        sleepStartTime,
        sleepEndDate,
        sleepEndTime
      );

      const updated: SleepRecord = {
        ...record,
        startDate: sleepStartDate,
        startTime: sleepStartTime,
        endDate: sleepEndDate,
        endTime: sleepEndTime,
        durationMinutes: duration,
      };
      onSave(updated);
    } else if (record.type === 'fralda') {
      const updated: DiaperRecord = {
        ...record,
        date,
        hasSpecificTime,
        time: hasSpecificTime ? time : undefined,
        diaperType,
      };
      onSave(updated);
    } else if (record.type === 'nota') {
      if (!content.trim()) {
        setTimeError('A anotação não pode ficar vazia');
        return;
      }
      const updated: NoteRecord = {
        ...record,
        date,
        hasSpecificTime,
        time: hasSpecificTime ? time : undefined,
        content: content.trim(),
        isFavorite,
      };
      onSave(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Peito: Side buttons */}
      {record.type === 'peito' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Lado da mamada
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSide('esquerdo')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                side === 'esquerdo'
                  ? 'bg-[#24473D] text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Esquerdo
            </button>
            <button
              type="button"
              onClick={() => setSide('direito')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                side === 'direito'
                  ? 'bg-[#24473D] text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Direito
            </button>
            <button
              type="button"
              onClick={() => setSide('ambos')}
              className={`col-span-2 py-3 px-4 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                side === 'ambos'
                  ? 'bg-[#24473D] text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              Ambos os peitos
            </button>
          </div>
        </div>
      )}

      {/* Mamadeira: Volume adjustment */}
      {record.type === 'mamadeira' && (
        <div className="p-4 rounded-2xl bg-[#FBF7F1] dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Volume em mililitros
            </span>
            <span className="font-serif font-bold text-xl text-orange-950 dark:text-orange-200">
              {volumeMl !== null ? `${volumeMl} ml` : 'Sem volume'}
            </span>
          </div>

          {volumeMl !== null ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVolumeMl((v) => Math.max(0, (v || 0) - 5))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="350"
                  step="5"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                  className="flex-1 h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none accent-[#24473D]"
                />
                <button
                  type="button"
                  onClick={() => setVolumeMl((v) => Math.min(350, (v || 0) + 5))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setVolumeMl(null)}
                className="text-xs text-stone-500 hover:text-stone-700 underline"
              >
                Alterar para sem volume medido
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setVolumeMl(120)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-slate-700"
            >
              Adicionar medição em ml (iniciar com 120 ml)
            </button>
          )}
        </div>
      )}

      {/* Sono: Edit both endpoints */}
      {record.type === 'sono' && (
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Início do Sono
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={sleepStartDate}
                onChange={(e) => setSleepStartDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold tabular-nums"
              />
              <input
                type="time"
                value={sleepStartTime}
                onChange={(e) => setSleepStartTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Término do Sono (Acordou)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={sleepEndDate}
                onChange={(e) => setSleepEndDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold tabular-nums"
              />
              <input
                type="time"
                value={sleepEndTime}
                onChange={(e) => setSleepEndTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          {sleepError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{sleepError}</span>
            </div>
          )}
        </div>
      )}

      {/* Fralda: Diaper type buttons */}
      {record.type === 'fralda' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Tipo de fralda
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['xixi', 'coco', 'ambos'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiaperType(t)}
                className={`py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all min-h-[44px] ${
                  diaperType === t
                    ? 'bg-[#24473D] text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {t === 'xixi' && 'Xixi'}
                {t === 'coco' && 'Cocô'}
                {t === 'ambos' && 'Ambos'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nota: Content text and Favorite checkbox */}
      {record.type === 'nota' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Texto da anotação
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#24473D]"
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="rounded text-[#24473D] focus:ring-[#24473D] w-4 h-4"
            />
            <span>Marcar como favorito</span>
          </label>
        </div>
      )}

      {/* Common 24h Time & Date controls */}
      {record.type !== 'sono' && (
        <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3 border border-stone-200/60 dark:border-slate-800/80">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
                Horário (24h)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setTimeError(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  aria-label="Horário do registro"
                />
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTimeString())}
                  className="px-2 py-2 rounded-xl bg-stone-200/60 dark:bg-slate-700 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 transition-colors shrink-0"
                >
                  Agora
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimeError(null);
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                aria-label="Data do registro"
              />
            </div>
          </div>

          {timeError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">
              {timeError}
            </p>
          )}
        </div>
      )}

      {/* Save button (Natural Thumb Reach) */}
      <div className="pt-1">
        <button
          onClick={handleSubmit}
          className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
        >
          <Save className="w-5 h-5" />
          <span>Salvar alterações</span>
        </button>
      </div>
    </div>
  );
}

export function EditRecordSheet() {
  const {
    activeSheet,
    closeSheet,
    editingRecord,
    updateRecord,
    setEditingRecord,
  } = useBaby();

  if (activeSheet !== 'edit' || !editingRecord) return null;

  const handleSave = (updated: BabyRecord) => {
    updateRecord(updated, 'Registro atualizado');
    closeSheet();
    setEditingRecord(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="fixed inset-0"
        onClick={closeSheet}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-sheet-title"
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center p-1.5 shadow-2xs border border-stone-200/50 dark:border-slate-700">
              <CategoryIcon category={editingRecord.type} size={20} />
            </div>
            <div>
              <h2
                id="edit-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Editar Registro
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                {editingRecord.type === 'peito' && 'Mamada no peito'}
                {editingRecord.type === 'mamadeira' && 'Mamadeira'}
                {editingRecord.type === 'sono' && 'Sessão de sono'}
                {editingRecord.type === 'fralda' && 'Troca de fralda'}
                {editingRecord.type === 'nota' && 'Anotação do dia'}
              </p>
            </div>
          </div>
          <button
            onClick={closeSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Cancelar edição"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner form keyed by record id so state is cleanly initialized */}
        <EditRecordForm
          key={editingRecord.id}
          record={editingRecord}
          onSave={handleSave}
          onClose={closeSheet}
        />
      </div>
    </div>
  );
}
