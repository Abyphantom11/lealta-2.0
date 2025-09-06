// Sistema de notificaciones push del navegador
import { logger } from '../utils/logger';

class BrowserNotificationService {
  private readonly isSupported: boolean = false;
  private permission: NotificationPermission = 'default';
  
  constructor() {
    // Verificar que estamos en el cliente antes de acceder a window
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    
    // Logging only in development
    logger.log('🔔 Servicio de notificaciones inicializado:', {
      supported: this.isSupported,
      permission: this.permission
    });
  }

  // Solicitar permisos de notificación
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      logger.log('❌ Notificaciones no soportadas en este navegador');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      logger.log('🔔 Permisos de notificación:', permission);
      
      if (permission === 'granted') {
        this.showWelcomeNotification();
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('❌ Error solicitando permisos de notificación:', error);
      return false;
    }
  }

  // Mostrar notificación de bienvenida
  private showWelcomeNotification() {
    this.showNotification({
      title: '🎉 ¡Notificaciones Activadas!',
      body: 'Recibirás notificaciones cuando haya cambios en el portal',
      icon: '/favicon.ico',
      tag: 'welcome'
    });
  }

  // Mostrar notificación básica
  showNotification(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    badge?: string;
    data?: any;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    requireInteraction?: boolean;
    silent?: boolean;
  }): boolean {
    if (!this.canShowNotifications()) {
      logger.log('❌ No se pueden mostrar notificaciones');
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag || `notification-${Date.now()}`,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        // Actions no están disponibles en notificaciones básicas
        // Solo funcionan con Service Worker
      });

      // Eventos de la notificación
      notification.onclick = (event) => {
        logger.log('👆 Usuario hizo click en notificación:', event);
        event.preventDefault();
        window.focus();
        
        // Si hay datos personalizados, manejarlos
        if (options.data) {
          this.handleNotificationClick(options.data);
        }
        
        notification.close();
      };

      notification.onshow = () => {
        logger.log('👁️ Notificación mostrada');
      };

      notification.onclose = () => {
        logger.log('❌ Notificación cerrada');
      };

      notification.onerror = (error) => {
        logger.error('❌ Error en notificación:', error);
      };

      // Auto-cerrar después de 8 segundos si no requiere interacción
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 8000);
      }

      return true;
    } catch (error) {
      logger.error('❌ Error mostrando notificación:', error);
      return false;
    }
  }

  // Manejar clicks en notificaciones
  private handleNotificationClick(data: any) {
    logger.log('🎯 Manejando click en notificación con data:', data);
    
    switch (data.type) {
      case 'banner-update':
        // Redirigir a la sección de banners
        window.location.hash = '#banners';
        break;
      case 'promo-update':
        // Redirigir a promociones
        window.location.hash = '#promociones';
        break;
      case 'config-update':
        // Recargar página para mostrar cambios
        window.location.reload();
        break;
      default:
        logger.log('🔄 Acción de notificación no específica');
    }
  }

  // Verificar si se pueden mostrar notificaciones
  canShowNotifications(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  // Notificaciones específicas para cambios en el portal
  notifyBannerUpdate(bannerCount: number) {
    if (!this.canShowNotifications()) return false;

    return this.showNotification({
      title: '🎪 Banners Actualizados',
      body: `Se han actualizado ${bannerCount} banner(es) en el portal`,
      icon: '/favicon.ico',
      tag: 'banner-update',
      data: { type: 'banner-update' },
      requireInteraction: false
    });
  }

  notifyPromoUpdate(promoCount: number) {
    if (!this.canShowNotifications()) return false;

    return this.showNotification({
      title: '🎁 Promociones Actualizadas',
      body: `Se han actualizado ${promoCount} promoción(es) en el portal`,
      icon: '/favicon.ico',
      tag: 'promo-update',
      data: { type: 'promo-update' },
      requireInteraction: false
    });
  }

  notifyFavoritoUpdate(favorito: string) {
    if (!this.canShowNotifications()) return false;

    return this.showNotification({
      title: '⭐ Favorito del Día',
      body: `Nuevo favorito: ${favorito}`,
      icon: '/favicon.ico',
      tag: 'favorito-update',
      data: { type: 'favorito-update' },
      requireInteraction: false
    });
  }

  notifyGeneralUpdate() {
    if (!this.canShowNotifications()) return false;

    return this.showNotification({
      title: '🔄 Portal Actualizado',
      body: 'Se han realizado cambios en el portal del cliente',
      icon: '/favicon.ico',
      tag: 'config-update',
      data: { type: 'config-update' },
      requireInteraction: false
    });
  }

  // Solicitar permisos con UI amigable
  async requestPermissionWithUI(): Promise<boolean> {
    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      // En lugar de alert(), mostrar notificación temporal si es posible
      // o simplemente log en desarrollo
      logger.warn('❌ Las notificaciones están bloqueadas. Ve a configuración del navegador para habilitarlas.');
      return false;
    }

    // En lugar de confirm(), intentar directamente pedir permisos
    // El navegador mostrará su propio dialog de permisos
    return await this.requestPermission();
  }

  // Obtener estado actual
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      canShow: this.canShowNotifications()
    };
  }
}

// Crear instancia global
export const browserNotifications = new BrowserNotificationService();
