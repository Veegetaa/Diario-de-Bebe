'use client';

import React from 'react';
import { BabyProvider, useBaby } from '@/context/BabyContext';
import { Header } from '@/components/Header';
import { QuickCalendarDropdown } from '@/components/QuickCalendarDropdown';
import { SummaryCard } from '@/components/SummaryCard';
import { ActionShortcuts } from '@/components/ActionShortcuts';
import { DayNoteBox } from '@/components/DayNoteBox';
import { ForgottenRecordBox } from '@/components/ForgottenRecordBox';
import { Timeline } from '@/components/Timeline';
import { CalendarTab } from '@/components/CalendarTab';
import { MyBabyTab } from '@/components/MyBabyTab';
import { SearchTab } from '@/components/SearchTab';
import { ReportsTab } from '@/components/ReportsTab';
import { BottomNav } from '@/components/BottomNav';
import { UndoToast } from '@/components/UndoToast';
import { RecordDetailModal } from '@/components/RecordDetailModal';
import { StarrySky } from '@/components/StarrySky';

// Bottom Sheets
import { BreastfeedingSheet } from '@/components/sheets/BreastfeedingSheet';
import { BottleSheet } from '@/components/sheets/BottleSheet';
import { SleepSheet } from '@/components/sheets/SleepSheet';
import { DiaperSheet } from '@/components/sheets/DiaperSheet';
import { NoteSheet } from '@/components/sheets/NoteSheet';
import { EditRecordSheet } from '@/components/sheets/EditRecordSheet';
import { ProfileSheet } from '@/components/sheets/ProfileSheet';
import { AuthSheet } from '@/components/sheets/AuthSheet';
import { ForgottenRecordSheet } from '@/components/sheets/ForgottenRecordSheet';
import { CalendarDayRegisterSheet } from '@/components/sheets/CalendarDayRegisterSheet';
import { PullToRefresh } from '@/components/PullToRefresh';

function MainAppContent() {
  const { currentTab } = useBaby();

  return (
    <div className="min-h-screen w-full overflow-x-clip relative flex flex-col bg-[#FFF8FA] dark:bg-[#121224] text-[#542639] dark:text-slate-100 transition-colors duration-300">
      {/* Night Sky Starfield (dark theme only) */}
      <StarrySky />

      {/* Top Header */}
      <Header />

      {/* Quick Calendar Dropdown below header if opened */}
      <QuickCalendarDropdown />

      {/* Pull To Refresh Mobile Wrapper */}
      <PullToRefresh>
        {/* Main Tab Content */}
        <main className="relative z-10 flex-1 w-full max-w-xl mx-auto px-4 pb-20">
        {currentTab === 'hoje' && (
          <div className="pt-3 animate-in fade-in-50 duration-150 space-y-3">
            {/* Daily summary: sleep state & today's date */}
            <SummaryCard />

            {/* 4 large shortcuts: Peito, Mamadeira, Sono/Acordar, Fralda */}
            <ActionShortcuts />

            {/* 24h Chronological Timeline */}
            <Timeline />

            {/* "Como foi o dia?" free text box (moved to the bottom as requested) */}
            <DayNoteBox />

            {/* "Registro Esquecido" with date, time and description */}
            <ForgottenRecordBox />
          </div>
        )}

        {currentTab === 'calendario' && (
          <div className="animate-in fade-in-50 duration-150">
            <CalendarTab />
          </div>
        )}

        {currentTab === 'meu_bebe' && (
          <div className="animate-in fade-in-50 duration-150">
            <MyBabyTab />
          </div>
        )}

        {currentTab === 'buscar' && (
          <div className="animate-in fade-in-50 duration-150">
            <SearchTab />
          </div>
        )}

        {currentTab === 'relatorios' && (
          <div className="animate-in fade-in-50 duration-150">
            <ReportsTab />
          </div>
        )}
      </main>
      </PullToRefresh>

      {/* Floating Undo Toast (lower thumb zone) */}
      <UndoToast />

      {/* Persistent Bottom Navigation */}
      <BottomNav />

      {/* Modals & Action Sheets */}
      <BreastfeedingSheet />
      <BottleSheet />
      <SleepSheet />
      <DiaperSheet />
      <NoteSheet />
      <EditRecordSheet />
      <ProfileSheet />
      <AuthSheet />
      <ForgottenRecordSheet />
      <CalendarDayRegisterSheet />
      <RecordDetailModal />
    </div>
  );
}

export default function BabyApp() {
  return (
    <BabyProvider>
      <MainAppContent />
    </BabyProvider>
  );
}
