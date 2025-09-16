import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ElectronProvider } from '../components/ElectronProvider';
import NotificationContainer from '@/components/ui/NotificationContainer';
import RedirectInterceptor from '../components/RedirectInterceptor';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'lealta - Premium Customer Experience',
  description:
    'Sistema de captación y control de clientes para bares, restaurantes y discotecas',
  keywords: ['lealta', 'restaurant', 'bar', 'customer', 'loyalty'],
  authors: [{ name: 'lealta Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'lealta 2.0',
    // startupImage: '/icons/icon-512x512.png',
  },
  icons: {
    icon: '/icons/icon-base.svg',
    shortcut: '/icons/icon-base.svg',
    apple: '/icons/icon-base.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'theme-color': '#0f172a',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-navbutton-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ElectronProvider>
          <RedirectInterceptor />
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black">
            {children}
            <NotificationContainer />
          </div>
        </ElectronProvider>
      </body>
    </html>
  );
}
