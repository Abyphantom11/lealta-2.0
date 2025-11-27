import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import NotificationContainer from '@/components/ui/NotificationContainer';
import RedirectInterceptor from '../components/RedirectInterceptor';
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration';
import { PWAProvider } from '../providers/PWAProvider';
import { QueryProvider } from '../providers/QueryProvider';
import { AuthProvider } from '../providers/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'lealta - Premium Customer Experience',
  description:
    'Sistema de captación y control de clientes para bares, restaurantes y discotecas',
  keywords: ['lealta', 'restaurant', 'bar', 'customer', 'loyalty'],
  authors: [{ name: 'lealta Team' }],
  // manifest: '/manifest.json', // Removido - se configurará dinámicamente
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'lealta 2.0',
    // startupImage: '/icons/icon-512x512.png',
  },
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="msapplication-navbutton-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Lealta" />
        <meta name="application-name" content="Lealta" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* Permissions Policy para acceso a cámara */}
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=()" />
        
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <PWAProvider enableDebugLogs={false}>
              <ServiceWorkerRegistration />
              <RedirectInterceptor />
              <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black">
                {children}
                <NotificationContainer />
              </div>
            </PWAProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
