'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PWADiagnostic {
  isHTTPS: boolean;
  hasManifest: boolean;
  hasServiceWorker: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  userAgent: string;
  displayMode: string;
  manifestData?: any;
}

export default function PWADiagnosticPage() {
  const [diagnostic, setDiagnostic] = useState<PWADiagnostic | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Listener para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('📱 beforeinstallprompt detectado');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const runDiagnostic = async () => {
    const result: PWADiagnostic = {
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorker: 'serviceWorker' in navigator,
      isInstallable: !!installPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    };

    // Verificar manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      try {
        const response = await fetch(manifestLink.href);
        result.manifestData = await response.json();
      } catch (error) {
        console.error('Error cargando manifest:', error);
      }
    }

    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        console.log('SW Registration:', registration);
      } catch (error) {
        console.error('Error con Service Worker:', error);
      }
    }

    setDiagnostic(result);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    setInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log('Resultado instalación:', outcome);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Error instalando PWA:', error);
    }
    setInstalling(false);
  };

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Smartphone className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold">PWA Diagnostic</h1>
          <p className="text-gray-400">Diagnóstico completo del PWA de Lealta</p>
        </div>

        <button
          onClick={runDiagnostic}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg mb-6 flex items-center justify-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          Ejecutar Diagnóstico
        </button>

        {diagnostic && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="font-bold mb-3">Criterios PWA</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>HTTPS/Localhost</span>
                  <StatusIcon status={diagnostic.isHTTPS} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Manifest</span>
                  <StatusIcon status={diagnostic.hasManifest} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Service Worker</span>
                  <StatusIcon status={diagnostic.hasServiceWorker} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Instalable</span>
                  <StatusIcon status={diagnostic.isInstallable} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Ya Instalado</span>
                  <StatusIcon status={diagnostic.isInstalled} />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="font-bold mb-3">Información del Dispositivo</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Móvil:</span> {diagnostic.isMobile ? 'Sí' : 'No'}
                </div>
                <div>
                  <span className="text-gray-400">Display Mode:</span> {diagnostic.displayMode}
                </div>
                <div>
                  <span className="text-gray-400">User Agent:</span>
                  <div className="text-xs mt-1 text-gray-300 break-all">
                    {diagnostic.userAgent}
                  </div>
                </div>
              </div>
            </div>

            {diagnostic.manifestData && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="font-bold mb-3">Datos del Manifest</h2>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-400">Nombre:</span> {diagnostic.manifestData.name}</div>
                  <div><span className="text-gray-400">Start URL:</span> {diagnostic.manifestData.start_url}</div>
                  <div><span className="text-gray-400">Display:</span> {diagnostic.manifestData.display}</div>
                  <div><span className="text-gray-400">Iconos:</span> {diagnostic.manifestData.icons?.length || 0}</div>
                </div>
              </div>
            )}

            {installPrompt && !diagnostic.isInstalled && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Download className={`w-5 h-5 ${installing ? 'animate-bounce' : ''}`} />
                {installing ? 'Instalando...' : 'Instalar PWA'}
              </button>
            )}

            {diagnostic.isInstalled && (
              <div className="bg-green-800 text-green-100 p-4 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">PWA ya instalado</p>
                <p className="text-sm">La app está ejecutándose en modo standalone</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
