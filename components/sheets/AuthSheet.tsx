'use client';

import React, { useState } from 'react';
import { useBaby } from '@/context/BabyContext';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CloudCheck,
  ShieldCheck,
  Smartphone,
  LogOut,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  RotateCw,
} from 'lucide-react';

export function AuthSheet() {
  const {
    activeSheet,
    closeSheet,
    authUser,
    loginEmail,
    registerEmail,
    loginGoogle,
    logout,
    resetUserPassword,
    isCloudConnected,
    records,
    refreshData,
    isManualRefreshing,
  } = useBaby();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (activeSheet !== 'sync' && activeSheet !== 'profile') {
    // We render inside activeSheet === 'sync'
  }

  if (activeSheet !== 'sync') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || (!password && mode !== 'forgot')) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Erro ao fazer login.');
        } else {
          setSuccessMessage('Login realizado com sucesso! Sincronizando dados...');
          setTimeout(() => closeSheet(), 1200);
        }
      } else if (mode === 'register') {
        const res = await registerEmail(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Erro ao criar conta.');
        } else {
          setSuccessMessage('Conta criada com sucesso! Seus dados já estão salvos na nuvem.');
          setTimeout(() => closeSheet(), 1200);
        }
      } else if (mode === 'forgot') {
        const res = await resetUserPassword(email);
        if (!res.success) {
          setErrorMessage(res.error || 'Erro ao enviar e-mail de recuperação.');
        } else {
          setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await loginGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao entrar com Google.');
      } else {
        setSuccessMessage('Conectado com sucesso!');
        setTimeout(() => closeSheet(), 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="fixed inset-0" onClick={closeSheet} aria-hidden="true" />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a33] rounded-t-3xl border-t border-stone-200 dark:border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 pb-safe max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-sheet-title"
      >
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#DCE9DF] dark:bg-[#24473D] text-[#24473D] dark:text-emerald-300 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="auth-sheet-title"
                className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight"
              >
                {authUser ? 'Conta da Família Conectada' : 'Sincronização & Login'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {authUser
                  ? 'Dados sincronizados em tempo real na nuvem'
                  : 'Acesse em mais de um celular e proteja seus registros'}
              </p>
            </div>
          </div>

          <button
            onClick={closeSheet}
            className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== LOGGED IN STATE ===================== */}
        {authUser ? (
          <div className="space-y-4">
            {/* Status card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-[#1a1a33] dark:to-emerald-950/20 border border-emerald-300/80 dark:border-emerald-800/80 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CloudCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      Sincronização Ativa
                    </span>
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {authUser.email || 'Conta Conectada'}
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                      {records.length} {records.length === 1 ? 'registro salvo' : 'registros salvos'} na nuvem
                    </span>
                  </div>
                </div>

                {/* Instant Sync Button */}
                <button
                  onClick={async () => {
                    await refreshData();
                    setSuccessMessage('Sincronizado com a nuvem agora!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  disabled={isManualRefreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#24473D] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0"
                  title="Forçar sincronização com o outro aparelho agora"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span>{isManualRefreshing ? 'Sincronizando…' : 'Sincronizar'}</span>
                </button>
              </div>

              {successMessage && (
                <div className="mt-3 p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs text-center font-semibold animate-in fade-in">
                  {successMessage}
                </div>
              )}
            </div>

            {/* Verification of device parity */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 text-xs text-stone-600 dark:text-stone-300 space-y-2.5">
              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#24473D] dark:text-emerald-400" />
                  Conexão entre iPhones / Celulares:
                </span>
                {authUser.email && (
                  <button
                    onClick={() => {
                      if (authUser.email) {
                        navigator.clipboard?.writeText(authUser.email);
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2500);
                      }
                    }}
                    className="text-[11px] text-[#24473D] dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedEmail ? 'Copiado!' : 'Copiar e-mail'}</span>
                  </button>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                <strong className="block font-bold mb-1">
                  ⚠️ Importante para atualizarem entre si:
                </strong>
                Ambos os aparelhos <strong>devem estar logados com o mesmo e-mail</strong>:{' '}
                <span className="font-mono font-bold bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded">
                  {authUser.email}
                </span>
                . Se o outro iPhone estiver desconectado ou logado com outro e-mail, os dados não se comunicam.
              </div>

              <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
                <li>
                  No outro iPhone, abra o aplicativo e toque no ícone de sincronização no topo.
                </li>
                <li>
                  Confira se o e-mail que aparece é <strong>{authUser.email}</strong>.
                </li>
                <li>
                  Se não for, saia da conta e entre com <strong>{authUser.email}</strong> e sua senha.
                </li>
              </ol>
            </div>

            {/* Backup guarantee info */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
              <p className="text-[11px] leading-relaxed">
                <strong>Proteção contra perda do celular:</strong> Todos os seus registros estão salvos na nuvem. Se você trocar de aparelho, basta entrar com seu e-mail e senha para recuperar todo o histórico.
              </p>
            </div>

            {/* Logout button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={closeSheet}
                className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
              >
                Voltar ao Diário
              </button>

              <button
                type="button"
                onClick={logout}
                className="py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair desta conta</span>
              </button>
            </div>
          </div>
        ) : (
          /* ===================== NOT LOGGED IN (AUTH FORM) ===================== */
          <div className="space-y-4">
            {/* Mode toggle tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1a1a33] text-[#24473D] dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#1a1a33] text-[#24473D] dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Explanatory value proposition */}
            <div className="p-3.5 rounded-2xl bg-[#DCE9DF]/40 dark:bg-[#24473D]/20 border border-[#DCE9DF] dark:border-emerald-800/50 text-xs text-slate-800 dark:text-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#24473D] dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>{mode === 'register' ? 'Por que criar uma conta?' : 'Acesso da Família'}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                Você e sua esposa usam <strong>o mesmo e-mail e senha</strong> em celulares diferentes. Os dados são sincronizados em tempo real e ficam salvos caso alguém perca o celular!
              </p>
            </div>

            {/* Error & Success alerts */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span className="leading-snug font-medium">{errorMessage}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2 animate-in fade-in-50">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail da Família
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: familia.bebe@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Senha {mode === 'register' ? '(mínimo 6 dígitos)' : ''}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setErrorMessage(null);
                        }}
                        className="text-[11px] text-[#24473D] dark:text-emerald-400 hover:underline"
                      >
                        Esqueci a senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#24473D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="w-8 h-8 absolute right-1.5 top-1.5 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#24473D] dark:bg-emerald-600 hover:bg-[#1b352d] dark:hover:bg-emerald-500 text-white font-serif font-bold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
              >
                {loading ? (
                  <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>
                      {mode === 'login'
                        ? 'Entrar e Sincronizar'
                        : mode === 'register'
                        ? 'Criar Conta e Salvar Dados'
                        : 'Enviar Link de Recuperação'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 py-1"
              >
                Voltar para o login
              </button>
            )}

            {/* Google Login Option */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-stone-400">
                <span className="bg-white dark:bg-[#1a1a33] px-2">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs flex items-center justify-center gap-2.5 shadow-2xs active:scale-98 transition-all disabled:opacity-60 cursor-pointer min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google (1 clique)</span>
            </button>

            {/* Offline continue */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={closeSheet}
                className="text-[11px] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 underline"
              >
                Continuar usando sem conta por enquanto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
