'use client';

import dynamic from 'next/dynamic';

const BabyApp = dynamic(() => import('@/components/BabyApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8FA] dark:bg-[#121224]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#FCE7EF] dark:bg-[#24473D] animate-pulse flex items-center justify-center text-[#D64D83] dark:text-[#DCE9DF] font-serif font-bold text-lg">
          D
        </div>
        <span className="font-serif font-bold text-sm text-[#886576] dark:text-stone-300">
          Carregando Diário do Bebê…
        </span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <BabyApp />;
}
