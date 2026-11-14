'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  X,
  Users,
  Copy,
  Check,
  Share2,
  Cloud,
  CloudCheck,
  RefreshCw,
  ArrowRight,
  LogOut,
  Smartphone,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export function SyncFamilySheet() {
  const {
    activeSheet,
    closeSheet,
    familyCode,
    isCloudConnected,
    isSyncing,
    syncError,
    createOrShareFamilyCode,
    joinFamilyCode,
    disconnectFamilyCode,
  } = useBaby();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (activeSheet !== 'sync') return null;

  const handleCopyCode = async () => {
    if (!familyCode) return;
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard failed, fallback', e);
    }
  };

  const handleShareWhatsApp = () => {
    if (!familyCode) return;
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const message = `👶 *Diário do Bebê compartilhado!*\n\nUse nosso código de família para acompanhar a rotina juntos no seu celular:\n👉 *${familyCode}*\n\nAcesse o diário aqui:\n${appUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCreateCode = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await createOrShareFamilyCode();
    } catch (e) {
      setErrorMessage('Não foi possível registrar o código na nuvem. Verifique sua conexão.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMessage('Digite o código da família.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await joinFamilyCode(inputCode.trim());
      if (res.success) {
        setInputCode('');
      } else {
        setErrorMessage(res.message || 'Código não encontrado.');
      }
    } catch (e) {
      setErrorMessage('Erro ao conectar ao diário na nuvem.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-0" onClick={closeSheet} aria-hidden="true" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-sheet-title"
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-emerald-300 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="sync-sheet-title"
                className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight"
              >
                Sincronizar Celulares
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Acompanhem a rotina do bebê juntos em tempo real
              </p>
            </div>
          </div>

          <button
            onClick={closeSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar painel de sincronização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATE 1: ALREADY CONNECTED TO A FAMILY CODE */}
        {familyCode ? (
          <div className="space-y-4">
            {/* Active Status Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    Conectado em Tempo Real
                  </span>
                  <span className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80">
                    Qualquer registro neste celular aparece no outro imediatamente
                  </span>
                </div>
              </div>
              <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>

            {/* Family Code Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FBF7F1] via-white to-[#F5ECE1] dark:from-[#20203f] dark:via-[#1a1a33] dark:to-[#17172e] border border-stone-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Seu Código de Família
              </span>
              <div className="font-serif font-black text-3xl sm:text-4xl text-[#24473D] dark:text-emerald-300 tracking-widest my-2 select-all">
                {familyCode}
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                Digite este código no celular da sua esposa para que os dois vejam e editem o mesmo diário.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <button
                  onClick={handleCopyCode}
                  className="py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs active:scale-95 transition-all min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-2xs active:scale-95 transition-all min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>

            {/* How-To Instructions */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/60 dark:border-slate-800 text-xs text-stone-600 dark:text-stone-400 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#24473D] dark:text-emerald-400" />
                Como conectar no outro celular:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                <li>Abra o link do Diário do Bebê no celular da sua esposa.</li>
                <li>Toque no ícone de sincronização no topo.</li>
                <li>Escolha <strong>&ldquo;Entrar com código&rdquo;</strong> e digite <strong>{familyCode}</strong>.</li>
              </ol>
            </div>

            {/* Disconnect button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (confirm('Deseja desconectar deste código de família? Seus registros atuais continuam salvos neste aparelho.')) {
                    disconnectFamilyCode();
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar deste código</span>
              </button>
            </div>
          </div>
        ) : (
          /* STATE 2: NOT CONNECTED YET -> CHOOSE CREATE OR JOIN */
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200/60 dark:border-slate-700/60">
              <button
                onClick={() => {
                  setMode('create');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  mode === 'create'
                    ? 'bg-white dark:bg-[#1a1a33] text-[#24473D] dark:text-emerald-300 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                1. Criar Código da Família
              </button>
              <button
                onClick={() => {
                  setMode('join');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  mode === 'join'
                    ? 'bg-white dark:bg-[#1a1a33] text-[#24473D] dark:text-emerald-300 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                2. Já tenho um Código
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {mode === 'create' ? (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FBF7F1] via-white to-[#F5ECE1] dark:from-[#20203f] dark:via-[#1a1a33] dark:to-[#17172e] border border-stone-200/80 dark:border-slate-800 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-emerald-300 flex items-center justify-center mx-auto shadow-2xs">
                  <Sparkles className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                    Primeiro celular a configurar?
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                    Ao criar o código, seus registros atuais são salvos na nuvem e você receberá um código para enviar para sua esposa.
                  </p>
                </div>

                <button
                  onClick={handleCreateCode}
                  disabled={actionLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1b362e] dark:hover:bg-emerald-500 text-white font-serif font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gerando código e enviando dados…</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>Gerar Código da Família</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleJoinCode}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#FBF7F1] via-white to-[#F5ECE1] dark:from-[#20203f] dark:via-[#1a1a33] dark:to-[#17172e] border border-stone-200/80 dark:border-slate-800 space-y-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto shadow-2xs">
                  <Smartphone className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-serif font-bold text-base text-slate-800 dark:text-slate-100">
                    Entrar em um diário existente
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                    Digite o código de família gerado no outro celular para conectar imediatamente.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 text-center">
                    Código de Família
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      setErrorMessage(null);
                    }}
                    placeholder="Ex: BEBE-7492"
                    className="w-full text-center tracking-widest font-serif font-bold text-xl py-3 px-4 rounded-2xl bg-white dark:bg-[#1a1a33] border-2 border-stone-200 dark:border-slate-700 focus:border-[#24473D] dark:focus:border-emerald-400 text-slate-800 dark:text-slate-100 outline-none uppercase"
                    maxLength={20}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !inputCode.trim()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1b362e] dark:hover:bg-emerald-500 text-white font-serif font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all min-h-[48px] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Conectando ao diário…</span>
                    </>
                  ) : (
                    <>
                      <span>Conectar e Sincronizar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
