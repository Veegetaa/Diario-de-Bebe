'use client';

import React from 'react';
import { BabyRecord } from '@/lib/types';
import { useBaby } from '@/context/BabyContext';
import {
  format24hTime,
  formatDuration,
} from '@/lib/date-utils';
import { Heart, Milk, Moon, Sparkles, Edit3, Star, ChevronRight } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

interface RecordCardProps {
  record: BabyRecord;
}

export function RecordCard({ record }: RecordCardProps) {
  const { setViewingRecord, toggleFavoriteNote } = useBaby();

  const handleCardClick = () => {
    setViewingRecord(record);
  };

  const getRecordTime = (): string => {
    if (record.type === 'sono') {
      return format24hTime(record.endTime || record.startTime);
    }
    if (record.time) {
      return format24hTime(record.time);
    }
    const d = new Date(record.createdAt);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}h${m}`;
  };

  if (record.type === 'peito') {
    const sideLabel =
      record.side === 'esquerdo'
        ? 'Esquerdo'
        : record.side === 'direito'
        ? 'Direito'
        : 'Ambos os peitos';
    return (
      <div
        onClick={handleCardClick}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-50/90 dark:hover:bg-[#20203f] border border-stone-300 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E7F1E9] to-[#DCE9DF] dark:from-[#23382b] dark:to-[#1b2b21] flex items-center justify-center shrink-0 shadow-2xs border border-emerald-900/10 dark:border-emerald-400/20 group-hover:scale-105 transition-transform p-2">
            <CategoryIcon category="peito" size={24} />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Peito</span>
              <span className="text-stone-300 dark:text-stone-600 font-sans font-normal">·</span>
              <span className="text-[#24473D] dark:text-emerald-300 font-sans font-semibold">
                {sideLabel}
              </span>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Mamada pontual
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tabular-nums border border-stone-200/50 dark:border-slate-700/60 shadow-2xs">
            {getRecordTime()}
          </span>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>
    );
  }

  if (record.type === 'mamadeira') {
    const hasVolume = record.volumeMl !== null;
    return (
      <div
        onClick={handleCardClick}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-50/90 dark:hover:bg-[#20203f] border border-stone-300 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FCECE4] to-[#F6E3D9] dark:from-[#3d2a21] dark:to-[#302019] flex items-center justify-center shrink-0 shadow-2xs border border-orange-900/10 dark:border-orange-400/20 group-hover:scale-105 transition-transform p-2">
            <CategoryIcon category="mamadeira" size={24} />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Mamadeira</span>
              <span className="text-stone-300 dark:text-stone-600 font-sans font-normal">·</span>
              <span className="font-sans font-semibold text-orange-950 dark:text-orange-200">
                {hasVolume ? `${record.volumeMl} ml` : 'Sem volume'}
              </span>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {hasVolume ? 'Volume registrado' : 'Quantidade não medida'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tabular-nums border border-stone-200/50 dark:border-slate-700/60 shadow-2xs">
            {getRecordTime()}
          </span>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>
    );
  }

  if (record.type === 'sono') {
    const startFmt = format24hTime(record.startTime);
    const endFmt = format24hTime(record.endTime);
    return (
      <div
        onClick={handleCardClick}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-50/90 dark:hover:bg-[#20203f] border border-stone-300 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F2ECF7] to-[#EAE3F2] dark:from-[#312543] dark:to-[#241a34] flex items-center justify-center shrink-0 shadow-2xs border border-purple-900/10 dark:border-purple-400/20 group-hover:scale-105 transition-transform p-2">
            <CategoryIcon category="sono" size={24} />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
              Sono concluído
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-snug">
              Dormiu {startFmt} · Acordou {endFmt}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 tabular-nums border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
            {formatDuration(record.durationMinutes)}
          </span>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>
    );
  }

  if (record.type === 'fralda') {
    let diaperName = 'Troca de fralda';
    if (record.diaperType === 'xixi') diaperName = 'Xixi';
    else if (record.diaperType === 'coco') diaperName = 'Cocô';
    else if (record.diaperType === 'ambos') diaperName = 'Xixi e Cocô (Ambos)';

    return (
      <div
        onClick={handleCardClick}
        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-50/90 dark:hover:bg-[#20203f] border border-stone-300 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F7F1E4] to-[#F1E9D8] dark:from-[#3a3224] dark:to-[#2e261a] flex items-center justify-center shrink-0 shadow-2xs border border-amber-900/10 dark:border-amber-400/20 group-hover:scale-105 transition-transform p-2">
            <CategoryIcon category="fralda" size={24} />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Fralda</span>
              <span className="text-stone-300 dark:text-stone-600 font-sans font-normal">·</span>
              <span className="font-sans font-semibold text-amber-950 dark:text-amber-200">
                {diaperName}
              </span>
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Higiene e troca
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 tabular-nums border border-stone-200/50 dark:border-slate-700/60 shadow-2xs">
            {getRecordTime()}
          </span>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>
    );
  }

  if (record.type === 'nota') {
    return (
      <div
        onClick={handleCardClick}
        className="w-full flex items-start justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1a1a33] hover:bg-stone-50/90 dark:hover:bg-[#20203f] border border-stone-300 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] active:scale-[0.99] transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/60 dark:to-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-amber-900/10 dark:border-amber-400/20 group-hover:scale-105 transition-transform">
            <Edit3 className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Anotação</span>
              <span className="font-sans text-xs font-normal text-stone-400 tabular-nums">
                {getRecordTime()}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {record.content}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteNote(record.id);
            }}
            className="p-2 -mr-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-amber-500 transition-colors"
            aria-label={record.isFavorite ? 'Remover dos favoritos' : 'Favoritar anotação'}
          >
            <Star
              className={`w-4 h-4 ${
                record.isFavorite
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-stone-300 dark:text-stone-600'
              }`}
            />
          </button>
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 transition-colors" />
        </div>
      </div>
    );
  }

  return null;
}
