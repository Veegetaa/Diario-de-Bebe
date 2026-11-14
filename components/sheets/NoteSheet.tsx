'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { NoteRecord } from '@/lib/types';
import { SpecificTimeToggle } from './SpecificTimeToggle';
import { getCurrentTimeString, validateNotFuture } from '@/lib/date-utils';
import { X, Edit3, Star, Mic, MicOff, AlertCircle } from 'lucide-react';

export function NoteSheet() {
  const { activeSheet, closeSheet, addRecord, selectedDate } = useBaby();

  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState(getCurrentTimeString());
  const [timeError, setTimeError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  if (activeSheet !== 'nota') return null;

  // Speech-to-text dictation using Web Speech API if supported
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Ditado por voz suportado através do microfone do teclado do seu aparelho.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setContentError(null);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleSave = () => {
    if (!content.trim()) {
      setContentError('Por favor, escreva uma mensagem antes de salvar');
      return;
    }

    const err = validateNotFuture(date, time);
    if (err) {
      setTimeError(err);
      return;
    }

    const newRecord: NoteRecord = {
      id: `rec-nota-${Date.now()}`,
      type: 'nota',
      date,
      hasSpecificTime: true,
      time: time || getCurrentTimeString(),
      content: content.trim(),
      isFavorite,
      createdAt: Date.now(),
    };

    addRecord(newRecord, 'Anotação salva');
    setContent('');
    setIsFavorite(false);
    setContentError(null);
    closeSheet();
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
        aria-labelledby="note-sheet-title"
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="note-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Como foi o dia?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Escreva ou dite o que aconteceu na rotina
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

        {/* Text Input area with Dictation & Favorite Star */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (contentError) setContentError(null);
              }}
              placeholder="Ex: Teve cólica depois da mamada e se acalmou no colo… Sorriu no banho… Brincou bastante…"
              className="w-full p-3.5 pb-10 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#24473D] resize-none"
              aria-label="Conteúdo da anotação"
            />

            {/* In-box tools: Voice Dictation & Favorite Star */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[38px] ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
                title="Ditar por voz"
                aria-label="Ditar anotação por voz"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isListening ? 'Ouvindo…' : 'Ditar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-xl transition-colors min-h-[38px] flex items-center gap-1 ${
                  isFavorite
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'bg-stone-200/70 dark:bg-slate-700 text-stone-400 hover:text-amber-500'
                }`}
                aria-label={isFavorite ? 'Marcada como favorita' : 'Marcar como favorita'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorite ? 'fill-amber-400 text-amber-400' : 'text-stone-400'
                  }`}
                />
                <span className="text-[11px] font-medium">Favorito</span>
              </button>
            </div>
          </div>

          {contentError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{contentError}</span>
            </div>
          )}
        </div>

        {/* Date & 24h Time controls */}
        <div className="bg-stone-50 dark:bg-[#15152b] rounded-2xl p-3 border border-stone-200/60 dark:border-slate-800/80 mb-4">
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
                  aria-label="Horário da anotação"
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
                aria-label="Data da anotação"
              />
            </div>
          </div>

          {timeError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">
              {timeError}
            </p>
          )}
        </div>

        {/* Save button (Natural Thumb Reach) */}
        <div className="pt-1">
          <button
            onClick={handleSave}
            className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
          >
            Salvar anotação
          </button>
        </div>
      </div>
    </div>
  );
}
