import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { browserNotifications } from '../services/browserNotifications';

interface NotificationButtonProps {
  readonly className?: string;
}

export function NotificationButton({ className = '' }: Readonly<NotificationButtonProps>) {
  const [notificationStatus, setNotificationStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    canShow: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Helper function para determinar las clases CSS del botón
  const getButtonClasses = (isClickable: boolean, notificationStatus: { canShow: boolean }, className: string) => {
    let baseClasses = 'relative px-3 py-2 rounded-lg border transition-all duration-200';
    
    if (isClickable) {
      baseClasses += ' bg-dark-800 border-dark-600 hover:bg-dark-700 hover:border-primary-500 cursor-pointer';
    } else if (notificationStatus.canShow) {
      baseClasses += ' bg-green-900/20 border-green-500/30 cursor-default';
    } else {
      baseClasses += ' bg-dark-800 border-dark-600 cursor-default opacity-75';
    }
    
    return `${baseClasses} ${className}`;
  };

  useEffect(() => {
    setIsClient(true);
    // Actualizar estado inicial solo en el cliente
    if (typeof window !== 'undefined') {
      updateNotificationStatus();
    }
  }, []);

  const updateNotificationStatus = () => {
    const status = browserNotifications.getStatus();
    setNotificationStatus(status);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const granted = await browserNotifications.requestPermissionWithUI();
      
      if (granted) {
        console.log('✅ Notificaciones habilitadas exitosamente');
      }
      
      updateNotificationStatus();
    } catch (error) {
      console.error('❌ Error habilitando notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="hidden sm:inline">Habilitando...</span>
        </div>
      );
    }

    if (!notificationStatus.supported) {
      return (
        <div className="flex items-center space-x-2 opacity-50">
          <BellOff className="w-4 h-4" />
          <span className="hidden sm:inline">No soportado</span>
        </div>
      );
    }

    if (notificationStatus.permission === 'denied') {
      return (
        <div className="flex items-center space-x-2 text-red-400">
          <BellOff className="w-4 h-4" />
          <span className="hidden sm:inline">Bloqueadas</span>
        </div>
      );
    }

    if (notificationStatus.canShow) {
      return (
        <div className="flex items-center space-x-2 text-green-400">
          <Bell className="w-4 h-4" />
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">Activas</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Habilitar</span>
      </div>
    );
  };

  const getTooltipText = () => {
    if (!notificationStatus.supported) {
      return 'Tu navegador no soporta notificaciones';
    }
    if (notificationStatus.permission === 'denied') {
      return 'Notificaciones bloqueadas - ve a configuración del navegador';
    }
    if (notificationStatus.canShow) {
      return 'Notificaciones activas - recibirás alertas de cambios';
    }
    return 'Click para habilitar notificaciones push';
  };

  const isClickable = notificationStatus.supported && 
                      notificationStatus.permission !== 'denied' && 
                      !notificationStatus.canShow && 
                      !isLoading;

  // Solo renderizar en el cliente para evitar problemas de hydration
  if (!isClient) {
    return (
      <button className={`px-3 py-2 rounded-lg bg-dark-800 border border-dark-600 ${className}`}>
        <Bell className="h-4 w-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={isClickable ? handleEnableNotifications : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={getButtonClasses(isClickable, notificationStatus, className)}
        disabled={!isClickable}
      >
        {getButtonContent()}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-dark-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap border border-dark-600">
            {getTooltipText()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para usar notificaciones en componentes
export function useNotifications() {
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    canShow: false
  });

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    // Establecer estado inicial
    setStatus(browserNotifications.getStatus());
    
    // Actualizar estado cuando cambie
    const interval = setInterval(() => {
      const newStatus = browserNotifications.getStatus();
      setStatus(newStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    notify: {
      bannerUpdate: browserNotifications.notifyBannerUpdate.bind(browserNotifications),
      promoUpdate: browserNotifications.notifyPromoUpdate.bind(browserNotifications),
      favoritoUpdate: browserNotifications.notifyFavoritoUpdate.bind(browserNotifications),
      generalUpdate: browserNotifications.notifyGeneralUpdate.bind(browserNotifications),
      custom: browserNotifications.showNotification.bind(browserNotifications)
    },
    requestPermission: browserNotifications.requestPermissionWithUI.bind(browserNotifications)
  };
}
