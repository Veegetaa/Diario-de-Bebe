import { jsPDF } from 'jspdf';
import {
  BabyProfile,
  BabyRecord,
  BottleRecord,
  BreastfeedingRecord,
  DayAlertColor,
  DayColorsMap,
  DiaperRecord,
  MedicationRecord,
  NoteRecord,
  SleepRecord,
  VaccineRecord,
} from './types';
import {
  format24hTime,
  formatDuration,
  formatShortDate,
  getSleepMinutesForDate,
  getTodayDateString,
} from './date-utils';

export type ReportPeriodPreset = 'dia' | '7dias' | '30dias' | 'mes' | 'personalizado';

export interface ReportSectionsSelection {
  peito: boolean;
  mamadeira: boolean;
  sono: boolean;
  fralda: boolean;
  nota: boolean;
  alertas: boolean;
  remedio: boolean;
  vacina: boolean;
}

export const ALL_SECTIONS_SELECTED: ReportSectionsSelection = {
  peito: true,
  mamadeira: true,
  sono: true,
  fralda: true,
  nota: true,
  alertas: true,
  remedio: true,
  vacina: true,
};

export interface DayTimelineEntry {
  id: string;
  time: string;
  category: 'peito' | 'mamadeira' | 'sono' | 'fralda' | 'nota' | 'remedio' | 'vacina';
  categoryLabel: string;
  summary: string;
  isFavorite?: boolean;
  createdAt: number;
}

export interface DayReportGroup {
  date: string;
  alertColor?: DayAlertColor;
  entries: DayTimelineEntry[];
}

export interface ReportDataSummary {
  startDate: string;
  endDate: string;
  daysCount: number;
  datesInRange: string[];
  peito: {
    total: number;
    esquerdo: number;
    direito: number;
    ambos: number;
    avgPerDay: number;
    records: BreastfeedingRecord[];
  };
  mamadeira: {
    total: number;
    totalMl: number;
    measuredCount: number;
    unmeasuredCount: number;
    avgMlPerBottle: number;
    avgMlPerDay: number;
    records: BottleRecord[];
  };
  sono: {
    totalSessions: number;
    totalMinutes: number;
    avgMinutesPerDay: number;
    records: SleepRecord[];
  };
  fralda: {
    total: number;
    xixi: number;
    coco: number;
    ambos: number;
    avgPerDay: number;
    records: DiaperRecord[];
  };
  nota: {
    total: number;
    favorites: number;
    records: NoteRecord[];
  };
  alertas: {
    total: number;
    vermelho: number;
    amarelo: number;
    items: Array<{ date: string; color: DayAlertColor }>;
  };
  remedio: {
    total: number;
    records: MedicationRecord[];
  };
  vacina: {
    total: number;
    records: VaccineRecord[];
  };
  days: DayReportGroup[];
}

/**
 * Enumerates every YYYY-MM-DD date string between startDate and endDate (inclusive)
 */
export function enumerateDatesBetween(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  // Safety cap at 366 days to prevent accidental runaway loops
  let guard = 0;
  while (current <= end && guard < 366) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
    guard += 1;
  }
  return dates;
}

/**
 * Resolves a period preset into [startDate, endDate] YYYY-MM-DD strings
 */
export function resolvePeriodRange(
  preset: ReportPeriodPreset,
  singleDate: string,
  customStart: string,
  customEnd: string
): { startDate: string; endDate: string } {
  const today = getTodayDateString();
  const [ty, tm, td] = today.split('-').map(Number);

  const shiftDays = (daysOffset: number): string => {
    const d = new Date(ty, tm - 1, td);
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (preset === 'dia') {
    const target = singleDate || today;
    return { startDate: target, endDate: target };
  }
  if (preset === '7dias') {
    return { startDate: shiftDays(-6), endDate: today };
  }
  if (preset === '30dias') {
    return { startDate: shiftDays(-29), endDate: today };
  }
  if (preset === 'mes') {
    const firstOfMonth = `${ty}-${String(tm).padStart(2, '0')}-01`;
    return { startDate: firstOfMonth, endDate: today };
  }

  // Personalizado
  const s = customStart || today;
  const e = customEnd || today;
  if (s <= e) {
    return { startDate: s, endDate: e };
  }
  return { startDate: e, endDate: s };
}

/**
 * Computes aggregated statistics and day-by-day entries for a date range
 */
export function buildReportSummary(
  records: BabyRecord[],
  dayColors: DayColorsMap,
  startDate: string,
  endDate: string,
  selectedSections: ReportSectionsSelection
): ReportDataSummary {
  const datesInRange = enumerateDatesBetween(startDate, endDate);
  const daysCount = Math.max(1, datesInRange.length);

  const peitoRecords: BreastfeedingRecord[] = [];
  const mamadeiraRecords: BottleRecord[] = [];
  const sonoRecords: SleepRecord[] = [];
  const fraldaRecords: DiaperRecord[] = [];
  const notaRecords: NoteRecord[] = [];
  const remedioRecords: MedicationRecord[] = [];
  const vacinaRecords: VaccineRecord[] = [];

  for (const r of records) {
    if (r.type === 'sono') {
      // Intersects range if startDate <= endDate AND endDate >= startDate
      if (r.startDate <= endDate && r.endDate >= startDate) {
        sonoRecords.push(r);
      }
    } else if (r.date >= startDate && r.date <= endDate) {
      if (r.type === 'peito') peitoRecords.push(r);
      else if (r.type === 'mamadeira') mamadeiraRecords.push(r);
      else if (r.type === 'fralda') fraldaRecords.push(r);
      else if (r.type === 'nota') notaRecords.push(r);
      else if (r.type === 'remedio') remedioRecords.push(r);
      else if (r.type === 'vacina') vacinaRecords.push(r);
    }
  }

  // Peito stats
  let esquerdo = 0;
  let direito = 0;
  let ambosPeito = 0;
  for (const p of peitoRecords) {
    if (p.side === 'esquerdo') esquerdo += 1;
    else if (p.side === 'direito') direito += 1;
    else ambosPeito += 1;
  }

  // Mamadeira stats
  let totalMl = 0;
  let measuredCount = 0;
  let unmeasuredCount = 0;
  for (const m of mamadeiraRecords) {
    if (m.volumeMl !== null && typeof m.volumeMl === 'number') {
      totalMl += m.volumeMl;
      measuredCount += 1;
    } else {
      unmeasuredCount += 1;
    }
  }

  // Sono stats (accurately slice cross-midnight sessions to days within range)
  let totalSleepMinutes = 0;
  for (const dateStr of datesInRange) {
    for (const s of sonoRecords) {
      totalSleepMinutes += getSleepMinutesForDate(s, dateStr);
    }
  }

  // Fralda stats
  let xixi = 0;
  let coco = 0;
  let ambosFralda = 0;
  for (const f of fraldaRecords) {
    if (f.diaperType === 'xixi') xixi += 1;
    else if (f.diaperType === 'coco') coco += 1;
    else ambosFralda += 1;
  }

  // Notas stats
  const sortedNotes = [...notaRecords].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt;
  });
  const favoritesCount = sortedNotes.filter((n) => n.isFavorite).length;

  // Alert days in range
  const alertItems: Array<{ date: string; color: DayAlertColor }> = [];
  for (const dateStr of datesInRange) {
    const c = dayColors[dateStr];
    if (c === 'vermelho' || c === 'amarelo') {
      alertItems.push({ date: dateStr, color: c });
    }
  }
  const vermelhoCount = alertItems.filter((a) => a.color === 'vermelho').length;
  const amareloCount = alertItems.filter((a) => a.color === 'amarelo').length;

  // Build day-by-day chronological groups filtered by selectedSections
  const days: DayReportGroup[] = [];
  for (const dateStr of datesInRange) {
    const entries: DayTimelineEntry[] = [];

    if (selectedSections.peito) {
      for (const p of peitoRecords) {
        if (p.date === dateStr) {
          const sideLabel =
            p.side === 'esquerdo'
              ? 'Lado Esquerdo'
              : p.side === 'direito'
              ? 'Lado Direito'
              : 'Ambos os peitos';
          entries.push({
            id: p.id,
            time: p.time || '00:00',
            category: 'peito',
            categoryLabel: 'Peito',
            summary: sideLabel,
            createdAt: p.createdAt,
          });
        }
      }
    }

    if (selectedSections.mamadeira) {
      for (const m of mamadeiraRecords) {
        if (m.date === dateStr) {
          entries.push({
            id: m.id,
            time: m.time || '00:00',
            category: 'mamadeira',
            categoryLabel: 'Mamadeira',
            summary: m.volumeMl !== null ? `${m.volumeMl} ml` : 'Sem volume informado',
            createdAt: m.createdAt,
          });
        }
      }
    }

    if (selectedSections.sono) {
      for (const s of sonoRecords) {
        if (dateStr >= s.startDate && dateStr <= s.endDate) {
          const minsForDay = getSleepMinutesForDate(s, dateStr);
          const timeRef = s.startDate === dateStr ? s.startTime : '00:00';
          const isCrossDay = s.startDate !== s.endDate;
          const summary = isCrossDay
            ? `Dormiu ${format24hTime(s.startTime)} (${formatShortDate(s.startDate)}) ate ${format24hTime(s.endTime)} (${formatShortDate(s.endDate)}) - ${formatDuration(minsForDay)} neste dia`
            : `Dormiu ${format24hTime(s.startTime)} ate ${format24hTime(s.endTime)} (${formatDuration(s.durationMinutes)})`;
          entries.push({
            id: `${s.id}-${dateStr}`,
            time: timeRef,
            category: 'sono',
            categoryLabel: 'Sono',
            summary,
            createdAt: s.createdAt,
          });
        }
      }
    }

    if (selectedSections.fralda) {
      for (const f of fraldaRecords) {
        if (f.date === dateStr) {
          const label =
            f.diaperType === 'xixi'
              ? 'Xixi'
              : f.diaperType === 'coco'
              ? 'Cocô'
              : 'Xixi e Cocô';
          entries.push({
            id: f.id,
            time: f.time || '00:00',
            category: 'fralda',
            categoryLabel: 'Fralda',
            summary: label,
            createdAt: f.createdAt,
          });
        }
      }
    }

    if (selectedSections.nota) {
      for (const n of notaRecords) {
        if (n.date === dateStr) {
          entries.push({
            id: n.id,
            time: n.time || '00:00',
            category: 'nota',
            categoryLabel: n.isFavorite ? 'Anotação (Favorita)' : 'Anotação',
            summary: n.content,
            isFavorite: n.isFavorite,
            createdAt: n.createdAt,
          });
        }
      }
    }

    if (selectedSections.remedio) {
      for (const med of remedioRecords) {
        if (med.date === dateStr) {
          entries.push({
            id: med.id,
            time: med.time || '00:00',
            category: 'remedio',
            categoryLabel: 'Remédio',
            summary: med.notes ? `${med.name} (${med.notes})` : med.name,
            createdAt: med.createdAt,
          });
        }
      }
    }

    if (selectedSections.vacina) {
      for (const vac of vacinaRecords) {
        if (vac.date === dateStr) {
          entries.push({
            id: vac.id,
            time: vac.time || '00:00',
            category: 'vacina',
            categoryLabel: 'Vacina',
            summary: vac.notes ? `${vac.name} (${vac.notes})` : vac.name,
            createdAt: vac.createdAt,
          });
        }
      }
    }

    entries.sort((a, b) => a.time.localeCompare(b.time) || a.createdAt - b.createdAt);

    const alertColor = selectedSections.alertas ? dayColors[dateStr] : undefined;
    if (entries.length > 0 || alertColor) {
      days.push({
        date: dateStr,
        alertColor,
        entries,
      });
    }
  }

  return {
    startDate,
    endDate,
    daysCount,
    datesInRange,
    peito: {
      total: peitoRecords.length,
      esquerdo,
      direito,
      ambos: ambosPeito,
      avgPerDay: peitoRecords.length / daysCount,
      records: peitoRecords,
    },
    mamadeira: {
      total: mamadeiraRecords.length,
      totalMl,
      measuredCount,
      unmeasuredCount,
      avgMlPerBottle: measuredCount > 0 ? Math.round(totalMl / measuredCount) : 0,
      avgMlPerDay: Math.round(totalMl / daysCount),
      records: mamadeiraRecords,
    },
    sono: {
      totalSessions: sonoRecords.length,
      totalMinutes: totalSleepMinutes,
      avgMinutesPerDay: Math.round(totalSleepMinutes / daysCount),
      records: sonoRecords,
    },
    fralda: {
      total: fraldaRecords.length,
      xixi,
      coco,
      ambos: ambosFralda,
      avgPerDay: fraldaRecords.length / daysCount,
      records: fraldaRecords,
    },
    nota: {
      total: sortedNotes.length,
      favorites: favoritesCount,
      records: sortedNotes,
    },
    alertas: {
      total: alertItems.length,
      vermelho: vermelhoCount,
      amarelo: amareloCount,
      items: alertItems,
    },
    remedio: {
      total: remedioRecords.length,
      records: [...remedioRecords].sort(
        (a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')
      ),
    },
    vacina: {
      total: vacinaRecords.length,
      records: [...vacinaRecords].sort(
        (a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')
      ),
    },
    days,
  };
}

/**
 * Strips emojis and non-Latin-1 glyphs so jsPDF standard Helvetica never prints garbled characters
 */
function sanitizePdfText(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[•·]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFullPtDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayName = weekDays[dateObj.getDay()];
  return `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function formatBabyAge(birthDate: string): string | null {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number);
  if (!by || !bm || !bd) return null;
  const birth = new Date(by, bm - 1, bd);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
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

export interface GeneratePdfOptions {
  profile: BabyProfile;
  summary: ReportDataSummary;
  selectedSections: ReportSectionsSelection;
  includeTimeline: boolean;
}

/**
 * Builds the jsPDF document and returns both the jsPDF instance and suggested filename
 */
export function createReportPdfDocument({
  profile,
  summary,
  selectedSections,
  includeTimeline,
}: GeneratePdfOptions): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  const babyName = sanitizePdfText(profile.name || 'Bebê');
  const periodLabel =
    summary.startDate === summary.endDate
      ? formatShortDate(summary.startDate, true)
      : `${formatShortDate(summary.startDate, true)} a ${formatShortDate(summary.endDate, true)} (${summary.daysCount} dias)`;

  const now = new Date();
  const generatedAt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} as ${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  let y = 16;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = 18;
    }
  };

  // ===================== 1. HEADER BANNER =====================
  doc.setFillColor(36, 71, 61); // #24473D forest green
  doc.roundedRect(marginX, y, contentWidth, 28, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Relatorio do Diario - ${babyName}`, marginX + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(220, 233, 223);
  doc.text(`Periodo: ${periodLabel}`, marginX + 6, y + 17);

  const ageStr = formatBabyAge(profile.birthDate);
  const birthFmt = profile.birthDate ? formatShortDate(profile.birthDate, true) : '';
  const metaRight = birthFmt
    ? `Nascimento: ${birthFmt}${ageStr ? ` (${ageStr})` : ''}`
    : `Gerado em ${generatedAt}`;
  doc.setFontSize(8.5);
  doc.text(sanitizePdfText(metaRight), marginX + 6, y + 23);

  doc.text(`Gerado em ${generatedAt}`, pageWidth - marginX - 6, y + 23, { align: 'right' });

  y += 35;

  // Included categories line
  const includedLabels: string[] = [];
  if (selectedSections.peito) includedLabels.push('Peito');
  if (selectedSections.mamadeira) includedLabels.push('Mamadeira');
  if (selectedSections.sono) includedLabels.push('Sono');
  if (selectedSections.fralda) includedLabels.push('Fraldas');
  if (selectedSections.nota) includedLabels.push('Anotacoes');
  if (selectedSections.alertas) includedLabels.push('Dias de Alerta');
  if (selectedSections.remedio) includedLabels.push('Remedios/Vitaminas');
  if (selectedSections.vacina) includedLabels.push('Vacinas');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Itens incluidos: ${includedLabels.join(' - ')}`, marginX, y);
  y += 6;

  // ===================== 2. RESUMO GERAL (KPI GRID) =====================
  const kpiCards: Array<{
    title: string;
    value: string;
    detail1: string;
    detail2: string;
    accent: [number, number, number];
  }> = [];

  if (selectedSections.peito) {
    kpiCards.push({
      title: 'MAMADAS NO PEITO',
      value: `${summary.peito.total}`,
      detail1: `Esq: ${summary.peito.esquerdo}  |  Dir: ${summary.peito.direito}  |  Ambos: ${summary.peito.ambos}`,
      detail2: `Media: ${summary.peito.avgPerDay.toFixed(1).replace('.', ',')} por dia`,
      accent: [36, 71, 61],
    });
  }

  if (selectedSections.mamadeira) {
    kpiCards.push({
      title: 'MAMADEIRA',
      value: `${summary.mamadeira.total} (${summary.mamadeira.totalMl} ml)`,
      detail1:
        summary.mamadeira.measuredCount > 0
          ? `Media por mamadeira: ${summary.mamadeira.avgMlPerBottle} ml`
          : 'Sem volume informado',
      detail2:
        summary.mamadeira.unmeasuredCount > 0
          ? `Media diaria: ${summary.mamadeira.avgMlPerDay} ml (${summary.mamadeira.unmeasuredCount} s/ vol.)`
          : `Media diaria: ${summary.mamadeira.avgMlPerDay} ml/dia`,
      accent: [180, 83, 9],
    });
  }

  if (selectedSections.sono) {
    kpiCards.push({
      title: 'SONO',
      value: formatDuration(summary.sono.totalMinutes),
      detail1: `${summary.sono.totalSessions} ${summary.sono.totalSessions === 1 ? 'registro de sono' : 'registros de sono'}`,
      detail2: `Media diaria: ${formatDuration(summary.sono.avgMinutesPerDay)}/dia`,
      accent: [67, 56, 202],
    });
  }

  if (selectedSections.fralda) {
    kpiCards.push({
      title: 'TROCAS DE FRALDA',
      value: `${summary.fralda.total}`,
      detail1: `Xixi: ${summary.fralda.xixi}  |  Coco: ${summary.fralda.coco}  |  Ambos: ${summary.fralda.ambos}`,
      detail2: `Media: ${summary.fralda.avgPerDay.toFixed(1).replace('.', ',')} por dia`,
      accent: [161, 98, 7],
    });
  }

  if (kpiCards.length > 0) {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Resumo do Periodo', marginX, y);
    y += 4;

    const colGap = 5;
    const cardW = (contentWidth - colGap) / 2;
    const cardH = 26;

    for (let i = 0; i < kpiCards.length; i += 2) {
      ensureSpace(cardH + 5);
      const rowItems = kpiCards.slice(i, i + 2);

      rowItems.forEach((card, idx) => {
        const x = marginX + idx * (cardW + colGap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(card.accent[0], card.accent[1], card.accent[2]);
        doc.text(card.title, x + 4.5, y + 6.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizePdfText(card.value), x + 4.5, y + 13.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(sanitizePdfText(card.detail1), x + 4.5, y + 19);
        doc.text(sanitizePdfText(card.detail2), x + 4.5, y + 23.2);
      });

      y += cardH + 4.5;
    }

    y += 2;
  }

  // ===================== 3. DIAS DE ALERTA =====================
  if (selectedSections.alertas && summary.alertas.total > 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Dias Sinalizados no Calendario (${summary.alertas.total})`, marginX, y);
    y += 5;

    for (const item of summary.alertas.items) {
      ensureSpace(9);
      const isRed = item.color === 'vermelho';
      doc.setFillColor(isRed ? 254 : 254, isRed ? 242 : 249, isRed ? 242 : 195);
      doc.setDrawColor(isRed ? 244 : 245, isRed ? 63 : 158, isRed ? 94 : 11);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, 7.5, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isRed ? 190 : 146, isRed ? 18 : 64, isRed ? 60 : 14);
      const label = isRed ? 'ALERTA VERMELHO (Dia Perigoso)' : 'ALERTA AMARELO (Dia de Atencao)';
      doc.text(`${formatFullPtDate(item.date)}  -  ${label}`, marginX + 3.5, y + 5);
      y += 9;
    }
    y += 3;
  }

  // ===================== 3B. REMÉDIOS / VITAMINAS =====================
  if (selectedSections.remedio && summary.remedio.total > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Remedios e Vitaminas (${summary.remedio.total})`, marginX, y);
    y += 5;

    for (const med of summary.remedio.records) {
      ensureSpace(9);
      doc.setFillColor(236, 254, 255);
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, 7.5, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(14, 116, 144);
      const timeStr = med.time ? ` as ${format24hTime(med.time)}` : '';
      const desc = med.notes ? `${med.name} (${med.notes})` : med.name;
      doc.text(
        sanitizePdfText(`${formatShortDate(med.date, true)}${timeStr}  -  ${desc}`),
        marginX + 3.5,
        y + 5
      );
      y += 9;
    }
    y += 3;
  }

  // ===================== 3C. VACINAS =====================
  if (selectedSections.vacina && summary.vacina.total > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Vacinas Registradas (${summary.vacina.total})`, marginX, y);
    y += 5;

    for (const vac of summary.vacina.records) {
      ensureSpace(9);
      doc.setFillColor(245, 243, 255);
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, 7.5, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(109, 40, 217);
      const timeStr = vac.time ? ` as ${format24hTime(vac.time)}` : '';
      const desc = vac.notes ? `${vac.name} (${vac.notes})` : vac.name;
      doc.text(
        sanitizePdfText(`${formatShortDate(vac.date, true)}${timeStr}  -  ${desc}`),
        marginX + 3.5,
        y + 5
      );
      y += 9;
    }
    y += 3;
  }

  // ===================== 4. ANOTAÇÕES =====================
  if (selectedSections.nota && summary.nota.total > 0) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Anotacoes do Periodo (${summary.nota.total})`, marginX, y);
    y += 5;

    for (const note of summary.nota.records) {
      const cleanContent = sanitizePdfText(note.content);
      const lines = doc.splitTextToSize(cleanContent, contentWidth - 8) as string[];
      const boxHeight = 9 + lines.length * 4.4;
      ensureSpace(boxHeight + 3);

      doc.setFillColor(250, 250, 249);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, boxHeight, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(36, 71, 61);
      const timeSuffix = note.time ? ` as ${format24hTime(note.time)}` : '';
      const favTag = note.isFavorite ? ' [FAVORITA]' : '';
      doc.text(
        sanitizePdfText(`${formatFullPtDate(note.date)}${timeSuffix}${favTag}`),
        marginX + 4,
        y + 5.2
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(30, 41, 59);
      doc.text(lines, marginX + 4, y + 10);

      y += boxHeight + 3;
    }
    y += 2;
  }

  // ===================== 5. DETALHAMENTO DIA A DIA =====================
  if (includeTimeline) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Detalhamento Dia a Dia', marginX, y);
    y += 5.5;

    if (summary.days.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum registro encontrado para os itens e periodo selecionados.', marginX, y + 2);
      y += 8;
    } else {
      for (const dayGroup of summary.days) {
        ensureSpace(16);

        // Day subheader bar
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(marginX, y, contentWidth, 7.5, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizePdfText(formatFullPtDate(dayGroup.date)), marginX + 3.5, y + 5.1);

        if (dayGroup.alertColor) {
          const isRed = dayGroup.alertColor === 'vermelho';
          doc.setFontSize(8);
          doc.setTextColor(isRed ? 190 : 146, isRed ? 18 : 64, isRed ? 60 : 14);
          doc.text(
            isRed ? 'ALERTA VERMELHO' : 'ALERTA AMARELO',
            pageWidth - marginX - 3.5,
            y + 5.1,
            { align: 'right' }
          );
        }
        y += 9.5;

        if (dayGroup.entries.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.2);
          doc.setTextColor(100, 116, 139);
          doc.text('Sem registros das categorias selecionadas nesta data.', marginX + 3.5, y + 2);
          y += 6;
        } else {
          for (const entry of dayGroup.entries) {
            const descLines = doc.splitTextToSize(
              sanitizePdfText(entry.summary),
              contentWidth - 44
            ) as string[];
            const rowH = Math.max(5.8, descLines.length * 4.2 + 1.5);
            ensureSpace(rowH + 1.5);

            // Time column
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.3);
            doc.setTextColor(71, 85, 105);
            doc.text(format24hTime(entry.time), marginX + 3.5, y + 3.6);

            // Category column
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(36, 71, 61);
            doc.text(sanitizePdfText(entry.categoryLabel), marginX + 18, y + 3.6);

            // Details column
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            doc.text(descLines, marginX + 44, y + 3.6);

            // Subtle hairline divider
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.2);
            doc.line(marginX + 2, y + rowH, pageWidth - marginX - 2, y + rowH);

            y += rowH + 0.8;
          }
        }

        y += 3;
      }
    }
  }

  // ===================== PAGE FOOTERS =====================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Diario de ${babyName} - Relatorio de Rotina`, marginX, pageHeight - 8.5);
    doc.text(`Pagina ${p} de ${totalPages}`, pageWidth - marginX, pageHeight - 8.5, {
      align: 'right',
    });
  }

  const safeSlug = babyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const rangeSlug =
    summary.startDate === summary.endDate
      ? summary.startDate
      : `${summary.startDate}_a_${summary.endDate}`;
  const filename = `relatorio-${safeSlug || 'bebe'}-${rangeSlug}.pdf`;

  return { doc, filename };
}
