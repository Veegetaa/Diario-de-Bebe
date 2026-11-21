'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Check, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export function PWAInstallButton({ variant = 'compact' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running standalone as an installed app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      // If iOS or if Android/Chrome hasn't fired prompt yet, show guided guide
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleClick}
          className="flex items-center justify-center sm:gap-1.5 w-8 h-8 sm:w-auto sm:h-9 sm:px-2.5 rounded-full text-xs font-medium bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800/60 hover:bg-amber-200/80 active:scale-95 transition-all shrink-0 shadow-2xs cursor-pointer"
          title="Instalar na tela inicial"
          aria-label="Instalar na tela inicial (PWA)"
        >
          {installSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Download className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 stroke-[2.2] shrink-0" />
          )}
          <span className="hidden sm:inline font-medium">Instalar</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 border border-amber-300/60 dark:border-amber-800/60 flex items-center justify-between text-xs font-semibold text-amber-950 dark:text-amber-200 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 dark:bg-amber-800/50 flex items-center justify-center text-amber-900 dark:text-amber-200">
              <Download className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Instalar na Tela Inicial</span>
              <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-normal">
                Use como aplicativo sem barra do navegador
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-700">
            Instalar
          </span>
        </button>
      )}

      {/* Guided Installation Modal (for iOS Safari & manual browser fallback) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowIOSModal(false)}
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a1a33] p-5 shadow-2xl border border-stone-200 dark:border-slate-800 z-10 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-emerald-300 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3
                  id="pwa-install-title"
                  className="font-serif font-bold text-base text-slate-800 dark:text-slate-100"
                >
                  Instalar no Celular
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
                <p className="leading-relaxed">
                  Para instalar no seu <strong>iPhone ou iPad</strong>:
                </p>
                <div className="space-y-2 p-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200/70 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-stone-200/80 dark:bg-slate-800 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-200 font-bold text-xs">
                      1
                    </div>
                    <div className="flex-1 leading-snug">
                      Toque no botão <strong>Compartilhar</strong> na barra do Safari (ícone de quadrado com seta para cima: <Share className="w-3.5 h-3.5 inline text-blue-500" />).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1 border-t border-stone-200/50 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-stone-200/80 dark:bg-slate-800 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-200 font-bold text-xs">
                      2
                    </div>
                    <div className="flex-1 leading-snug">
                      Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-stone-600 dark:text-stone-300" />).
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 text-center">
                  O Diário do Bebê abrirá como um aplicativo normal em tela cheia!
                </p>
              </div>
            ) : (
              /* Android / Other Browser Instructions */
              <div className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
                <p className="leading-relaxed">
                  Para instalar no seu <strong>Android</strong>:
                </p>
                <div className="space-y-2 p-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200/70 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-stone-200/80 dark:bg-slate-800 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-200 font-bold text-xs">
                      1
                    </div>
                    <div className="flex-1 leading-snug">
                      Toque no menu do navegador (os <strong>três pontinhos ⋮</strong> no canto superior).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1 border-t border-stone-200/50 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-stone-200/80 dark:bg-slate-800 flex items-center justify-center shrink-0 text-stone-700 dark:text-stone-200 font-bold text-xs">
                      2
                    </div>
                    <div className="flex-1 leading-snug">
                      Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
