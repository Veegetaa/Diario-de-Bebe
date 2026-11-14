'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import { X, Baby, ShieldCheck, Save, Users } from 'lucide-react';
import { PWAInstallButton } from '@/components/PWAInstallButton';

export function ProfileSheet() {
  const { activeSheet, closeSheet, profile, updateProfile, openSheet } = useBaby();

  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [gender, setGender] = useState(profile.gender);

  if (activeSheet !== 'profile') return null;

  const handleSave = () => {
    updateProfile({
      name: name.trim() || 'Bebê',
      birthDate,
      gender,
    });
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
        aria-labelledby="profile-sheet-title"
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-[#DCE9DF] flex items-center justify-center font-bold text-sm">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="profile-sheet-title"
                className="font-serif font-bold text-lg text-slate-800 dark:text-slate-100"
              >
                Perfil do Bebê
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Personalize o nome e as informações da família
              </p>
            </div>
          </div>

          <button
            onClick={closeSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Bebê
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maya, Gael, Olívia…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#24473D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data de Nascimento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-[#15152b] border border-stone-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#24473D]"
            />
          </div>

          {/* Sincronização Familiar Button */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#DCE9DF]/50 to-white dark:from-[#203328]/60 dark:to-[#1a1a33] border border-emerald-900/10 dark:border-emerald-500/20 text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#24473D] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-bold text-xs block text-slate-900 dark:text-slate-100">
                  Sincronizar com Parceiro(a)
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Use o mesmo diário em celulares diferentes
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closeSheet();
                openSheet('sync');
              }}
              className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-[#24473D] dark:text-emerald-300 font-bold text-xs border border-stone-200 dark:border-slate-700 active:scale-95 transition-all shrink-0"
            >
              Abrir
            </button>
          </div>

          {/* PWA Install shortcut */}
          <PWAInstallButton variant="full" />

          {/* Privacy & Cloud explanation */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#15152b] border border-stone-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-stone-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#24473D] dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidade e Segurança Familiar</span>
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-stone-400 text-[11px]">
              Seus registros são protegidos e sincronizados exclusivamente entre os aparelhos conectados com o e-mail e senha da sua família.
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-4 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1a342c] dark:hover:bg-emerald-500 text-white font-serif font-bold text-base flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px]"
        >
          <Save className="w-5 h-5" />
          <span>Salvar perfil</span>
        </button>
      </div>
    </div>
  );
}
