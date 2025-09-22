// Fallback específico para Opera cuando Service Worker está bloqueado
import { logger } from './logger';

interface OperaFallback {
  readonly storageManager: {
    readonly save: (key: string, value: unknown) => Promise<boolean>;
    readonly load: (key: string) => unknown;
    readonly remove: (key: string) => void;
  };
  readonly notificationManager: {
    readonly isSupported: () => boolean;
    readonly requestPermission: () => Promise<boolean>;
    readonly show: (title: string, options?: NotificationOptions) => void;
  };
  readonly installManager: {
    canInstall: () => boolean;
    showManualInstructions: () => void;
  };
}

class OperaFallbackSystem {
  private static instance: OperaFallbackSystem;
  
  static getInstance(): OperaFallbackSystem {
    if (!OperaFallbackSystem.instance) {
      OperaFallbackSystem.instance = new OperaFallbackSystem();
    }
    return OperaFallbackSystem.instance;
  }

  // Detectar si estamos en Opera con Service Worker bloqueado
  isOperaWithBlockedSW(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent;
    const isOpera = userAgent.includes('OPR/') || userAgent.includes('Opera/');
    const swBlocked = !('serviceWorker' in navigator);
    
    // También verificar si SW existe pero está bloqueado/inactivo
    const swInactive = (() => {
      try {
        if ('serviceWorker' in navigator) {
          // Intentar acceder al Service Worker
          return !navigator.serviceWorker;
        }
        return true;
      } catch {
        return true;
      }
    })();
    
    logger.log(`🔍 Detección Opera: isOpera=${isOpera}, swBlocked=${swBlocked}, swInactive=${swInactive}`);
    
    return isOpera && (swBlocked || swInactive);
  }

  // Sistema de almacenamiento alternativo para Opera
  createStorageManager() {
    return {
      save: async (key: string, value: any): Promise<boolean> => {
        try {
          // Método 1: localStorage con múltiples intentos
          const serializedValue = JSON.stringify({
            data: value,
            timestamp: Date.now(),
            operaFallback: true
          });
          
          localStorage.setItem(`opera_${key}`, serializedValue);
          
          // Método 2: sessionStorage como backup
          sessionStorage.setItem(`opera_backup_${key}`, serializedValue);
          
          // Método 3: Cookies como último recurso
          document.cookie = `opera_cookie_${key}=${encodeURIComponent(serializedValue)}; path=/; max-age=2592000`; // 30 días
          
          logger.log(`✅ Datos guardados en Opera (sin Service Worker): ${key}`);
          return true;
        } catch (error) {
          logger.error('❌ Error guardando en Opera:', error);
          return false;
        }
      },

      load: (key: string): unknown => {
        try {
          // Intentar localStorage primero
          let item = localStorage.getItem(`opera_${key}`);
          
          // Fallback a sessionStorage
          if (!item) {
            item = sessionStorage.getItem(`opera_backup_${key}`);
          }
          
          // Fallback a cookies
          if (!item) {
            const cookieName = `opera_cookie_${key}=`;
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const c = cookie.trim();
              if (c.startsWith(cookieName)) {
                item = decodeURIComponent(c.substring(cookieName.length));
                break;
              }
            }
          }
          
          if (item) {
            const parsed = JSON.parse(item);
            logger.log(`✅ Datos recuperados en Opera: ${key}`);
            return parsed.data;
          }
          
          return null;
        } catch (error) {
          logger.error('❌ Error cargando en Opera:', error);
          return null;
        }
      },

      remove: (key: string): void => {
        try {
          localStorage.removeItem(`opera_${key}`);
          sessionStorage.removeItem(`opera_backup_${key}`);
          document.cookie = `opera_cookie_${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          logger.log(`🗑️ Datos removidos en Opera: ${key}`);
        } catch (error) {
          logger.error('❌ Error removiendo en Opera:', error);
        }
      }
    };
  }

  // Sistema de notificaciones alternativo para Opera
  createNotificationManager() {
    return {
      isSupported: (): boolean => {
        // En Opera sin SW, usamos notificaciones básicas del navegador
        return 'Notification' in window;
      },

      requestPermission: async (): Promise<boolean> => {
        try {
          if (!('Notification' in window)) {
            logger.warn('⚠️ Notificaciones no soportadas en Opera');
            return false;
          }

          const permission = await Notification.requestPermission();
          const granted = permission === 'granted';
          
          if (granted) {
            logger.log('✅ Permisos de notificación concedidos en Opera');
          } else {
            logger.warn('❌ Permisos de notificación denegados en Opera');
          }
          
          return granted;
        } catch (error) {
          logger.error('❌ Error solicitando permisos en Opera:', error);
          return false;
        }
      },

      show: (title: string, options?: NotificationOptions): void => {
        try {
          if (Notification.permission === 'granted') {
            new Notification(title, {
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              ...options
            });
            logger.log(`📧 Notificación mostrada en Opera: ${title}`);
          } else {
            // Fallback: mostrar notificación en la página
            this.showInPageNotification(title, options?.body || '');
          }
        } catch (error) {
          logger.error('❌ Error mostrando notificación en Opera:', error);
          this.showInPageNotification(title, options?.body || '');
        }
      }
    };
  }

  // Sistema de instalación alternativo para Opera
  createInstallManager() {
    return {
      canInstall: (): boolean => {
        // Opera sin SW no puede usar BeforeInstallPrompt, pero puede instalarse manualmente
        return true;
      },

      showManualInstructions: (): void => {
        const instructions = `
🔧 INSTALAR EN OPERA (Sin Service Worker):

📱 Opera Mobile:
1. Toca el menú (tres líneas) ≡
2. Selecciona "Agregar a pantalla de inicio"
3. Confirma la instalación

💻 Opera Desktop:
1. Ve al menú Opera (O)
2. Página web > Instalar Lealta 2.0
3. O usar Ctrl+Shift+A

⚠️ NOTA: Sin Service Worker, la app:
• Funcionará online perfectamente
• No tendrá cache offline
• Las notificaciones serán básicas
        `;

        // Mostrar instrucciones en modal o alert
        if (confirm('¿Quieres ver las instrucciones de instalación para Opera?')) {
          alert(instructions);
        }

        logger.log('📋 Instrucciones de instalación mostradas para Opera');
      }
    };
  }

  // Notificación en página cuando las normales fallan
  private showInPageNotification(title: string, body: string): void {
    // Crear elemento de notificación en la página
    const notification = document.createElement('div');
    notification.className = 'opera-fallback-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
      ">
        <strong>${title}</strong>
        <div style="margin-top: 8px; font-size: 14px;">${body}</div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        ">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Crear el sistema completo de fallback
  createOperaFallback(): OperaFallback {
    return {
      storageManager: this.createStorageManager(),
      notificationManager: this.createNotificationManager(),
      installManager: this.createInstallManager()
    };
  }
}

// Función para detectar y configurar Opera automáticamente
export function setupOperaFallback(): OperaFallback | null {
  const system = OperaFallbackSystem.getInstance();
  
  if (system.isOperaWithBlockedSW()) {
    logger.warn('🔴 OPERA DETECTADO SIN SERVICE WORKER - Activando sistema de fallback mejorado');
    
    // Crear fallback
    const fallback = system.createOperaFallback();
    
    // Mostrar notificación visual al usuario
    showOperaVisualNotification();
    
    // Patch localStorage para mejor compatibilidad
    patchStorageForOpera(fallback);
    
    return fallback;
  }
  
  return null;
}

// Mostrar notificación visual mejorada
function showOperaVisualNotification() {
  // Evitar duplicados
  if (document.getElementById('opera-notice')) return;
  
  const notification = document.createElement('div');
  notification.id = 'opera-notice';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    z-index: 10003;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);
    max-width: 380px;
    text-align: center;
    animation: slideInTop 0.5s ease-out;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
      <span style="font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🔄</span>
      <div>
        <div style="font-weight: 700; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
          Modo Opera Activado
        </div>
        <div style="font-size: 12px; opacity: 0.95; margin-top: 4px;">
          ✅ Persistencia activada • 🔔 Notificaciones disponibles
        </div>
      </div>
    </div>
  `;
  
  // Añadir estilos de animación si no existen
  if (!document.getElementById('opera-styles')) {
    const style = document.createElement('style');
    style.id = 'opera-styles';
    style.textContent = `
      @keyframes slideInTop {
        0% { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        100% { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto-remover
  setTimeout(() => {
    notification.style.transition = 'all 0.4s ease-out';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-30px)';
    setTimeout(() => {
      notification.remove();
    }, 400);
  }, 4500);
}

// Patch storage para Opera
function patchStorageForOpera(operaFallback: OperaFallback) {
  if ((window as any).__opera_patched) return;
  
  try {
    const storage = operaFallback.storageManager;
    
    // Backup original methods
    const originalLS = {
      setItem: localStorage.setItem.bind(localStorage),
      getItem: localStorage.getItem.bind(localStorage),
      removeItem: localStorage.removeItem.bind(localStorage),
      clear: localStorage.clear.bind(localStorage)
    };
    
    // Patch setItem
    localStorage.setItem = function(key: string, value: string) {
      try {
        originalLS.setItem(key, value);
        // También guardar en fallback
        storage.save(key, value).catch(error => 
          logger.error('Error en fallback storage:', error)
        );
      } catch {
        logger.log(`🔄 localStorage bloqueado, usando solo fallback: ${key}`);
        storage.save(key, value).catch(error => 
          logger.error('Error en fallback storage:', error)
        );
      }
    };
    
    // Patch getItem
    localStorage.getItem = function(key: string): string | null {
      try {
        const value = originalLS.getItem(key);
        if (value !== null) return value;
      } catch {
        logger.log(`🔄 localStorage bloqueado para lectura: ${key}`);
      }
      
      // Fallback
      const fallbackValue = storage.load(key);
      if (!fallbackValue) return null;
      
      return typeof fallbackValue === 'string' 
        ? fallbackValue 
        : JSON.stringify(fallbackValue);
    };
    
    // Patch removeItem
    localStorage.removeItem = function(key: string) {
      try {
        originalLS.removeItem(key);
      } catch {
        logger.log(`🔄 localStorage bloqueado para eliminar: ${key}`);
      }
      
      // También remover del fallback
      storage.save(key, null).catch(error => 
        logger.error('Error removiendo del fallback:', error)
      );
    };
    
    (window as any).__opera_patched = true;
    logger.log('✅ Sistema de storage parcheado para Opera');
    
  } catch (error) {
    logger.error('❌ Error parcheando storage:', error);
  }
}

// Exportar sistema para uso manual
export const operaFallback = OperaFallbackSystem.getInstance();
