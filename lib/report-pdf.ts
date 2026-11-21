import { jsPDF } from 'jspdf';
import {
  BabyProfile,
  BabyRecord,
  BreastfeedingRecord,
  BottleRecord,
  SleepRecord,
  DiaperRecord,
  NoteRecord,
  DayColorsMap,
  DayAlertColor,
} from './types';
import {
  formatDuration,
  formatShortDate,
  format24hTime,
  getSleepMinutesForDate,
  getAdjacentDateString,
} from './date-utils';

export type ReportCategoryKey =
  | 'peito'
  | 'mamadeira'
  | 'sono'
  | 'fralda'
  | 'nota'
  | 'alertas';

export interface ReportSelection {
  peito: boolean;
  mamadeira: boolean;
  sono: boolean;
  fralda: boolean;
  nota: boolean;
  alertas: boolean;
}

export interface ReportDayGroup {
  date: string;
  alertColor?: DayAlertColor;
  sleepMinutes: number;
  items: BabyRecord[];
}

export interface ReportSummary {
  startDate: string;
  endDate: string;
  totalDays: number;
  datesInRange: string[];
  peito: {
    total: number;
    esquerdo: number;
    direito: number;
    ambos: number;
    avgPerDay: number;
  };
  mamadeira: {
    total: number;
    totalMl: number;
    measuredCount: number;
    unmeasuredCount: number;
    avgMlPerBottle: number;
    avgMlPerDay: number;
    avgPerDay: number;
  };
  sono: {
    totalSessions: number;
    totalMinutes: number;
    avgMinutesPerDay: number;
    avgSessionsPerDay: number;
  };
  fralda: {
    total: number;
    xixi: number;
    coco: number;
    ambos: number;
    avgPerDay: number;
  };
  nota: {
    total: number;
    favorites: number;
    items: NoteRecord[];
  };
  alertas: {
    total: number;
    vermelho: number;
    amarelo: number;
    items: { date: string; color: DayAlertColor }[];
  };
  dayGroups: ReportDayGroup[];
  totalSelectedRecords: number;
}

/**
 * Generates an ordered array of YYYY-MM-DD strings from startDate to endDate inclusive.
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;
  const dates: string[] = [];
  let cursor = start;
  let guard = 0;

  while (cursor <= end && guard < 400) {
    dates.push(cursor);
    cursor = getAdjacentDateString(cursor, 1);
    guard += 1;
  }
  return dates;
}

/**
 * Removes unsupported Unicode symbols/emojis for clean Latin-1 Helvetica PDF rendering
 */
function sanitizePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPtDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const monthNames = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];
  return `${weekDays[dt.getDay()]}, ${String(d).padStart(2, '0')} de ${monthNames[m - 1]} de ${y}`;
}

function formatBabyAge(birthDate?: string): string | null {
  if (!birthDate) return null;
  const parts = birthDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  if (birth > now) return null;

  const diffDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }
  const months = Math.floor(diffDays / 30.4375);
  const remDays = Math.floor(diffDays - months * 30.4375);
  if (months < 12) {
    return remDays > 0
      ? `${months} ${months === 1 ? 'mês' : 'meses'} e ${remDays} ${remDays === 1 ? 'dia' : 'dias'}`
      : `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0
    ? `${years} ${years === 1 ? 'ano' : 'anos'} e ${remMonths} ${remMonths === 1 ? 'mês' : 'meses'}`
    : `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

function getRecordSortTime(record: BabyRecord): string {
  if (record.type === 'sono') return record.startTime || '00:00';
  return record.time || '00:00';
}

/**
 * Computes complete report statistics for the requested date range and selection.
 */
export function buildReportSummary(
  records: BabyRecord[],
  dayColors: DayColorsMap,
  rawStartDate: string,
  rawEndDate: string,
  selection: ReportSelection
): ReportSummary {
  const startDate = rawStartDate <= rawEndDate ? rawStartDate : rawEndDate;
  const endDate = rawStartDate <= rawEndDate ? rawEndDate : rawStartDate;
  const datesInRange = getDatesBetween(startDate, endDate);
  const totalDays = Math.max(1, datesInRange.length);

  const peitoRecs: BreastfeedingRecord[] = [];
  const mamadeiraRecs: BottleRecord[] = [];
  const sonoRecs: SleepRecord[] = [];
  const fraldaRecs: DiaperRecord[] = [];
  const notaRecs: NoteRecord[] = [];

  for (const r of records) {
    if (r.type === 'sono') {
      if (r.startDate <= endDate && r.endDate >= startDate) {
        sonoRecs.push(r);
      }
    } else if (r.date >= startDate && r.date <= endDate) {
      if (r.type === 'peito') peitoRecs.push(r);
      else if (r.type === 'mamadeira') mamadeiraRecs.push(r);
      else if (r.type === 'fralda') fraldaRecs.push(r);
      else if (r.type === 'nota') notaRecs.push(r);
    }
  }

  // Peito breakdown
  let esquerdo = 0;
  let direito = 0;
  let ambosPeito = 0;
  for (const p of peitoRecs) {
    if (p.side === 'esquerdo') esquerdo++;
    else if (p.side === 'direito') direito++;
    else ambosPeito++;
  }

  // Mamadeira breakdown
  let totalMl = 0;
  let measuredCount = 0;
  let unmeasuredCount = 0;
  for (const b of mamadeiraRecs) {
    if (b.volumeMl !== null && typeof b.volumeMl === 'number') {
      totalMl += b.volumeMl;
      measuredCount++;
    } else {
      unmeasuredCount++;
    }
  }

  // Sono breakdown (accurate per-day minutes across midnight boundaries)
  let totalSleepMinutes = 0;
  const sleepMinutesByDate: Record<string, number> = {};
  for (const d of datesInRange) {
    let dayMins = 0;
    for (const s of sonoRecs) {
      dayMins += getSleepMinutesForDate(s, d);
    }
    sleepMinutesByDate[d] = dayMins;
    totalSleepMinutes += dayMins;
  }

  // Fralda breakdown
  let xixi = 0;
  let coco = 0;
  let ambosFralda = 0;
  for (const f of fraldaRecs) {
    if (f.diaperType === 'xixi') xixi++;
    else if (f.diaperType === 'coco') coco++;
    else ambosFralda++;
  }

  // Notas sorted newest to oldest
  const sortedNotes = [...notaRecs].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.time || '').localeCompare(a.time || '') || b.createdAt - a.createdAt;
  });

  // Alert days in range
  const alertItems: { date: string; color: DayAlertColor }[] = [];
  let vermelho = 0;
  let amarelo = 0;
  for (const d of datesInRange) {
    const color = dayColors[d];
    if (color === 'vermelho' || color === 'amarelo') {
      alertItems.push({ date: d, color });
      if (color === 'vermelho') vermelho++;
      else amarelo++;
    }
  }

  // Day-by-day groups (only including selected categories)
  const dayGroups: ReportDayGroup[] = [];
  for (const d of [...datesInRange].reverse()) {
    const itemsForDay: BabyRecord[] = [];

    if (selection.peito) {
      itemsForDay.push(...peitoRecs.filter((r) => r.date === d));
    }
    if (selection.mamadeira) {
      itemsForDay.push(...mamadeiraRecs.filter((r) => r.date === d));
    }
    if (selection.sono) {
      itemsForDay.push(...sonoRecs.filter((r) => d >= r.startDate && d <= r.endDate));
    }
    if (selection.fralda) {
      itemsForDay.push(...fraldaRecs.filter((r) => r.date === d));
    }
    if (selection.nota) {
      itemsForDay.push(...notaRecs.filter((r) => r.date === d));
    }

    itemsForDay.sort((a, b) => {
      const ta = getRecordSortTime(a);
      const tb = getRecordSortTime(b);
      if (ta !== tb) return ta.localeCompare(tb);
      return a.createdAt - b.createdAt;
    });

    const alertColor = selection.alertas ? dayColors[d] : undefined;
    if (itemsForDay.length > 0 || alertColor) {
      dayGroups.push({
        date: d,
        alertColor,
        sleepMinutes: selection.sono ? sleepMinutesByDate[d] || 0 : 0,
        items: itemsForDay,
      });
    }
  }

  const totalSelectedRecords =
    (selection.peito ? peitoRecs.length : 0) +
    (selection.mamadeira ? mamadeiraRecs.length : 0) +
    (selection.sono ? sonoRecs.length : 0) +
    (selection.fralda ? fraldaRecs.length : 0) +
    (selection.nota ? notaRecs.length : 0) +
    (selection.alertas ? alertItems.length : 0);

  return {
    startDate,
    endDate,
    totalDays,
    datesInRange,
    peito: {
      total: peitoRecs.length,
      esquerdo,
      direito,
      ambos: ambosPeito,
      avgPerDay: peitoRecs.length / totalDays,
    },
    mamadeira: {
      total: mamadeiraRecs.length,
      totalMl,
      measuredCount,
      unmeasuredCount,
      avgMlPerBottle: measuredCount > 0 ? Math.round(totalMl / measuredCount) : 0,
      avgMlPerDay: Math.round(totalMl / totalDays),
      avgPerDay: mamadeiraRecs.length / totalDays,
    },
    sono: {
      totalSessions: sonoRecs.length,
      totalMinutes: totalSleepMinutes,
      avgMinutesPerDay: Math.round(totalSleepMinutes / totalDays),
      avgSessionsPerDay: sonoRecs.length / totalDays,
    },
    fralda: {
      total: fraldaRecs.length,
      xixi,
      coco,
      ambos: ambosFralda,
      avgPerDay: fraldaRecs.length / totalDays,
    },
    nota: {
      total: sortedNotes.length,
      favorites: sortedNotes.filter((n) => n.isFavorite).length,
      items: sortedNotes,
    },
    alertas: {
      total: alertItems.length,
      vermelho,
      amarelo,
      items: alertItems,
    },
    dayGroups,
    totalSelectedRecords,
  };
}

/**
 * Creates a clean, print-ready A4 PDF document for the baby routine report.
 */
export function buildReportPdfDocument(options: {
  profile: BabyProfile;
  summary: ReportSummary;
  selection: ReportSelection;
  includeTimeline: boolean;
}): { doc: jsPDF; filename: string } {
  const { profile, summary, selection, includeTimeline } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  const babyName = sanitizePdfText(profile.name || 'Bebê');
  const babyAge = formatBabyAge(profile.birthDate);
  const periodLabel =
    summary.startDate === summary.endDate
      ? formatShortDate(summary.startDate, true)
      : `${formatShortDate(summary.startDate, true)} a ${formatShortDate(summary.endDate, true)} (${summary.totalDays} dias)`;

  let y = 0;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = 18;
    }
  };

  // --- TOP HEADER BAND ---
  doc.setFillColor(36, 71, 61); // Brand deep forest green #24473D
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`Relatório — Diário de ${babyName}`, marginX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const subHeaderParts: string[] = [`Período: ${periodLabel}`];
  if (profile.birthDate) {
    subHeaderParts.push(`Nascimento: ${formatShortDate(profile.birthDate, true)}`);
  }
  if (babyAge) {
    subHeaderParts.push(`Idade: ${babyAge}`);
  }
  doc.text(subHeaderParts.join('   |   '), marginX, 23);

  const selectedLabels: string[] = [];
  if (selection.peito) selectedLabels.push('Peito');
  if (selection.mamadeira) selectedLabels.push('Mamadeira');
  if (selection.sono) selectedLabels.push('Sono');
  if (selection.fralda) selectedLabels.push('Fraldas');
  if (selection.nota) selectedLabels.push('Anotações');
  if (selection.alertas) selectedLabels.push('Dias de Alerta');

  doc.setFontSize(8.5);
  doc.setTextColor(214, 232, 223);
  doc.text(`Itens incluídos: ${selectedLabels.join(', ')}`, marginX, 30);

  y = 46;

  // --- SECTION 1: RESUMO DO PERÍODO (KPI CARDS) ---
  interface KpiCardData {
    title: string;
    value: string;
    detail1: string;
    detail2: string;
    accentRgb: [number, number, number];
  }

  const kpiCards: KpiCardData[] = [];

  if (selection.peito) {
    kpiCards.push({
      title: 'Mamadas no Peito',
      value: `${summary.peito.total}`,
      detail1: `Esq: ${summary.peito.esquerdo}  |  Dir: ${summary.peito.direito}  |  Ambos: ${summary.peito.ambos}`,
      detail2: `Média: ${summary.peito.avgPerDay.toFixed(1).replace('.', ',')} por dia`,
      accentRgb: [36, 71, 61],
    });
  }

  if (selection.mamadeira) {
    kpiCards.push({
      title: 'Mamadeiras',
      value:
        summary.mamadeira.totalMl > 0
          ? `${summary.mamadeira.total} (${summary.mamadeira.totalMl} ml)`
          : `${summary.mamadeira.total}`,
      detail1:
        summary.mamadeira.measuredCount > 0
          ? `Média por mamadeira: ${summary.mamadeira.avgMlPerBottle} ml`
          : 'Sem volume informado',
      detail2:
        summary.mamadeira.totalMl > 0
          ? `Média diária: ${summary.mamadeira.avgMlPerDay} ml/dia (${summary.mamadeira.avgPerDay.toFixed(1).replace('.', ',')}x)`
          : `Média: ${summary.mamadeira.avgPerDay.toFixed(1).replace('.', ',')} por dia`,
      accentRgb: [180, 83, 9],
    });
  }

  if (selection.sono) {
    kpiCards.push({
      title: 'Sono Registrado',
      value: formatDuration(summary.sono.totalMinutes),
      detail1: `${summary.sono.totalSessions} ${summary.sono.totalSessions === 1 ? 'registro de sono' : 'registros de sono'}`,
      detail2: `Média diária: ${formatDuration(summary.sono.avgMinutesPerDay)} / dia`,
      accentRgb: [79, 70, 229],
    });
  }

  if (selection.fralda) {
    kpiCards.push({
      title: 'Trocas de Fralda',
      value: `${summary.fralda.total}`,
      detail1: `Xixi: ${summary.fralda.xixi}  |  Cocô: ${summary.fralda.coco}  |  Ambos: ${summary.fralda.ambos}`,
      detail2: `Média: ${summary.fralda.avgPerDay.toFixed(1).replace('.', ',')} por dia`,
      accentRgb: [146, 64, 14],
    });
  }

  if (kpiCards.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumo do Período', marginX, y);
    y += 5;

    const cardGap = 6;
    const cardW = (contentWidth - cardGap) / 2;
    const cardH = 26;

    for (let i = 0; i < kpiCards.length; i += 2) {
      ensureSpace(cardH + 5);
      const rowItems = kpiCards.slice(i, i + 2);
      rowItems.forEach((card, colIdx) => {
        const x = marginX + colIdx * (cardW + cardGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
        doc.text(card.title, x + 4, y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(card.value, x + 4, y + 13.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(card.detail1, x + 4, y + 19);
        doc.text(card.detail2, x + 4, y + 23.5);
      });
      y += cardH + 5;
    }
    y += 3;
  }

  // --- SECTION 2: DIAS SINALIZADOS (ALERTAS) ---
  if (selection.alertas) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Dias Sinalizados no Calendário', marginX, y);
    y += 5.5;

    if (summary.alertas.items.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum dia marcado com alerta (amarelo ou vermelho) neste período.', marginX, y);
      y += 9;
    } else {
      for (const alert of summary.alertas.items) {
        ensureSpace(8);
        const isRed = alert.color === 'vermelho';
        doc.setFillColor(isRed ? 254 : 254, isRed ? 242 : 252, isRed ? 242 : 232);
        doc.setDrawColor(isRed ? 244 : 245, isRed ? 63 : 158, isRed ? 94 : 11);
        doc.setLineWidth(0.3);
        doc.roundedRect(marginX, y - 4.2, contentWidth, 7.5, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(isRed ? 190 : 180, isRed ? 18 : 83, isRed ? 60 : 9);
        doc.text(
          `${formatShortDate(alert.date, true)}  -  ${isRed ? 'Vermelho (Dia Perigoso / Alerta)' : 'Amarelo (Dia de Atenção)'}`,
          marginX + 3,
          y + 0.8
        );
        y += 9;
      }
      y += 2;
    }
  }

  // --- SECTION 3: ANOTAÇÕES ---
  if (selection.nota) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Anotações (${summary.nota.total})`, marginX, y);
    y += 5.5;

    if (summary.nota.items.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhuma anotação registrada neste período.', marginX, y);
      y += 9;
    } else {
      for (const note of summary.nota.items) {
        const cleanContent = sanitizePdfText(note.content);
        const wrappedLines = doc.splitTextToSize(cleanContent, contentWidth - 8);
        const blockHeight = 8 + wrappedLines.length * 4.5 + 3;
        ensureSpace(blockHeight + 2);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.roundedRect(marginX, y - 3.5, contentWidth, blockHeight, 2.5, 2.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(36, 71, 61);
        const timeStr = note.time ? ` às ${format24hTime(note.time)}` : '';
        const favTag = note.isFavorite ? '  [Favorito]' : '';
        doc.text(`${formatShortDate(note.date, true)}${timeStr}${favTag}`, marginX + 4, y + 1.2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(wrappedLines, marginX + 4, y + 6.5);

        y += blockHeight + 3;
      }
      y += 2;
    }
  }

  // --- SECTION 4: DETALHAMENTO DIA A DIA ---
  const hasTimelineCategories =
    selection.peito || selection.mamadeira || selection.sono || selection.fralda || selection.nota;

  if (includeTimeline && hasTimelineCategories) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Detalhamento Dia a Dia', marginX, y);
    y += 6;

    const groupsWithEvents = summary.dayGroups.filter((g) => g.items.length > 0);
    if (groupsWithEvents.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum registro encontrado para os itens selecionados neste período.', marginX, y);
      y += 8;
    } else {
      for (const group of groupsWithEvents) {
        ensureSpace(16);

        // Day header bar
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(marginX, y - 4, contentWidth, 7.5, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);

        let dayTitle = formatPtDateLong(group.date);
        if (group.alertColor === 'vermelho') dayTitle += '  [ALERTA VERMELHO]';
        else if (group.alertColor === 'amarelo') dayTitle += '  [ATENÇÃO AMARELO]';
        doc.text(dayTitle, marginX + 3, y + 1);

        if (selection.sono && group.sleepMinutes > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          const sleepTag = `Sono no dia: ${formatDuration(group.sleepMinutes)}`;
          doc.text(sleepTag, pageWidth - marginX - 3, y + 1, { align: 'right' });
        }

        y += 7;

        for (const rec of group.items) {
          let timeCol = '--:--';
          let catCol = '';
          let detailCol = '';

          if (rec.type === 'peito') {
            timeCol = rec.time ? format24hTime(rec.time) : '--:--';
            catCol = 'Peito';
            detailCol =
              rec.side === 'esquerdo'
                ? 'Lado Esquerdo'
                : rec.side === 'direito'
                ? 'Lado Direito'
                : 'Ambos os peitos';
          } else if (rec.type === 'mamadeira') {
            timeCol = rec.time ? format24hTime(rec.time) : '--:--';
            catCol = 'Mamadeira';
            detailCol = rec.volumeMl !== null ? `${rec.volumeMl} ml` : 'Sem volume informado';
          } else if (rec.type === 'sono') {
            timeCol = format24hTime(rec.startTime);
            catCol = 'Sono';
            const endInfo =
              rec.startDate !== rec.endDate
                ? `${format24hTime(rec.endTime)} (${formatShortDate(rec.endDate)})`
                : format24hTime(rec.endTime);
            detailCol = `Dormiu ${format24hTime(rec.startTime)} até ${endInfo} (${formatDuration(rec.durationMinutes)})`;
          } else if (rec.type === 'fralda') {
            timeCol = rec.time ? format24hTime(rec.time) : '--:--';
            catCol = 'Fralda';
            detailCol =
              rec.diaperType === 'xixi'
                ? 'Xixi'
                : rec.diaperType === 'coco'
                ? 'Cocô'
                : 'Xixi e Cocô';
          } else if (rec.type === 'nota') {
            timeCol = rec.time ? format24hTime(rec.time) : '--:--';
            catCol = rec.isFavorite ? 'Nota (*)' : 'Nota';
            detailCol = sanitizePdfText(rec.content);
          }

          const detailLines = doc.splitTextToSize(detailCol, contentWidth - 46);
          const rowH = Math.max(5.5, detailLines.length * 4.3 + 1.5);
          ensureSpace(rowH + 1);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.text(timeCol, marginX + 2, y + 1);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(36, 71, 61);
          doc.text(catCol, marginX + 18, y + 1);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(detailLines, marginX + 42, y + 1);

          y += rowH;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(marginX + 2, y - 1.5, pageWidth - marginX - 2, y - 1.5);
        }

        y += 4;
      }
    }
  }

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  const nowStr = new Date().toLocaleDateString('pt-BR');
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Diário de ${babyName}  ·  Gerado em ${nowStr}`, marginX, pageHeight - 8);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const safeSlug = babyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'bebe';
  const datePart =
    summary.startDate === summary.endDate
      ? summary.startDate
      : `${summary.startDate}_a_${summary.endDate}`;
  const filename = `relatorio-${safeSlug}-${datePart}.pdf`;

  return { doc, filename };
}
