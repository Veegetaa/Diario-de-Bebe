'use client';

import React, { useState, useMemo } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  getTodayDateString,
  getAdjacentDateString,
  formatDuration,
  formatShortDate,
} from '@/lib/date-utils';
import {
  buildReportSummary,
  buildReportPdfDocument,
  ReportSelection,
  ReportCategoryKey,
} from '@/lib/report-pdf';
import {
  FileDown,
  Share2,
  Check,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

type PeriodPreset = 'dia' | '7dias' | '30dias' | 'mes' | 'personalizado';

const DEFAULT_SELECTION: ReportSelection = {
  peito: true,
  mamadeira: true,
  sono: true,
  fralda: true,
  nota: true,
  alertas: true,
};

const ALL_KEYS: ReportCategoryKey[] = [
  'peito',
  'mamadeira',
  'sono',
  'fralda',
  'nota',
  'alertas',
];

export function ReportsTab() {
  const { profile, records, dayColors, selectedDate } = useBaby();

  const today = getTodayDateString();
  const [preset, setPreset] = useState<PeriodPreset>('7dias');
  const [singleDate, setSingleDate] = useState<string>(selectedDate || today);
  const [customStart, setCustomStart] = useState<string>(() => getAdjacentDateString(today, -6));
  const [customEnd, setCustomEnd] = useState<string>(today);
  const [selection, setSelection] = useState<ReportSelection>(DEFAULT_SELECTION);
  const [includeTimeline, setIncludeTimeline] = useState<boolean>(true);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Derive active startDate and endDate from preset
  const { startDate, endDate } = useMemo(() => {
    if (preset === 'dia') {
      const d = singleDate || today;
      return { startDate: d, endDate: d };
    }
    if (preset === '7dias') {
      return { startDate: getAdjacentDateString(today, -6), endDate: today };
    }
    if (preset === '30dias') {
      return { startDate: getAdjacentDateString(today, -29), endDate: today };
    }
    if (preset === 'mes') {
      const [y, m] = today.split('-');
      return { startDate: `${y}-${m}-01`, endDate: today };
    }
    return {
      startDate: customStart || today,
      endDate: customEnd || today,
    };
  }, [preset, singleDate, customStart, customEnd, today]);

  // Compute summary live whenever period, records, or checkboxes change
  const summary = useMemo(
    () => buildReportSummary(records, dayColors, startDate, endDate, selection),
    [records, dayColors, startDate, endDate, selection]
  );

  const selectedCount = ALL_KEYS.filter((k) => selection[k]).length;
  const isAllSelected = selectedCount === ALL_KEYS.length;
  const hasAnySelected = selectedCount > 0;

  const toggleCategory = (key: ReportCategoryKey) => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSelectAll = () => {
    const nextValue = !isAllSelected;
    setSelection({
      peito: nextValue,
      mamadeira: nextValue,
      sono: nextValue,
      fralda: nextValue,
      nota: nextValue,
      alertas: nextValue,
    });
  };

  const showFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => {
      setExportFeedback((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleDownloadPdf = () => {
    if (!hasAnySelected || isGenerating) return;
    setIsGenerating(true);
    try {
      const { doc, filename } = buildReportPdfDocument({
        profile,
        summary,
        selection,
        includeTimeline,
      });
      doc.save(filename);
      showFeedback('PDF baixado com sucesso.');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showFeedback('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePdf = async () => {
    if (!hasAnySelected || isGenerating) return;
    setIsGenerating(true);
    try {
      const { doc, filename } = buildReportPdfDocument({
        profile,
        summary,
        selection,
        includeTimeline,
      });
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Relatório — Diário de ${profile.name || 'Bebê'}`,
          text: `Relatório do período ${formatShortDate(summary.startDate, true)} a ${formatShortDate(summary.endDate, true)}`,
          files: [file],
        });
        showFeedback('PDF pronto para compartilhar.');
      } else {
        doc.save(filename);
        showFeedback('PDF baixado para enviar pelo WhatsApp ou e-mail.');
      }
    } catch (err: unknown) {
      // User canceling native share sheet is not an error
      const anyErr = err as { name?: string };
      if (anyErr?.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
        showFeedback('Não foi possível compartilhar. Use o botão Baixar PDF.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryItems: {
    key: ReportCategoryKey;
    label: string;
    countLabel: string;
    iconType?: 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota';
  }[] = [
    {
      key: 'peito',
      label: 'Peito',
      countLabel: `${summary.peito.total} ${summary.peito.total === 1 ? 'mamada' : 'mamadas'}`,
      iconType: 'peito',
    },
    {
      key: 'mamadeira',
      label: 'Mamadeira',
      countLabel:
        summary.mamadeira.totalMl > 0
          ? `${summary.mamadeira.total} · ${summary.mamadeira.totalMl} ml`
          : `${summary.mamadeira.total} ${summary.mamadeira.total === 1 ? 'vez' : 'vezes'}`,
      iconType: 'mamadeira',
    },
    {
      key: 'sono',
      label: 'Sono',
      countLabel: `${summary.sono.totalSessions} · ${formatDuration(summary.sono.totalMinutes)}`,
      iconType: 'sono',
    },
    {
      key: 'fralda',
      label: 'Fraldas',
      countLabel: `${summary.fralda.total} ${summary.fralda.total === 1 ? 'troca' : 'trocas'}`,
      iconType: 'fralda',
    },
    {
      key: 'nota',
      label: 'Anotações',
      countLabel: `${summary.nota.total} ${summary.nota.total === 1 ? 'nota' : 'notas'}`,
      iconType: 'nota',
    },
    {
      key: 'alertas',
      label: 'Dias de alerta',
      countLabel: `${summary.alertas.total} ${summary.alertas.total === 1 ? 'dia' : 'dias'}`,
    },
  ];

  const periodRangeDisplay =
    summary.startDate === summary.endDate
      ? formatShortDate(summary.startDate, true)
      : `${formatShortDate(summary.startDate, true)} a ${formatShortDate(summary.endDate, true)} · ${summary.totalDays} dias`;

  return (
    <div className="w-full max-w-xl mx-auto pt-4 pb-24 space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-slate-800 dark:text-slate-100">
          Relatórios
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Resumo organizado da rotina de {profile.name || 'seu bebê'} com exportação em PDF
        </p>
      </div>

      {/* 1. Period Selection Card */}
      <section className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#24473D] dark:text-emerald-400 shrink-0" />
            <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              Período
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            {periodRangeDisplay}
          </span>
        </div>

        {/* Segmented Period Presets */}
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-[#141428] border border-stone-200/60 dark:border-slate-800">
          {(
            [
              { id: 'dia', label: 'Dia' },
              { id: '7dias', label: '7 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'mes', label: 'Mês' },
              { id: 'personalizado', label: 'Datas' },
            ] as { id: PeriodPreset; label: string }[]
          ).map((item) => {
            const active = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[40px] cursor-pointer ${
                  active
                    ? 'bg-[#24473D] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Specific Date Input */}
        {preset === 'dia' && (
          <div className="pt-1">
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Escolha o dia
            </label>
            <input
              type="date"
              value={singleDate}
              max={today}
              onChange={(e) => setSingleDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141428] border border-stone-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#24473D] min-h-[44px]"
            />
          </div>
        )}

        {/* Custom Range Date Inputs */}
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
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141428] border border-stone-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#24473D] min-h-[44px]"
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
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-[#141428] border border-stone-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#24473D] min-h-[44px]"
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. What to Export (Checkboxes + Selecionar tudo) */}
      <section className="bg-white dark:bg-[#1a1a33] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
              O que exportar
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
              {selectedCount} de {ALL_KEYS.length} selecionados
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-[#24473D] dark:text-emerald-300 transition-colors min-h-[40px] cursor-pointer whitespace-nowrap shrink-0"
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

        {/* 2-Column Tactile Checkbox Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {categoryItems.map((item) => {
            const checked = selection[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggleCategory(item.key)}
                className={`flex items-center justify-between gap-2.5 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] min-h-[56px] cursor-pointer ${
                  checked
                    ? 'bg-[#24473D]/15 dark:bg-[#24473D]/35 border-[#24473D] dark:border-emerald-500/60 text-slate-900 dark:text-slate-100'
                    : 'bg-stone-50 dark:bg-[#141428] border-stone-200/70 dark:border-slate-800 text-stone-500 dark:text-stone-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-[#DCE9DF] dark:bg-[#1f362a]'
                        : 'bg-stone-200/70 dark:bg-slate-800/80 opacity-60'
                    }`}
                  >
                    {item.iconType ? (
                      <CategoryIcon category={item.iconType} size={18} />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold truncate">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400 tabular-nums truncate">
                      {item.countLabel}
                    </span>
                  </div>
                </div>

                {/* Checkbox box */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                    checked
                      ? 'bg-[#24473D] dark:bg-emerald-500 border-[#24473D] dark:border-emerald-500 text-white'
                      : 'border-stone-300 dark:border-slate-600 bg-transparent'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Include Day-by-Day Timeline Toggle */}
        <div className="pt-2 border-t border-stone-200/60 dark:border-slate-800">
          <button
            type="button"
            role="switch"
            aria-checked={includeTimeline}
            onClick={() => setIncludeTimeline((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 py-1.5 text-left min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ListOrdered className="w-4 h-4 text-stone-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Incluir linha do tempo dia a dia no PDF
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                  Desative para um relatório curto apenas com os totais
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                includeTimeline
                  ? 'bg-[#24473D] dark:bg-emerald-500'
                  : 'bg-stone-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  includeTimeline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </section>

      {/* 3. Live Summary Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
            Prévia do Resumo
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            {summary.totalSelectedRecords}{' '}
            {summary.totalSelectedRecords === 1 ? 'item no período' : 'itens no período'}
          </span>
        </div>

        {!hasAnySelected ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 text-center">
            <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhum item selecionado
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Marque pelo menos uma opção acima ou toque em &ldquo;Selecionar tudo&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Metric Cards Grid */}
            {(selection.peito || selection.mamadeira || selection.sono || selection.fralda) && (
              <div className="grid grid-cols-2 gap-3">
                {selection.peito && (
                  <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                      Peito
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums">
                      {summary.peito.total}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums leading-relaxed">
                      Esq {summary.peito.esquerdo} · Dir {summary.peito.direito} · Ambos{' '}
                      {summary.peito.ambos}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                      Média {summary.peito.avgPerDay.toFixed(1).replace('.', ',')}/dia
                    </p>
                  </div>
                )}

                {selection.mamadeira && (
                  <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 block">
                      Mamadeira
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums">
                      {summary.mamadeira.total}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums leading-relaxed">
                      {summary.mamadeira.totalMl > 0
                        ? `Total ${summary.mamadeira.totalMl} ml · Média ${summary.mamadeira.avgMlPerBottle} ml`
                        : 'Sem volume informado'}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                      {summary.mamadeira.totalMl > 0
                        ? `${summary.mamadeira.avgMlPerDay} ml/dia`
                        : `Média ${summary.mamadeira.avgPerDay.toFixed(1).replace('.', ',')}/dia`}
                    </p>
                  </div>
                )}

                {selection.sono && (
                  <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 block">
                      Sono
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatDuration(summary.sono.totalMinutes)}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums leading-relaxed">
                      {summary.sono.totalSessions}{' '}
                      {summary.sono.totalSessions === 1 ? 'registro' : 'registros'}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                      Média {formatDuration(summary.sono.avgMinutesPerDay)}/dia
                    </p>
                  </div>
                )}

                {selection.fralda && (
                  <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block">
                      Fraldas
                    </span>
                    <div className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100 tabular-nums">
                      {summary.fralda.total}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums leading-relaxed">
                      Xixi {summary.fralda.xixi} · Cocô {summary.fralda.coco} · Ambos{' '}
                      {summary.fralda.ambos}
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
                      Média {summary.fralda.avgPerDay.toFixed(1).replace('.', ',')}/dia
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Alert Days Preview */}
            {selection.alertas && summary.alertas.items.length > 0 && (
              <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Dias sinalizados no período
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.alertas.vermelho} vermelho · {summary.alertas.amarelo} amarelo
                  </span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-slate-800">
                  {summary.alertas.items.map((alert) => (
                    <div
                      key={alert.date}
                      className="py-1.5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatShortDate(alert.date, true)}
                      </span>
                      <span
                        className={`font-semibold ${
                          alert.color === 'vermelho'
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {alert.color === 'vermelho'
                          ? 'Vermelho · Dia de alerta'
                          : 'Amarelo · Dia de atenção'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Preview */}
            {selection.nota && summary.nota.items.length > 0 && (
              <div className="p-4 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200/70 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Anotações incluídas
                  </span>
                  <span className="text-stone-500 dark:text-stone-400 tabular-nums">
                    {summary.nota.total}{' '}
                    {summary.nota.total === 1 ? 'anotação' : 'anotações'}
                  </span>
                </div>
                <div className="divide-y divide-stone-100 dark:divide-slate-800">
                  {summary.nota.items.slice(0, 3).map((note) => (
                    <div key={note.id} className="py-2 text-xs">
                      <span className="text-stone-400 tabular-nums block mb-0.5">
                        {formatShortDate(note.date, true)}
                        {note.time ? ` · ${note.time}` : ''}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
                {summary.nota.items.length > 3 && (
                  <p className="text-[11px] text-stone-400">
                    + {summary.nota.items.length - 3} anotações serão exibidas completas no PDF
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Primary Export Actions */}
      <section className="space-y-2.5 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!hasAnySelected || isGenerating}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1b362e] dark:hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all min-h-[52px] cursor-pointer"
          >
            <FileDown className="w-5 h-5" />
            <span>{isGenerating ? 'Gerando PDF...' : 'Exportar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleSharePdf}
            disabled={!hasAnySelected || isGenerating}
            className="w-full py-3.5 px-5 rounded-2xl bg-stone-200/80 dark:bg-slate-800 hover:bg-stone-300/80 dark:hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 border border-stone-300/70 dark:border-slate-700 active:scale-[0.98] transition-all min-h-[52px] cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar PDF</span>
          </button>
        </div>

        {exportFeedback && (
          <p
            role="status"
            className="text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-1"
          >
            {exportFeedback}
          </p>
        )}
      </section>
    </div>
  );
}
