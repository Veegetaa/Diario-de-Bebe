import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FBF7F1] dark:bg-[#141427] text-slate-800 dark:text-slate-100 text-center">
      <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-[#1a1a33] border border-stone-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-serif font-bold text-xl">
          404
        </div>
        <h1 className="font-serif font-bold text-xl">Página não encontrada</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block py-2.5 px-5 rounded-2xl bg-[#24473D] text-white text-xs font-semibold hover:bg-[#1b352d] transition-all"
        >
          Voltar ao Diário do Bebê
        </Link>
      </div>
    </div>
  );
}
