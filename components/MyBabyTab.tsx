'use client';

import React, { useMemo, useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { GrowthRecord } from '@/lib/types';
import { formatShortDate, getTodayDateString } from '@/lib/date-utils';
import { InteractiveDatePicker } from './InteractiveDatePicker';
import {
  parseCalendarDateMs,
  sortGrowthRecordsAsc,
  formatWeightKg,
  formatHeightCm,
} from '@/lib/growth-utils';
import {
  Baby,
  Scale,
  Ruler,
  Plus,
  Minus,
  ArrowLeftRight,
  BarChart3,
  Trash2,
  Edit2,
  Save,
  X,
  TrendingUp,
  Calendar,
} from 'lucide-react';

const SHORT_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const FULL_MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatKg(val: number): string {
  return formatWeightKg(val);
}

function formatCm(val: number): string {
  return formatHeightCm(val);
}

function formatMonthLabel(dateStr: string, includeYear = false): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, mStr, d] = parts;
  const m = Number(mStr);
  const base = `${d} ${SHORT_MONTHS[m - 1] || mStr}`;
  return includeYear ? `${base}/${y.slice(-2)}` : base;
}

function formatReadablePortugueseDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const [y, mStr, dStr] = parts;
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || Number.isNaN(m) || Number.isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    return '';
  }
  return `${d} de ${FULL_MONTHS[m - 1]} de ${y}`;
}

function formatMonthYearOption(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y} (${SHORT_MONTHS[Number(m) - 1] || m})`;
}

function daysBetween(dateA: string, dateB: string): number {
  const msA = parseCalendarDateMs(dateA);
  const msB = parseCalendarDateMs(dateB);
  return Math.abs(Math.round((msB - msA) / (1000 * 60 * 60 * 24)));
}

function parseLocaleNumber(raw: string): number | null {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function MyBabyTab() {
  const {
    profile,
    growthRecords,
    addGrowthRecord,
    updateGrowthRecord,
    deleteGrowthRecord,
  } = useBaby();

  const today = getTodayDateString();

  // Chronological ascending list strictly by calendar date (Jan -> Feb -> ... -> Nov)
  const sortedAsc = useMemo(() => sortGrowthRecordsAsc(growthRecords), [growthRecords]);

  // Descending list for history (most recent calendar date first)
  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);

  const latestRecord = sortedAsc.length > 0 ? sortedAsc[sortedAsc.length - 1] : null;
  const prevRecord = sortedAsc.length > 1 ? sortedAsc[sortedAsc.length - 2] : null;

  // Form state
  const [showForm, setShowForm] = useState<boolean>(() => growthRecords.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(today);
  const [weightKg, setWeightKg] = useState<number>(() => latestRecord?.weightKg ?? 5.0);
  const [weightText, setWeightText] = useState<string>(() =>
    formatKg(latestRecord?.weightKg ?? 5.0)
  );
  const [heightCm, setHeightCm] = useState<number>(() => latestRecord?.heightCm ?? 58.0);
  const [heightText, setHeightText] = useState<string>(() =>
    formatCm(latestRecord?.heightCm ?? 58.0)
  );
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Compare mode state
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareIdA, setCompareIdA] = useState<string>('');
  const [compareIdB, setCompareIdB] = useState<string>('');

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Resolve effective comparison pair (defaults to previous vs latest)
  const resolvedCompareA = useMemo(() => {
    if (sortedAsc.length < 2) return null;
    const found = sortedAsc.find((r) => r.id === compareIdA);
    return found || sortedAsc[sortedAsc.length - 2];
  }, [sortedAsc, compareIdA]);

  const resolvedCompareB = useMemo(() => {
    if (sortedAsc.length < 2) return null;
    const found = sortedAsc.find((r) => r.id === compareIdB);
    return found || sortedAsc[sortedAsc.length - 1];
  }, [sortedAsc, compareIdB]);

  const openNewMeasurementForm = () => {
    const baseWeight = latestRecord ? latestRecord.weightKg : 5.0;
    const baseHeight = latestRecord ? latestRecord.heightCm : 58.0;
    setEditingId(null);
    setDate(today);
    setWeightKg(baseWeight);
    setWeightText(formatKg(baseWeight));
    setHeightCm(baseHeight);
    setHeightText(formatCm(baseHeight));
    setNotes('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditMeasurementForm = (rec: GrowthRecord) => {
    setConfirmDeleteId(null);
    setEditingId(rec.id);
    setDate(rec.date);
    setWeightKg(rec.weightKg);
    setWeightText(formatKg(rec.weightKg));
    setHeightCm(rec.heightCm);
    setHeightText(formatCm(rec.heightCm));
    setNotes(rec.notes || '');
    setFormError(null);
    setShowForm(true);
  };

  const closeMeasurementForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleWeightSliderChange = (val: number) => {
    const clamped = Math.min(25, Math.max(1, Number(val.toFixed(2))));
    setWeightKg(clamped);
    setWeightText(formatKg(clamped));
    setFormError(null);
  };

  const handleWeightTextChange = (raw: string) => {
    setWeightText(raw);
    const parsed = parseLocaleNumber(raw);
    if (parsed !== null && parsed >= 0.5 && parsed <= 30) {
      setWeightKg(Number(parsed.toFixed(2)));
      setFormError(null);
    }
  };

  const handleHeightSliderChange = (val: number) => {
    const clamped = Math.min(130, Math.max(30, Number(val.toFixed(1))));
    setHeightCm(clamped);
    setHeightText(formatCm(clamped));
    setFormError(null);
  };

  const handleHeightTextChange = (raw: string) => {
    setHeightText(raw);
    const parsed = parseLocaleNumber(raw);
    if (parsed !== null && parsed >= 25 && parsed <= 140) {
      setHeightCm(Number(parsed.toFixed(1)));
      setFormError(null);
    }
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedW = parseLocaleNumber(weightText);
    const parsedH = parseLocaleNumber(heightText);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || parseCalendarDateMs(date) === 0) {
      setFormError('Selecione uma data válida para a medição.');
      return;
    }
    if (parsedW === null || parsedW < 0.5 || parsedW > 30) {
      setFormError('Informe um peso válido entre 0,50 kg e 30,00 kg.');
      return;
    }
    if (parsedH === null || parsedH < 25 || parsedH > 140) {
      setFormError('Informe uma altura válida entre 25,0 cm e 140,0 cm.');
      return;
    }

    const cleanWeight = Number(parsedW.toFixed(2));
    const cleanHeight = Number(parsedH.toFixed(1));

    if (editingId) {
      const existing = growthRecords.find((r) => r.id === editingId);
      updateGrowthRecord({
        id: editingId,
        date,
        weightKg: cleanWeight,
        heightCm: cleanHeight,
        notes: notes.trim() || undefined,
        createdAt: existing?.createdAt || Date.now(),
      });
    } else {
      addGrowthRecord({
        id: `growth-${Date.now()}`,
        date,
        weightKg: cleanWeight,
        heightCm: cleanHeight,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      });
    }

    setShowForm(false);
    setEditingId(null);
    setNotes('');
    setFormError(null);
  };

  const handleToggleCompare = () => {
    setIsComparing((prev) => {
      const next = !prev;
      if (next && sortedAsc.length >= 2) {
        setCompareIdA(sortedAsc[sortedAsc.length - 2].id);
        setCompareIdB(sortedAsc[sortedAsc.length - 1].id);
      }
      return next;
    });
  };

  // Chart scaling for all records (last 8 entries in strict calendar order, oldest left -> newest right)
  const chartItems = sortedAsc.slice(-8);
  const chartSpansMultipleYears = useMemo(() => {
    const years = new Set(chartItems.map((r) => r.date.slice(0, 4)));
    return years.size > 1;
  }, [chartItems]);

  const maxWeight = Math.max(...chartItems.map((r) => r.weightKg), 1);
  const minWeight = Math.min(...chartItems.map((r) => r.weightKg), 0);
  const weightFloor = Math.max(0, minWeight - Math.max(0.8, (maxWeight - minWeight) * 0.4));
  const weightRange = Math.max(maxWeight - weightFloor, 0.5);

  const maxHeight = Math.max(...chartItems.map((r) => r.heightCm), 1);
  const minHeight = Math.min(...chartItems.map((r) => r.heightCm), 0);
  const heightFloor = Math.max(0, minHeight - Math.max(4, (maxHeight - minHeight) * 0.4));
  const heightRange = Math.max(maxHeight - heightFloor, 2);

  // Delta vs previous calendar measurement
  const latestWeightDiff =
    latestRecord && prevRecord ? latestRecord.weightKg - prevRecord.weightKg : null;
  const latestHeightDiff =
    latestRecord && prevRecord ? latestRecord.heightCm - prevRecord.heightCm : null;

  return (
    <div className="w-full max-w-xl mx-auto pt-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Baby className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>Meu bebê</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {profile.name || 'Bebê'} · Acompanhamento de crescimento
          </p>
        </div>
      </div>

      {/* Category Pill Header (Peso e Altura) */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#1a1a33] rounded-2xl p-2 border border-stone-200/70 dark:border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#24473D] text-white text-xs font-bold">
          <Scale className="w-4 h-4" />
          <span>Peso e Altura</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleCompare}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] active:scale-95 cursor-pointer ${
              isComparing
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-700'
            }`}
            aria-pressed={isComparing}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Comparar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                openNewMeasurementForm();
              }
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#24473D] dark:bg-emerald-600 text-white text-xs font-bold transition-all min-h-[40px] active:scale-95 cursor-pointer"
          >
            {showForm && !editingId ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Fechar</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Current Baby Weight & Height Highlight Card (Latest Calendar Date) */}
      {latestRecord && (
        <section className="rounded-3xl bg-gradient-to-br from-[#1d1d38] via-[#1a1a33] to-[#15152b] p-4 sm:p-5 border border-emerald-500/25 shadow-[0_6px_24px_rgba(0,0,0,0.22)] space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Medidas atuais do bebê
              </span>
              <p className="text-xs text-stone-300 mt-0.5 tabular-nums">
                Última data registrada:{' '}
                <strong className="text-slate-100">
                  {formatReadablePortugueseDate(latestRecord.date) || formatShortDate(latestRecord.date, true)}
                </strong>
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl tabular-nums shrink-0">
              {formatShortDate(latestRecord.date)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weight with Prominent Scale (Balança) Icon */}
            <div className="p-3.5 rounded-2xl bg-[#131326]/90 border border-emerald-500/25 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/90 block">
                    Peso
                  </span>
                  <div className="font-serif font-bold text-2xl sm:text-[26px] text-slate-50 tabular-nums leading-tight">
                    {formatKg(latestRecord.weightKg)}
                    <span className="text-xs font-sans font-semibold text-stone-400 ml-1">kg</span>
                  </div>
                </div>
              </div>
              {latestWeightDiff !== null && (
                <div
                  className={`text-[11px] font-semibold tabular-nums pt-1 border-t border-slate-800/80 ${
                    latestWeightDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {latestWeightDiff >= 0 ? '+' : ''}
                  {formatKg(latestWeightDiff)} kg desde {formatShortDate(prevRecord!.date)}
                </div>
              )}
            </div>

            {/* Height with Prominent Ruler (Tamanho) Icon */}
            <div className="p-3.5 rounded-2xl bg-[#131326]/90 border border-sky-500/25 flex flex-col justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Ruler className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/90 block">
                    Altura
                  </span>
                  <div className="font-serif font-bold text-2xl sm:text-[26px] text-slate-50 tabular-nums leading-tight">
                    {formatCm(latestRecord.heightCm)}
                    <span className="text-xs font-sans font-semibold text-stone-400 ml-1">cm</span>
                  </div>
                </div>
              </div>
              {latestHeightDiff !== null && (
                <div
                  className={`text-[11px] font-semibold tabular-nums pt-1 border-t border-slate-800/80 ${
                    latestHeightDiff >= 0 ? 'text-sky-300' : 'text-rose-300'
                  }`}
                >
                  {latestHeightDiff >= 0 ? '+' : ''}
                  {formatCm(latestHeightDiff)} cm desde {formatShortDate(prevRecord!.date)}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Register (inline) OR Edit (instant modal/bottom-sheet overlay) Measurement Form */}
      {showForm && (() => {
        const isEditingModal = editingId !== null;
        const formCard = (
          <form
            onSubmit={handleSaveMeasurement}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-[#1a1a33] p-4 sm:p-5 border border-stone-200/70 dark:border-slate-700/80 space-y-4 ${
              isEditingModal
                ? 'w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.65)] pb-8 sm:pb-5'
                : 'rounded-3xl shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {isEditingModal && <Edit2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  <span>{isEditingModal ? 'Editar medição' : 'Nova medição de Peso e Altura'}</span>
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Ajuste com o controle deslizante ou digite o valor exato
                </p>
              </div>
              {(growthRecords.length > 0 || isEditingModal) && (
                <button
                  type="button"
                  onClick={closeMeasurementForm}
                  className="p-2 rounded-full text-stone-400 hover:text-slate-200 hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  aria-label="Fechar formulário"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

          {/* Date Input */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="growth-date-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Data da medição
              </label>
              {formatReadablePortugueseDate(date) && (
                <span className="text-[11px] font-semibold text-emerald-400 tabular-nums">
                  {formatReadablePortugueseDate(date)}
                </span>
              )}
            </div>
            <InteractiveDatePicker
              id="growth-date-input"
              value={date}
              onChange={(nextDate) => {
                setDate(nextDate);
                setFormError(null);
              }}
            />
          </div>

          {/* Weight (kg) Input + Slider */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="growth-weight-input"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4" />
                <span>Peso (kg)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  id="growth-weight-input"
                  type="text"
                  inputMode="decimal"
                  value={weightText}
                  onChange={(e) => handleWeightTextChange(e.target.value)}
                  onBlur={() => setWeightText(formatKg(weightKg))}
                  className="w-24 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-300 dark:border-slate-700 text-right font-serif font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
                  aria-label="Digitar peso em quilogramas"
                />
                <span className="text-xs font-semibold text-stone-400">kg</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleWeightSliderChange(weightKg - 0.05)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Diminuir peso em 50 gramas"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="2"
                max="20"
                step="0.05"
                value={Math.min(20, Math.max(2, weightKg))}
                onChange={(e) => handleWeightSliderChange(Number(e.target.value))}
                className="flex-1 h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                aria-label="Controle deslizante de peso"
              />

              <button
                type="button"
                onClick={() => handleWeightSliderChange(weightKg + 0.05)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Aumentar peso em 50 gramas"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-400 tabular-nums px-1">
              <span>2,0 kg</span>
              <span>11,0 kg</span>
              <span>20,0 kg</span>
            </div>
          </div>

          {/* Height (cm) Input + Slider */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="growth-height-input"
                className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5"
              >
                <Ruler className="w-4 h-4" />
                <span>Altura (cm)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  id="growth-height-input"
                  type="text"
                  inputMode="decimal"
                  value={heightText}
                  onChange={(e) => handleHeightTextChange(e.target.value)}
                  onBlur={() => setHeightText(formatCm(heightCm))}
                  className="w-24 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1a1a33] border border-stone-300 dark:border-slate-700 text-right font-serif font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
                  aria-label="Digitar altura em centímetros"
                />
                <span className="text-xs font-semibold text-stone-400">cm</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleHeightSliderChange(heightCm - 0.5)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Diminuir altura em 0,5 cm"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="40"
                max="120"
                step="0.5"
                value={Math.min(120, Math.max(40, heightCm))}
                onChange={(e) => handleHeightSliderChange(Number(e.target.value))}
                className="flex-1 h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none accent-sky-500 cursor-pointer"
                aria-label="Controle deslizante de altura"
              />

              <button
                type="button"
                onClick={() => handleHeightSliderChange(heightCm + 0.5)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Aumentar altura em 0,5 cm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-400 tabular-nums px-1">
              <span>40 cm</span>
              <span>80 cm</span>
              <span>120 cm</span>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observação (opcional)
            </label>
            <input
              type="text"
              maxLength={120}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Consulta de 4 meses, balança do pediatra..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder:text-stone-400 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#24473D]"
            />
          </div>

          {formError && (
            <p className="text-xs font-medium text-rose-500 dark:text-rose-400">{formError}</p>
          )}

            <div className={isEditingModal ? 'grid grid-cols-2 gap-2.5 pt-1' : ''}>
              {isEditingModal && (
                <button
                  type="button"
                  onClick={closeMeasurementForm}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center transition-all active:scale-98 min-h-[48px] cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isEditingModal ? 'Salvar alterações' : 'Salvar medição'}</span>
              </button>
            </div>
          </form>
        );

        if (isEditingModal) {
          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Editar medição"
              onClick={closeMeasurementForm}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            >
              {formCard}
            </div>
          );
        }

        return formCard;
      })()}

      {/* COMPARE PANEL (toggled by "Comparar" button inside Peso e Altura) */}
      {isComparing && (
        <section className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-indigo-300/60 dark:border-indigo-700/60 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                <span>Comparar Medições</span>
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Compare dois meses ou consultas lado a lado
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsComparing(false)}
              className="p-2 rounded-full text-stone-400 hover:text-slate-200 hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Fechar comparação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sortedAsc.length < 2 || !resolvedCompareA || !resolvedCompareB ? (
            <div className="py-6 px-4 text-center rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-dashed border-stone-300 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Registre pelo menos 2 medições para comparar
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Quando você adicionar o próximo mês, os gráficos comparativos aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            (() => {
              // Always display earlier calendar date on the left and later calendar date on the right
              const isReversed =
                parseCalendarDateMs(resolvedCompareA.date) >
                parseCalendarDateMs(resolvedCompareB.date);
              const earlierRec = isReversed ? resolvedCompareB : resolvedCompareA;
              const laterRec = isReversed ? resolvedCompareA : resolvedCompareB;

              const weightDelta = laterRec.weightKg - earlierRec.weightKg;
              const heightDelta = laterRec.heightCm - earlierRec.heightCm;
              const gapDays = daysBetween(earlierRec.date, laterRec.date);
              const pairSpansYears = earlierRec.date.slice(0, 4) !== laterRec.date.slice(0, 4);

              const pairMaxWeight = Math.max(
                earlierRec.weightKg,
                laterRec.weightKg,
                0.1
              );
              const pairMaxHeight = Math.max(
                earlierRec.heightCm,
                laterRec.heightCm,
                1
              );

              const wPctA = Math.max(24, Math.round((earlierRec.weightKg / pairMaxWeight) * 100));
              const wPctB = Math.max(24, Math.round((laterRec.weightKg / pairMaxWeight) * 100));
              const hPctA = Math.max(24, Math.round((earlierRec.heightCm / pairMaxHeight) * 100));
              const hPctB = Math.max(24, Math.round((laterRec.heightCm / pairMaxHeight) * 100));

              return (
                <div className="space-y-4">
                  {/* Selectors for Month A vs Month B */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Medição 1 (Mais antiga)
                      </label>
                      <select
                        value={resolvedCompareA.id}
                        onChange={(e) => setCompareIdA(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 min-h-[44px]"
                      >
                        {sortedAsc.map((r) => (
                          <option key={r.id} value={r.id}>
                            {formatMonthYearOption(r.date)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                        Medição 2 (Mais recente)
                      </label>
                      <select
                        value={resolvedCompareB.id}
                        onChange={(e) => setCompareIdB(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 min-h-[44px]"
                      >
                        {sortedAsc.map((r) => (
                          <option key={r.id} value={r.id}>
                            {formatMonthYearOption(r.date)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interval caption */}
                  <div className="text-[11px] text-center text-stone-400 tabular-nums">
                    Evolução de <strong className="text-slate-200">{formatMonthLabel(earlierRec.date, pairSpansYears)}</strong> para{' '}
                    <strong className="text-slate-200">{formatMonthLabel(laterRec.date, pairSpansYears)}</strong> ·{' '}
                    {gapDays} {gapDays === 1 ? 'dia' : 'dias'}
                  </div>

                  {/* Side-by-side Column Charts (Weight & Height) */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Weight Comparison Column Card */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Peso (kg)</span>
                        <span
                          className={`text-[11px] font-bold tabular-nums ${
                            weightDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {weightDelta >= 0 ? '+' : ''}
                          {formatKg(weightDelta)} kg
                        </span>
                      </div>

                      <div className="h-32 flex items-end justify-around gap-3 pt-4 px-1">
                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <span className="text-[11px] font-bold text-slate-300 tabular-nums mb-1">
                            {formatKg(earlierRec.weightKg)}
                          </span>
                          <div
                            className="w-full max-w-[42px] rounded-t-xl bg-emerald-900/70 border border-emerald-700/60 transition-all duration-300"
                            style={{ height: `${wPctA}%` }}
                          />
                          <span className="text-[10px] text-stone-400 mt-1.5 tabular-nums truncate">
                            {formatMonthLabel(earlierRec.date, pairSpansYears)}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <span className="text-[11px] font-bold text-emerald-300 tabular-nums mb-1">
                            {formatKg(laterRec.weightKg)}
                          </span>
                          <div
                            className="w-full max-w-[42px] rounded-t-xl bg-emerald-500 transition-all duration-300"
                            style={{ height: `${wPctB}%` }}
                          />
                          <span className="text-[10px] text-emerald-300 font-semibold mt-1.5 tabular-nums truncate">
                            {formatMonthLabel(laterRec.date, pairSpansYears)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Height Comparison Column Card */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/70 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">Altura (cm)</span>
                        <span
                          className={`text-[11px] font-bold tabular-nums ${
                            heightDelta >= 0 ? 'text-sky-400' : 'text-rose-400'
                          }`}
                        >
                          {heightDelta >= 0 ? '+' : ''}
                          {formatCm(heightDelta)} cm
                        </span>
                      </div>

                      <div className="h-32 flex items-end justify-around gap-3 pt-4 px-1">
                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <span className="text-[11px] font-bold text-slate-300 tabular-nums mb-1">
                            {formatCm(earlierRec.heightCm)}
                          </span>
                          <div
                            className="w-full max-w-[42px] rounded-t-xl bg-sky-900/70 border border-sky-700/60 transition-all duration-300"
                            style={{ height: `${hPctA}%` }}
                          />
                          <span className="text-[10px] text-stone-400 mt-1.5 tabular-nums truncate">
                            {formatMonthLabel(earlierRec.date, pairSpansYears)}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col items-center h-full justify-end">
                          <span className="text-[11px] font-bold text-sky-300 tabular-nums mb-1">
                            {formatCm(laterRec.heightCm)}
                          </span>
                          <div
                            className="w-full max-w-[42px] rounded-t-xl bg-sky-500 transition-all duration-300"
                            style={{ height: `${hPctB}%` }}
                          />
                          <span className="text-[10px] text-sky-300 font-semibold mt-1.5 tabular-nums truncate">
                            {formatMonthLabel(laterRec.date, pairSpansYears)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </section>
      )}

      {/* COLUMN CHARTS: Weight & Height Evolution */}
      {chartItems.length > 0 ? (
        <section className="space-y-3">
          {/* Weight Column Chart */}
          <div className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                  Gráfico de Peso (kg)
                </h2>
              </div>
              {chartItems.length >= 2 && (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 tabular-nums">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {chartItems[chartItems.length - 1].weightKg - chartItems[0].weightKg >= 0 ? '+' : ''}
                  {formatKg(chartItems[chartItems.length - 1].weightKg - chartItems[0].weightKg)} kg no total
                </span>
              )}
            </div>

            <div className="h-44 flex items-end gap-2 pt-5 pb-1 px-1 border-b border-stone-200/60 dark:border-slate-800">
              {chartItems.map((item, idx) => {
                const isLast = idx === chartItems.length - 1;
                const normalized = (item.weightKg - weightFloor) / weightRange;
                const heightPct =
                  chartItems.length === 1
                    ? 68
                    : Math.max(20, Math.min(100, Math.round(normalized * 80 + 20)));

                return (
                  <div
                    key={item.id}
                    className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold tabular-nums mb-1 truncate ${
                        isLast ? 'text-emerald-300' : 'text-stone-400'
                      }`}
                    >
                      {formatKg(item.weightKg)}
                    </span>
                    <div
                      className={`w-full max-w-[38px] rounded-t-xl transition-all duration-300 ${
                        isLast
                          ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.28)]'
                          : 'bg-[#24473D] dark:bg-emerald-900/70 border border-emerald-700/40'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 px-1">
              {chartItems.map((item, idx) => {
                const isLast = idx === chartItems.length - 1;
                return (
                  <div
                    key={`w-lbl-${item.id}`}
                    className={`flex-1 text-center text-[10px] tabular-nums truncate ${
                      isLast ? 'text-emerald-300 font-bold' : 'text-stone-400'
                    }`}
                  >
                    {formatMonthLabel(item.date, chartSpansMultipleYears)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Height Column Chart */}
          <div className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                  Gráfico de Altura (cm)
                </h2>
              </div>
              {chartItems.length >= 2 && (
                <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1 tabular-nums">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {chartItems[chartItems.length - 1].heightCm - chartItems[0].heightCm >= 0 ? '+' : ''}
                  {formatCm(chartItems[chartItems.length - 1].heightCm - chartItems[0].heightCm)} cm no total
                </span>
              )}
            </div>

            <div className="h-44 flex items-end gap-2 pt-5 pb-1 px-1 border-b border-stone-200/60 dark:border-slate-800">
              {chartItems.map((item, idx) => {
                const isLast = idx === chartItems.length - 1;
                const normalized = (item.heightCm - heightFloor) / heightRange;
                const heightPct =
                  chartItems.length === 1
                    ? 68
                    : Math.max(20, Math.min(100, Math.round(normalized * 80 + 20)));

                return (
                  <div
                    key={item.id}
                    className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold tabular-nums mb-1 truncate ${
                        isLast ? 'text-sky-300' : 'text-stone-400'
                      }`}
                    >
                      {formatCm(item.heightCm)}
                    </span>
                    <div
                      className={`w-full max-w-[38px] rounded-t-xl transition-all duration-300 ${
                        isLast
                          ? 'bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.28)]'
                          : 'bg-sky-900/70 border border-sky-700/40'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 px-1">
              {chartItems.map((item, idx) => {
                const isLast = idx === chartItems.length - 1;
                return (
                  <div
                    key={`h-lbl-${item.id}`}
                    className={`flex-1 text-center text-[10px] tabular-nums truncate ${
                      isLast ? 'text-sky-300 font-bold' : 'text-stone-400'
                    }`}
                  >
                    {formatMonthLabel(item.date, chartSpansMultipleYears)}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        !showForm && (
          <div className="py-10 px-4 text-center bg-white/60 dark:bg-[#1a1a33]/60 rounded-3xl border border-dashed border-stone-300 dark:border-slate-800 space-y-2">
            <Scale className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              Nenhuma medição de peso e altura ainda
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              Registre a primeira medição para acompanhar a evolução em gráficos de colunas mês a mês.
            </p>
            <button
              type="button"
              onClick={openNewMeasurementForm}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#24473D] dark:bg-emerald-600 text-white text-xs font-bold min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar primeira medição</span>
            </button>
          </div>
        )
      )}

      {/* Measurements History List */}
      {sortedDesc.length > 0 && (
        <section className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              Histórico de Medições
            </h2>
            <span className="text-xs text-stone-400 tabular-nums">
              {sortedDesc.length} {sortedDesc.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="space-y-2">
            {sortedDesc.map((rec, idx) => {
              const previous = sortedDesc[idx + 1];
              const diffW = previous ? rec.weightKg - previous.weightKg : null;
              const diffH = previous ? rec.heightCm - previous.heightCm : null;

              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{formatShortDate(rec.date, true)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditMeasurementForm(rec)}
                        className="p-2 rounded-xl text-stone-300 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        aria-label="Editar medição"
                        title="Editar medição"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {confirmDeleteId === rec.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteGrowthRecord(rec.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold min-h-[36px]"
                          >
                            Remover
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 text-stone-300 text-[11px] font-medium min-h-[36px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rec.id)}
                          className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 min-h-[38px] min-w-[38px] flex items-center justify-center"
                          aria-label="Remover medição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] flex items-baseline justify-between">
                      <span className="text-xs text-stone-400">Peso</span>
                      <div className="text-right tabular-nums">
                        <span className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                          {formatKg(rec.weightKg)} kg
                        </span>
                        {diffW !== null && (
                          <span className="block text-[10px] font-semibold text-emerald-400">
                            {diffW >= 0 ? '+' : ''}
                            {formatKg(diffW)} kg
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] flex items-baseline justify-between">
                      <span className="text-xs text-stone-400">Altura</span>
                      <div className="text-right tabular-nums">
                        <span className="font-serif font-bold text-base text-slate-900 dark:text-slate-100">
                          {formatCm(rec.heightCm)} cm
                        </span>
                        {diffH !== null && (
                          <span className="block text-[10px] font-semibold text-sky-400">
                            {diffH >= 0 ? '+' : ''}
                            {formatCm(diffH)} cm
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-xs text-stone-400 pt-0.5">{rec.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
