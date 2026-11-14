'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  formatFriendlyDate,
  format24hTime,
  formatDuration,
  formatShortDate,
} from '@/lib/date-utils';
import {
  X,
  Edit2,
  Trash2,
  Edit3,
  Star,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

export function RecordDetailModal() {
  const {
    viewingRecord,
    setViewingRecord,
    setEditingRecord,
    openSheet,
    deleteRecord,
    toggleFavoriteNote,
  } = useBaby();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!viewingRecord) return null;

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setViewingRecord(null);
  };

  const handleEdit = () => {
    setEditingRecord(viewingRecord);
    setViewingRecord(null);
    openSheet('edit');
  };

  const handleDelete = () => {
    deleteRecord(viewingRecord.id, 'Registro removido com sucesso');
    setShowDeleteConfirm(false);
    setViewingRecord(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4">
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-slate-800 shadow-xl overflow-hidden z-10 animate-in slide-in-from-bottom-5 duration-200 pb-safe"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-detail-title"
      >
        {/* Grab bar on mobile */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100">
              Detalhes do Registro
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Peito */}
          {viewingRecord.type === 'peito' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#DCE9DF]/50 dark:bg-[#1e2f24]/60">
                <div className="w-12 h-12 rounded-xl bg-[#DCE9DF] dark:bg-[#1e2f24] flex items-center justify-center shrink-0 p-2 shadow-2xs">
                  <CategoryIcon category="peito" size={28} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Mamada no Peito
                  </span>
                  <div className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100">
                    {viewingRecord.side === 'esquerdo'
                      ? 'Lado Esquerdo'
                      : viewingRecord.side === 'direito'
                      ? 'Lado Direito'
                      : 'Ambos os peitos'}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3.5 space-y-2 text-sm">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Calendar className="w-3.5 h-3.5" /> Data
                  </span>
                  <span className="font-medium">{formatFriendlyDate(viewingRecord.date)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/50 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" /> Horário
                  </span>
                  <span className="font-medium tabular-nums">
                    {format24hTime(viewingRecord.time) || '07h30'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mamadeira */}
          {viewingRecord.type === 'mamadeira' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F6E3D9]/60 dark:bg-[#34241d]/60">
                <div className="w-12 h-12 rounded-xl bg-[#F6E3D9] dark:bg-[#34241d] flex items-center justify-center shrink-0 p-2 shadow-2xs">
                  <CategoryIcon category="mamadeira" size={28} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wider">
                    Mamada na Mamadeira
                  </span>
                  <div className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100">
                    {viewingRecord.volumeMl !== null
                      ? `${viewingRecord.volumeMl} ml medidos`
                      : 'Sem volume medido'}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3.5 space-y-2 text-sm">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Calendar className="w-3.5 h-3.5" /> Data
                  </span>
                  <span className="font-medium">{formatFriendlyDate(viewingRecord.date)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/50 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" /> Horário
                  </span>
                  <span className="font-medium tabular-nums">
                    {format24hTime(viewingRecord.time) || '11h00'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sono */}
          {viewingRecord.type === 'sono' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EAE3F2]/60 dark:bg-[#282038]/60">
                <div className="w-12 h-12 rounded-xl bg-[#EAE3F2] dark:bg-[#282038] flex items-center justify-center shrink-0 p-2 shadow-2xs">
                  <CategoryIcon category="sono" size={28} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                    Sessão de Sono
                  </span>
                  <div className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100">
                    Duração: {formatDuration(viewingRecord.durationMinutes)}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3.5 space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                  <span className="text-xs text-stone-400">Início do sono</span>
                  <span className="font-medium tabular-nums">
                    {format24hTime(viewingRecord.startTime)} ({formatShortDate(viewingRecord.startDate)})
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/50 dark:border-slate-800">
                  <span className="text-xs text-stone-400">Acordou às</span>
                  <span className="font-medium tabular-nums">
                    {format24hTime(viewingRecord.endTime)} ({formatShortDate(viewingRecord.endDate)})
                  </span>
                </div>
                {viewingRecord.startDate !== viewingRecord.endDate && (
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-800 dark:text-indigo-300">
                    Sessão atravessou a meia-noite. Os minutos são divididos proporcionalmente entre cada dia.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fralda */}
          {viewingRecord.type === 'fralda' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F1E9D8]/60 dark:bg-[#322c20]/60">
                <div className="w-12 h-12 rounded-xl bg-[#F1E9D8] dark:bg-[#322c20] flex items-center justify-center shrink-0 p-2 shadow-2xs">
                  <CategoryIcon category="fralda" size={28} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Troca de Fralda
                  </span>
                  <div className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100">
                    {viewingRecord.diaperType === 'xixi' && 'Xixi'}
                    {viewingRecord.diaperType === 'coco' && 'Cocô'}
                    {viewingRecord.diaperType === 'ambos' && 'Xixi e Cocô (Ambos)'}
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3.5 space-y-2 text-sm">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Calendar className="w-3.5 h-3.5" /> Data
                  </span>
                  <span className="font-medium">{formatFriendlyDate(viewingRecord.date)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-200/50 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Clock className="w-3.5 h-3.5" /> Horário
                  </span>
                  <span className="font-medium tabular-nums">
                    {format24hTime(viewingRecord.time) || '08h15'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nota */}
          {viewingRecord.type === 'nota' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Anotação do Dia
                    </span>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatFriendlyDate(viewingRecord.date)} · {format24hTime(viewingRecord.time) || '12h45'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleFavoriteNote(viewingRecord.id)}
                  className="p-2.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-500"
                  aria-label={viewingRecord.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
                >
                  <Star
                    className={`w-6 h-6 ${
                      viewingRecord.isFavorite
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-400'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {viewingRecord.content}
              </div>

              <div className="text-xs text-stone-400 px-1">
                Horário registrado: {format24hTime(viewingRecord.time) || '12h45'}
              </div>
            </div>
          )}

          {/* Delete Confirmation Warning */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Deseja realmente remover este registro?</span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Você ainda poderá desfazer esta ação nos próximos segundos através do aviso inferior.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-colors min-h-[44px] flex items-center justify-center"
                >
                  Confirmar remoção
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors border border-stone-200 dark:border-slate-700 min-h-[44px] flex items-center justify-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Natural Thumb Zone) */}
        {!showDeleteConfirm && (
          <div className="p-4 bg-stone-50 dark:bg-[#15152b] border-t border-stone-100 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="py-3 px-4 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-semibold text-sm hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors min-h-[48px] flex items-center justify-center gap-2 active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
