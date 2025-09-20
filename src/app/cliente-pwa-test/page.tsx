'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, Wifi, Settings } from 'lucide-react';

export default function ClientePWATestPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    // Detectar si ya está instalado
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Capturar beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('📱 PWA instalable detectado');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Información del dispositivo
    setDeviceInfo({
      isAndroid: /Android/.test(navigator.userAgent),
      isChrome: /Chrome/.test(navigator.userAgent),
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      userAgent: navigator.userAgent
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA instalado');
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Error instalando:', error);
    }
  };

  const loadTestScript = () => {
    const script = document.createElement('script');
    script.src = '/android-pwa-test.js';
    document.head.appendChild(script);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-green-400" />
          <h1 className="text-3xl font-bold mb-4">¡PWA Instalado! 🎉</h1>
          <p className="text-lg text-green-200 mb-6">
            Lealta está ejecutándose como una app nativa
          </p>
          <div className="bg-green-800/50 rounded-lg p-4">
            <p className="text-sm">
              ✅ Modo standalone activo<br/>
              ✅ Icono en pantalla de inicio<br/>
              ✅ Experiencia de app nativa
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold mb-2">Lealta PWA Test</h1>
          <p className="text-gray-300">Prueba de instalación PWA para cliente móvil</p>
        </div>

        {deviceInfo && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Información del Dispositivo
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Android:</span>
                <span className={deviceInfo.isAndroid ? 'text-green-400' : 'text-red-400'}>
                  {deviceInfo.isAndroid ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Chrome:</span>
                <span className={deviceInfo.isChrome ? 'text-green-400' : 'text-red-400'}>
                  {deviceInfo.isChrome ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Móvil:</span>
                <span className={deviceInfo.isMobile ? 'text-green-400' : 'text-red-400'}>
                  {deviceInfo.isMobile ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {installPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Download className="w-6 h-6" />
              Instalar Lealta App
            </button>
          ) : (
            <div className="bg-yellow-800/50 border border-yellow-600 rounded-lg p-4">
              <h3 className="font-bold text-yellow-200 mb-2">PWA no disponible aún</h3>
              <div className="text-sm text-yellow-100 space-y-1">
                <p>• Navega por el sitio durante 30+ segundos</p>
                <p>• Interactúa con diferentes secciones</p>
                <p>• En Chrome Android: Menú → "Agregar a pantalla de inicio"</p>
              </div>
            </div>
          )}

          <button
            onClick={loadTestScript}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Wifi className="w-5 h-5" />
            Ejecutar Diagnóstico Completo
          </button>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold mb-2">¿Qué es PWA?</h3>
            <p className="text-sm text-gray-300">
              Progressive Web App permite instalar Lealta como una app nativa en tu móvil, 
              con icono en pantalla de inicio y experiencia sin navegador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
