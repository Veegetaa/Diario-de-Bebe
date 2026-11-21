'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { BabyRecord, DayAlertColor, MedicationRecord, VaccineRecord } from '@/lib/types';
import { formatFriendlyDate, getCurrentTimeString } from '@/lib/date-utils';
import {
  X,
  Check,
  Pill,
  Syringe,
  ShieldAlert,
  AlertTriangle,
  Save,
  Trash2,
} from 'lucide-react';

const MEDICATION_SUGGESTIONS = [
  'Vitamina D',
  'Ferro',
  'Antitérmico',
  'Soro nasal',
  'Colírio',
];

const VACCINE_SUGGESTIONS = [
  'Pentavalente',
  'Rotavírus',
  'Pneumocócica',
  'Meningocócica',
  'BCG / Hepatite B',
];

interface CalendarRegisterFormProps {
  selectedDate: string;
  currentAlert: DayAlertColor | undefined;
  existingMedsCount: number;
  existingVaccinesCount: number;
  onClose: () => void;
}

function CalendarRegisterForm({
  selectedDate,
  currentAlert,
  existingMedsCount,
  existingVaccinesCount,
  onClose,
}: CalendarRegisterFormProps) {
  const { setDayColor, addRecordsBatch } = useBaby();

  // Multi-select options
  const [selectRed, setSelectRed] = useState<boolean>(currentAlert === 'vermelho');
  const [selectYellow, setSelectYellow] = useState<boolean>(currentAlert === 'amarelo');
  const [selectMed, setSelectMed] = useState<boolean>(false);
  const [selectVaccine, setSelectVaccine] = useState<boolean>(false);

  // Medication fields
  const [medName, setMedName] = useState<string>('');
  const [medTime, setMedTime] = useState<string>(getCurrentTimeString());
  const [medNotes, setMedNotes] = useState<string>('');

  // Vaccine fields
  const [vaccineName, setVaccineName] = useState<string>('');
  const [vaccineTime, setVaccineTime] = useState<string>(getCurrentTimeString());
  const [vaccineNotes, setVaccineNotes] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  const toggleRed = () => {
    setError(null);
    setSelectRed((prev) => {
      const next = !prev;
      if (next) setSelectYellow(false);
      return next;
    });
  };

  const toggleYellow = () => {
    setError(null);
    setSelectYellow((prev) => {
      const next = !prev;
      if (next) setSelectRed(false);
      return next;
    });
  };

  const alertChanged =
    (selectRed && currentAlert !== 'vermelho') ||
    (selectYellow && currentAlert !== 'amarelo') ||
    (!selectRed && !selectYellow && Boolean(currentAlert));

  const hasActionToSave = alertChanged || selectMed || selectVaccine;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectMed && !medName.trim()) {
      setError('Descreva qual remédio ou vitamina foi tomado.');
      return;
    }

    if (selectVaccine && !vaccineName.trim()) {
      setError('Descreva qual vacina foi aplicada.');
      return;
    }

    if (!hasActionToSave) {
      setError('Selecione ao menos uma opção acima para registrar neste dia.');
      return;
    }

    // 1. Apply alert color change if selected or cleared
    if (selectRed) {
      setDayColor(selectedDate, 'vermelho');
    } else if (selectYellow) {
      setDayColor(selectedDate, 'amarelo');
    } else if (currentAlert) {
      setDayColor(selectedDate, null);
    }

    // 2. Create medication / vaccine records atomically
    const newRecords: BabyRecord[] = [];
    const now = Date.now();

    if (selectMed) {
      const medRec: MedicationRecord = {
        id: `rec-med-${now}`,
        type: 'remedio',
        date: selectedDate,
        hasSpecificTime: true,
        time: medTime || getCurrentTimeString(),
        name: medName.trim(),
        notes: medNotes.trim() || undefined,
        createdAt: now,
      };
      newRecords.push(medRec);
    }

    if (selectVaccine) {
      const vacRec: VaccineRecord = {
        id: `rec-vac-${now + 1}`,
        type: 'vacina',
        date: selectedDate,
        hasSpecificTime: true,
        time: vaccineTime || getCurrentTimeString(),
        name: vaccineName.trim(),
        notes: vaccineNotes.trim() || undefined,
        createdAt: now + 1,
      };
      newRecords.push(vacRec);
    }

    if (newRecords.length > 0) {
      const label =
        newRecords.length === 2
          ? 'Remédio e vacina registrados'
          : newRecords[0].type === 'remedio'
          ? 'Remédio/vitamina registrado'
          : 'Vacina registrada';
      addRecordsBatch(newRecords, label);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSave} className="space-y-3.5">
      <p className="text-xs text-stone-400">
        Você pode marcar uma ou mais opções para este dia (ex.: remédio de manhã e alerta ou vacina à tarde):
      </p>

      {/* Option 1 & 2: Alert Colors (Vermelho / Amarelo) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={selectRed}
          onClick={toggleRed}
          className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-left transition-all min-h-[68px] active:scale-98 cursor-pointer ${
            selectRed
              ? 'bg-rose-950/55 border-rose-500 text-rose-100 shadow-xs'
              : 'bg-stone-50 dark:bg-[#15152b] border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <span
            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
              selectRed
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'border-rose-500/50 bg-transparent'
            }`}
          >
            {selectRed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Vermelho</span>
            </div>
            <span className="block text-[11px] text-stone-400 mt-0.5 leading-tight">
              Dia perigoso / alerta
            </span>
          </div>
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={selectYellow}
          onClick={toggleYellow}
          className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-left transition-all min-h-[68px] active:scale-98 cursor-pointer ${
            selectYellow
              ? 'bg-amber-950/55 border-amber-400 text-amber-100 shadow-xs'
              : 'bg-stone-50 dark:bg-[#15152b] border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <span
            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
              selectYellow
                ? 'bg-amber-400 border-amber-400 text-slate-950'
                : 'border-amber-400/50 bg-transparent'
            }`}
          >
            {selectYellow && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Amarelo</span>
            </div>
            <span className="block text-[11px] text-stone-400 mt-0.5 leading-tight">
              Dia de atenção
            </span>
          </div>
        </button>
      </div>

      {/* Clear current alert helper if one is already set */}
      {currentAlert && (selectRed || selectYellow) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSelectRed(false);
              setSelectYellow(false);
            }}
            className="text-[11px] font-medium text-stone-400 hover:text-rose-300 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remover sinalização de cor deste dia</span>
          </button>
        </div>
      )}

      {/* Option 3: Remédio / Vitamina */}
      <div
        className={`rounded-2xl border transition-all overflow-hidden ${
          selectMed
            ? 'bg-cyan-950/35 border-cyan-500/60'
            : 'bg-stone-50 dark:bg-[#15152b] border-stone-200 dark:border-slate-800'
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={selectMed}
          onClick={() => {
            setSelectMed((prev) => !prev);
            setError(null);
          }}
          className="w-full flex items-center justify-between gap-3 p-3.5 text-left min-h-[58px] cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                selectMed
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                  : 'border-cyan-500/50 bg-transparent'
              }`}
            >
              {selectMed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>

            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                Remédio ou Vitamina
              </span>
              <span className="block text-[11px] text-stone-400">
                {existingMedsCount > 0
                  ? `${existingMedsCount} já marcado(s) neste dia · adicione outro`
                  : 'Marcar que tomou e descrever qual foi'}
              </span>
            </div>
          </div>
        </button>

        {selectMed && (
          <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-cyan-500/20">
            <div>
              <label className="block text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 mb-1">
                Qual remédio ou vitamina?
              </label>
              <input
                type="text"
                maxLength={140}
                value={medName}
                onChange={(e) => {
                  setMedName(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Vitamina D (2 gotas), Paracetamol..."
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#121224] border border-cyan-300 dark:border-cyan-500/30 text-sm text-[#4A2034] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Quick medication suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {MEDICATION_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setMedName(s);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-100/80 dark:bg-cyan-950/60 hover:bg-cyan-200/80 dark:hover:bg-cyan-900/70 border border-cyan-300 dark:border-cyan-500/30 text-[11px] font-medium text-cyan-800 dark:text-cyan-200 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#8C5A70] dark:text-stone-400 mb-1">Horário</label>
                <input
                  type="time"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#121224] border border-rose-200 dark:border-slate-700 text-xs font-semibold text-[#4A2034] dark:text-slate-100 tabular-nums min-h-[40px]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-[#8C5A70] dark:text-stone-400 mb-1">
                  Dose / detalhe (opcional)
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  placeholder="Ex: 5 gotas após mamada"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#121224] border border-rose-200 dark:border-slate-700 text-xs text-[#4A2034] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 min-h-[40px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Option 4: Vacina */}
      <div
        className={`rounded-2xl border transition-all overflow-hidden ${
          selectVaccine
            ? 'bg-fuchsia-50/80 dark:bg-violet-950/35 border-fuchsia-300 dark:border-violet-500/60'
            : 'bg-rose-50/50 dark:bg-[#15152b] border-rose-200/80 dark:border-slate-800'
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={selectVaccine}
          onClick={() => {
            setSelectVaccine((prev) => !prev);
            setError(null);
          }}
          className="w-full flex items-center justify-between gap-3 p-3.5 text-left min-h-[58px] cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                selectVaccine
                  ? 'bg-violet-500 border-violet-500 text-white'
                  : 'border-violet-500/50 bg-transparent'
              }`}
            >
              {selectVaccine && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>

            <div className="w-9 h-9 rounded-xl bg-fuchsia-100 dark:bg-violet-950/70 border border-fuchsia-300 dark:border-violet-500/30 text-fuchsia-700 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Syringe className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <span className="block text-sm font-bold text-[#4A2034] dark:text-slate-100">
                Vacina
              </span>
              <span className="block text-[11px] text-[#8C5A70] dark:text-stone-400">
                {existingVaccinesCount > 0
                  ? `${existingVaccinesCount} já marcada(s) neste dia · adicione outra`
                  : 'Registrar vacina aplicada no dia'}
              </span>
            </div>
          </div>
        </button>

        {selectVaccine && (
          <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-fuchsia-300/60 dark:border-violet-500/20">
            <div>
              <label className="block text-[11px] font-semibold text-fuchsia-700 dark:text-violet-300 mb-1">
                Qual vacina?
              </label>
              <input
                type="text"
                maxLength={140}
                value={vaccineName}
                onChange={(e) => {
                  setVaccineName(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Pentavalente (1ª dose), Rotavírus..."
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#121224] border border-fuchsia-300 dark:border-violet-500/30 text-sm text-[#4A2034] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Quick vaccine suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {VACCINE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setVaccineName(s);
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-fuchsia-100/80 dark:bg-violet-950/60 hover:bg-fuchsia-200/80 dark:hover:bg-violet-900/70 border border-fuchsia-300 dark:border-violet-500/30 text-[11px] font-medium text-fuchsia-800 dark:text-violet-200 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#8C5A70] dark:text-stone-400 mb-1">Horário</label>
                <input
                  type="time"
                  value={vaccineTime}
                  onChange={(e) => setVaccineTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#121224] border border-rose-200 dark:border-slate-700 text-xs font-semibold text-[#4A2034] dark:text-slate-100 tabular-nums min-h-[40px]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] text-[#8C5A70] dark:text-stone-400 mb-1">
                  Observação / reação (opcional)
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={vaccineNotes}
                  onChange={(e) => setVaccineNotes(e.target.value)}
                  placeholder="Ex: Coxa direita, sem febre"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-[#121224] border border-rose-200 dark:border-slate-700 text-xs text-[#4A2034] dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 min-h-[40px]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-400 px-1">{error}</p>
      )}

      {/* Save Button */}
      <div className="pt-1">
        <button
          type="submit"
          className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Salvar no dia</span>
        </button>
      </div>
    </form>
  );
}

export function CalendarDayRegisterSheet() {
  const { activeSheet, closeSheet, selectedDate, dayColors, records } = useBaby();

  if (activeSheet !== 'calendario_registrar') return null;

  const currentAlert = dayColors[selectedDate];
  const existingMedsCount = records.filter(
    (r) => r.type === 'remedio' && r.date === selectedDate
  ).length;
  const existingVaccinesCount = records.filter(
    (r) => r.type === 'vacina' && r.date === selectedDate
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-0" onClick={closeSheet} aria-hidden="true" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-register-sheet-title"
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              id="calendar-register-sheet-title"
              className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
            >
              Registrar no Calendário
            </h2>
            <p className="text-xs text-stone-400">
              {formatFriendlyDate(selectedDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={closeSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CalendarRegisterForm
          key={`${selectedDate}-${currentAlert || 'none'}-${existingMedsCount}-${existingVaccinesCount}`}
          selectedDate={selectedDate}
          currentAlert={currentAlert}
          existingMedsCount={existingMedsCount}
          existingVaccinesCount={existingVaccinesCount}
          onClose={closeSheet}
        />
      </div>
    </div>
  );
}
