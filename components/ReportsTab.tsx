'use client';

import React, { useMemo, useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  ALL_SECTIONS_SELECTED,
  ReportPeriodPreset,
  ReportSectionsSelection,
  buildReportSummary,
  createReportPdfDocument,
  resolvePeriodRange,
} from '@/lib/report-pdf';
import { formatDuration, formatShortDate, getTodayDateString } from '@/lib/date-utils';
import {
  Check,
  CheckSquare,
  Download,
  FileText,
  Share2,
  ShieldAlert,
  Square,
  Calendar,
  BookOpen,
  Pill,
  Syringe,
} from 'lucide-react';

type SectionKey = keyof ReportSectionsSelection;

const SECTION_ITEMS: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: 'peito', label: 'Peito', description: 'Esquerdo, direito e ambos' },
  { key: 'mamadeira', label: 'Mamadeira', description: 'Quantidade e total em ml' },
  { key: 'sono', label: 'Sono', description: 'Total de horas e sonecas' },
  { key: 'fralda', label: 'Fraldas', description: 'Xixi, cocô e ambos' },
  { key: 'nota', label: 'Anotações', description: 'Observações e favoritas' },
  { key: 'alertas', label: 'Dias de alerta', description: 'Marcações amarelas e vermelhas' },
  { key: 'remedio', label: 'Remédios', description: 'Remédios e vitaminas' },
  { key: 'vacina', label: 'Vacinas', description: 'Vacinas aplicadas' },
];

export function ReportsTab() {
  const { records, profile, dayColors, selectedDate } = useBaby();
  const today = getTodayDateString();

  const [preset, setPreset] = useState<ReportPeriodPreset>('7dias');
  const [singleDate, setSingleDate] = useState<string>(selectedDate || today);
  const [customStart, setCustomStart] = useState<string>(() => {
    const [y, m, d] = today.split('-').map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 6);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
  });
  const [customEnd, setCustomEnd] = useState<string>(today);

  const [selectedSections, setSelectedSections] =
    useState<ReportSectionsSelection>(ALL_SECTIONS_SELECTED);
  const [includeTimeline, setIncludeTimeline] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(
    () => resolvePeriodRange(preset, singleDate, customStart, customEnd),
    [preset, singleDate, customStart, customEnd]
  );

  const summary = useMemo(
    () => buildReportSummary(records, dayColors, startDate, endDate, selectedSections),
    [records, dayColors, startDate, endDate, selectedSections]
  );

  const allKeys = SECTION_ITEMS.map((i) => i.key);
  const selectedCount = allKeys.filter((k) => selectedSections[k]).length;
  const isAllSelected = selectedCount === allKeys.length;
  const hasAnySelected = selectedCount > 0;

  const toggleSection = (key: SectionKey) => {
    setSelectedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedSections({
        peito: false,
        mamadeira: false,
        sono: false,
        fralda: false,
        nota: false,
        alertas: false,
        remedio: false,
        vacina: false,
      });
    } else {
      setSelectedSections({ ...ALL_SECTIONS_SELECTED });
    }
  };

  const getSectionCount = (key: SectionKey): number => {
    switch (key) {
      case 'peito':
        return summary.peito.total;
      case 'mamadeira':
        return summary.mamadeira.total;
      case 'sono':
        return summary.sono.totalSessions;
      case 'fralda':
        return summary.fralda.total;
      case 'nota':
        return summary.nota.total;
      case 'alertas':
        return summary.alertas.total;
      case 'remedio':
        return summary.remedio.total;
      case 'vacina':
        return summary.vacina.total;
    }
  };

  const handleDownloadPdf = () => {
    if (!hasAnySelected) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const { doc, filename } = createReportPdfDocument({
        profile,
        summary,
        selectedSections,
        includeTimeline,
      });
      doc.save(filename);
      setFeedback('PDF gerado com sucesso.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setFeedback('Não foi possível gerar o PDF agora. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePdf = async () => {
    if (!hasAnySelected) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const { doc, filename } = createReportPdfDocument({
        profile,
        summary,
        selectedSections,
        includeTimeline,
      });
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Relatório - ${profile.name || 'Bebê'}`,
          text: `Relatório do diário de ${profile.name || 'Bebê'} (${formatShortDate(startDate, true)} a ${formatShortDate(endDate, true)}).`,
          files: [file],
        });
        setFeedback('Relatório compartilhado.');
      } else {
        doc.save(filename);
        setFeedback('PDF baixado no aparelho.');
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      // User canceling native share sheet is expected behavior
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('Erro ao compartilhar PDF:', err);
        setFeedback('Não foi possível compartilhar. Tente baixar o PDF.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const periodText =
    startDate === endDate
      ? formatShortDate(startDate, true)
      : `${formatShortDate(startDate, true)} a ${formatShortDate(endDate, true)} · ${summary.daysCount} ${summary.daysCount === 1 ? 'dia' : 'dias'}`;

  return (
    <div className="w-full max-w-xl mx-auto pt-4 pb-28 space-y-5">
      {/* Page Title */}
      <div className="px-0.5">
        <h1 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100">
          Relatórios
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Resumo organizado da rotina e exportação em PDF
        </p>
      </div>

      {/* 1. Period Selection Card */}
      <section className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
            Período
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            {periodText}
          </span>
        </div>

        {/* Period Segmented Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {(
            [
              { id: 'dia', label: 'Um dia' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'mes', label: 'Este mês' },
              { id: 'personalizado', label: 'Período' },
            ] as Array<{ id: ReportPeriodPreset; label: string }>
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreset(opt.id)}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] whitespace-nowrap cursor-pointer active:scale-97 ${
                preset === opt.id
                  ? 'bg-[#24473D] text-white'
                  : 'bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-slate-800'
              }`}
              aria-pressed={preset === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Single Day Picker */}
        {preset === 'dia' && (
          <div className="pt-1">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Escolha a data
            </label>
            <div className="relative">
              <input
                type="date"
                value={singleDate}
                max={today}
                onChange={(e) => setSingleDate(e.target.value || today)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#24473D]"
              />
            </div>
          </div>
        )}

        {/* Custom Date Range Pickers */}
        {preset === 'personalizado' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
                Data inicial
              </label>
              <input
                type="date"
                value={customStart}
                max={today}
                onChange={(e) => setCustomStart(e.target.value || today)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#24473D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
                Data final
              </label>
              <input
                type="date"
                value={customEnd}
                max={today}
                onChange={(e) => setCustomEnd(e.target.value || today)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#24473D]"
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. What to Export (Checkboxes + Select All) */}
      <section className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              O que exportar
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {selectedCount} de {allKeys.length} selecionados
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-xs font-semibold text-[#24473D] dark:text-emerald-300 transition-colors min-h-[40px] whitespace-nowrap cursor-pointer active:scale-97"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Desmarcar tudo</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Selecionar tudo</span>
              </>
            )}
          </button>
        </div>

        {/* Category Checkbox Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {SECTION_ITEMS.map((item) => {
            const checked = selectedSections[item.key];
            const count = getSectionCount(item.key);

            return (
              <button
                key={item.key}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggleSection(item.key)}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all min-h-[60px] cursor-pointer active:scale-98 ${
                  checked
                    ? 'bg-[#DCE9DF]/45 dark:bg-[#203427]/70 border-[#24473D]/40 dark:border-emerald-500/40 text-slate-900 dark:text-slate-100'
                    : 'bg-stone-50/70 dark:bg-[#15152b]/70 border-stone-200/70 dark:border-slate-800 text-stone-500 dark:text-stone-400'
                }`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                    checked
                      ? 'bg-[#24473D] dark:bg-emerald-500 border-[#24473D] dark:border-emerald-500 text-white dark:text-slate-950'
                      : 'border-stone-300 dark:border-slate-600 bg-transparent'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{item.label}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
                      {count}
                    </span>
                  </div>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5 truncate">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Include Day-by-day Timeline Toggle */}
        <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Incluir detalhamento dia a dia no PDF
            </span>
            <span className="block text-[11px] text-stone-500 dark:text-stone-400">
              Lista todos os horários registrados em cada data
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={includeTimeline}
            onClick={() => setIncludeTimeline((prev) => !prev)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              includeTimeline ? 'bg-[#24473D] dark:bg-emerald-500' : 'bg-stone-300 dark:bg-slate-700'
            }`}
            aria-label="Incluir detalhamento dia a dia no PDF"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                includeTimeline ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. Live Summary Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
            Prévia do Resumo
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {profile.name || 'Bebê'}
          </span>
        </div>

        {!hasAnySelected ? (
          <div className="py-8 px-4 text-center bg-white/60 dark:bg-[#1a1a33]/60 rounded-3xl border border-dashed border-stone-300 dark:border-slate-800">
            <FileText className="w-8 h-8 mx-auto text-stone-400 dark:text-stone-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Selecione ao menos um item acima
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Marque as caixinhas desejadas ou toque em &ldquo;Selecionar tudo&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Numeric Metric Grid */}
            {(selectedSections.peito ||
              selectedSections.mamadeira ||
              selectedSections.sono ||
              selectedSections.fralda) && (
              <div className="grid grid-cols-2 gap-3">
                {selectedSections.peito && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#24473D] dark:text-emerald-400 block">
                      Peito
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {summary.peito.total}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 space-y-0.5 tabular-nums">
                      <div>
                        Esq {summary.peito.esquerdo} · Dir {summary.peito.direito} · Ambos{' '}
                        {summary.peito.ambos}
                      </div>
                      <div>
                        Média {summary.peito.avgPerDay.toFixed(1).replace('.', ',')} / dia
                      </div>
                    </div>
                  </div>
                )}

                {selectedSections.mamadeira && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 block">
                      Mamadeira
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {summary.mamadeira.total}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 space-y-0.5 tabular-nums">
                      <div>Total: {summary.mamadeira.totalMl} ml</div>
                      <div>
                        Média {summary.mamadeira.avgMlPerDay} ml / dia
                      </div>
                    </div>
                  </div>
                )}

                {selectedSections.sono && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 block">
                      Sono
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {formatDuration(summary.sono.totalMinutes)}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 space-y-0.5 tabular-nums">
                      <div>
                        {summary.sono.totalSessions}{' '}
                        {summary.sono.totalSessions === 1 ? 'registro' : 'registros'}
                      </div>
                      <div>Média {formatDuration(summary.sono.avgMinutesPerDay)} / dia</div>
                    </div>
                  </div>
                )}

                {selectedSections.fralda && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block">
                      Fraldas
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                      {summary.fralda.total}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 space-y-0.5 tabular-nums">
                      <div>
                        Xixi {summary.fralda.xixi} · Cocô {summary.fralda.coco} · Ambos{' '}
                        {summary.fralda.ambos}
                      </div>
                      <div>
                        Média {summary.fralda.avgPerDay.toFixed(1).replace('.', ',')} / dia
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alert Days Preview */}
            {selectedSections.alertas && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Dias sinalizados
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.alertas.vermelho} vermelho · {summary.alertas.amarelo} amarelo
                  </span>
                </div>
                {summary.alertas.items.length > 0 ? (
                  <div className="mt-2.5 space-y-1.5">
                    {summary.alertas.items.slice(0, 5).map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center justify-between text-xs py-1 border-t border-stone-100 dark:border-slate-800/80 first:border-t-0"
                      >
                        <span className="text-slate-700 dark:text-slate-300 tabular-nums flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {formatShortDate(item.date, true)}
                        </span>
                        <span
                          className={`font-semibold ${
                            item.color === 'vermelho'
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-300'
                          }`}
                        >
                          {item.color === 'vermelho' ? 'Vermelho (Alerta)' : 'Amarelo (Atenção)'}
                        </span>
                      </div>
                    ))}
                    {summary.alertas.items.length > 5 && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                        + {summary.alertas.items.length - 5} dias adicionais incluídos no PDF
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    Nenhum dia marcado com cor de alerta neste período.
                  </p>
                )}
              </div>
            )}

            {/* Medications Preview */}
            {selectedSections.remedio && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-cyan-400" />
                    Remédios e Vitaminas
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.remedio.total}{' '}
                    {summary.remedio.total === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
                {summary.remedio.records.length > 0 ? (
                  <div className="mt-2.5 space-y-1.5">
                    {summary.remedio.records.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs py-1 border-t border-stone-100 dark:border-slate-800/80 first:border-t-0"
                      >
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate pr-2">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-stone-400 tabular-nums shrink-0">
                          {formatShortDate(m.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    Nenhum remédio ou vitamina registrado neste período.
                  </p>
                )}
              </div>
            )}

            {/* Vaccines Preview */}
            {selectedSections.vacina && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Syringe className="w-4 h-4 text-violet-400" />
                    Vacinas
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.vacina.total}{' '}
                    {summary.vacina.total === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
                {summary.vacina.records.length > 0 ? (
                  <div className="mt-2.5 space-y-1.5">
                    {summary.vacina.records.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between text-xs py-1 border-t border-stone-100 dark:border-slate-800/80 first:border-t-0"
                      >
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate pr-2">
                          {v.name}
                        </span>
                        <span className="text-[11px] text-stone-400 tabular-nums shrink-0">
                          {formatShortDate(v.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    Nenhuma vacina registrada neste período.
                  </p>
                )}
              </div>
            )}

            {/* Notes Preview */}
            {selectedSections.nota && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Anotações no período
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.nota.total}{' '}
                    {summary.nota.total === 1 ? 'anotação' : 'anotações'}
                    {summary.nota.favorites > 0 ? ` · ${summary.nota.favorites} fav.` : ''}
                  </span>
                </div>
                {summary.nota.records.length > 0 ? (
                  <div className="mt-2.5 space-y-2">
                    {summary.nota.records.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="text-xs text-stone-600 dark:text-stone-300 pt-1.5 border-t border-stone-100 dark:border-slate-800/80 first:border-t-0 first:pt-0"
                      >
                        <span className="text-[11px] font-semibold text-stone-400 tabular-nums mr-2">
                          {formatShortDate(n.date)}
                        </span>
                        <span className="line-clamp-2">{n.content}</span>
                      </div>
                    ))}
                    {summary.nota.records.length > 3 && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        + {summary.nota.records.length - 3} anotações incluídas no PDF
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    Nenhuma anotação escrita neste período.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Primary Export PDF Actions */}
      <section className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={!hasAnySelected || isGenerating}
            onClick={handleDownloadPdf}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-serif font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[50px] cursor-pointer"
          >
            <Download className="w-5 h-5 shrink-0" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Exportar PDF'}</span>
          </button>

          <button
            type="button"
            disabled={!hasAnySelected || isGenerating}
            onClick={handleSharePdf}
            className="py-3.5 px-4 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 border border-stone-200 dark:border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 min-h-[50px] whitespace-nowrap cursor-pointer"
            aria-label="Compartilhar PDF"
            title="Compartilhar PDF (ex: WhatsApp)"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Enviar</span>
          </button>
        </div>

        {feedback && (
          <p className="text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {feedback}
          </p>
        )}
      </section>
    </div>
  );
}
