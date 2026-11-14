'use client';

import React from 'react';
import { useBaby } from '@/context/BabyContext';
import { RotateCcw, X } from 'lucide-react';

export function UndoToast() {
  const { undoAction, triggerUndo, dismissUndo } = useBaby();

  if (!undoAction) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/60">
        <span className="text-xs font-medium truncate">{undoAction.message}</span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={triggerUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors min-h-[38px] active:scale-95 cursor-pointer"
            aria-label="Desfazer última alteração"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>

          <button
            onClick={dismissUndo}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
