import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diário do Bebê · Rotina, Sono e Cuidados',
  description: 'Aplicativo para registrar a rotina do bebê, sono, mamadas e fraldas com histórico, busca e favoritos, desenhado para uso com uma mão.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DiárioBebê',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Diário do Bebê',
    description: 'Acompanhe a rotina do bebê com facilidade e carinho, dia e noite.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diário do Bebê',
    description: 'Acompanhe a rotina do bebê com facilidade e carinho.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#121224',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('diario_do_bebe_theme_override_v1');
                  if (savedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                  var _origFetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                      return _origFetch;
                    },
                    set: function(v) {
                      _origFetch = v;
                    }
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-[#542639] bg-[#FFF8FA] dark:text-slate-100 dark:bg-[#121224] transition-colors duration-300 min-h-screen selection:bg-[#FCE7EF] dark:selection:bg-indigo-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
