// Utilidad para manejo de almacenamiento optimizado para móviles
import { logger } from './logger';

interface StorageData {
  data: any;
  timestamp: number;
  expires?: number;
}

class MobileStorage {
  private readonly prefix = 'lealta_';
  private operaFallback: any = null;
  
  constructor() {
    // Detectar Opera y configurar fallback si es necesario
    if (typeof window !== 'undefined') {
      this.initializeOperaFallback();
    }
  }
  
  private initializeOperaFallback() {
    const userAgent = navigator.userAgent;
    const isOpera = userAgent.includes('OPR/') || userAgent.includes('Opera/');
    const swBlocked = !('serviceWorker' in navigator);
    
    if (isOpera && swBlocked) {
      logger.warn('🔧 Opera detectado - Inicializando sistema de fallback completo');
      // Importar dinámicamente para evitar problemas de SSR
      import('./operaFallback').then(module => {
        this.operaFallback = module.setupOperaFallback();
        if (this.operaFallback) {
          logger.log('✅ Opera fallback activado y listo');
        }
      }).catch(error => {
        logger.error('❌ Error inicializando Opera fallback:', error);
      });
    }
  }
  
  // Detectar si estamos en un dispositivo móvil
  private isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }
  
  // Detectar si estamos en modo PWA
  private isPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }
  
  // Intentar múltiples métodos de almacenamiento
  private async tryMultipleStorage(key: string, data: StorageData): Promise<boolean> {
    const methods = [
      // Método 1: localStorage tradicional
      () => {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      },
      
      // Método 2: sessionStorage como fallback
      () => {
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
      },
      
      // Método 3: IndexedDB para PWA (futuro)
      () => {
        // Placeholder para IndexedDB si es necesario
        return false;
      }
    ];
    
    for (const method of methods) {
      try {
        if (method()) {
          logger.log(`✅ Datos guardados exitosamente: ${key}`);
          return true;
        }
      } catch (error) {
        logger.warn(`⚠️ Método de almacenamiento falló: ${key}`, error);
        continue;
      }
    }
    
    return false;
  }
  
  // Intentar múltiples métodos de recuperación
  private tryMultipleRetrieval(key: string): StorageData | null {
    const methods = [
      () => localStorage.getItem(key),
      () => sessionStorage.getItem(key)
    ];
    
    for (const method of methods) {
      try {
        const item = method();
        if (item) {
          return JSON.parse(item) as StorageData;
        }
      } catch (error) {
        logger.warn(`⚠️ Error recuperando datos: ${key}`, error);
        continue;
      }
    }
    
    return null;
  }
  
  // Guardar datos con persistencia mejorada para móviles
  async setItem(key: string, data: any, expirationDays: number = 30): Promise<boolean> {
    const fullKey = this.prefix + key;
    
    // Si tenemos fallback de Opera, usarlo
    if (this.operaFallback) {
      logger.log('🔧 Usando sistema de fallback de Opera para guardar');
      return await this.operaFallback.storageManager.save(fullKey, data);
    }
    
    const expirationTime = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);
    
    const storageData: StorageData = {
      data,
      timestamp: Date.now(),
      expires: expirationTime
    };
    
    // En móviles, intentamos guardar múltiples copias
    if (this.isMobile()) {
      logger.log('📱 Dispositivo móvil detectado, usando almacenamiento redundante');
      
      // Guardar en múltiples ubicaciones
      const results = await Promise.allSettled([
        this.tryMultipleStorage(fullKey, storageData),
        this.tryMultipleStorage(`${fullKey}_backup`, storageData),
        this.tryMultipleStorage(`${fullKey}_mobile`, storageData)
      ]);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      logger.log(`📱 Almacenamiento móvil: ${successCount}/3 métodos exitosos`);
      
      return successCount > 0;
    } else {
      // En desktop, usar método tradicional
      return await this.tryMultipleStorage(fullKey, storageData);
    }
  }
  
  // Recuperar datos con múltiples intentos
  getItem(key: string): unknown {
    const fullKey = this.prefix + key;
    
    // Si tenemos fallback de Opera, usarlo
    if (this.operaFallback) {
      logger.log('🔧 Usando sistema de fallback de Opera para cargar');
      return this.operaFallback.storageManager.load(fullKey);
    }
    
    // Intentar recuperar de múltiples ubicaciones
    const locations = [fullKey, `${fullKey}_backup`, `${fullKey}_mobile`];
    
    for (const location of locations) {
      try {
        const storageData = this.tryMultipleRetrieval(location);
        
        if (storageData) {
          // Verificar expiración
          if (storageData.expires && Date.now() > storageData.expires) {
            logger.log(`⏰ Datos expirados, removiendo: ${location}`);
            this.removeItem(key);
            continue;
          }
          
          logger.log(`✅ Datos recuperados de: ${location}`);
          return storageData.data;
        }
      } catch (error) {
        logger.warn(`⚠️ Error recuperando de ${location}:`, error);
        continue;
      }
    }
    
    logger.log(`❌ No se pudieron recuperar datos para: ${key}`);
    return null;
  }
  
  // Remover datos de todas las ubicaciones
  removeItem(key: string): void {
    const fullKey = this.prefix + key;
    
    // Si tenemos fallback de Opera, usarlo
    if (this.operaFallback) {
      logger.log('🔧 Usando sistema de fallback de Opera para remover');
      this.operaFallback.storageManager.remove(fullKey);
      return;
    }
    const locations = [fullKey, `${fullKey}_backup`, `${fullKey}_mobile`];
    
    locations.forEach(location => {
      try {
        localStorage.removeItem(location);
        sessionStorage.removeItem(location);
      } catch (error) {
        logger.warn(`⚠️ Error removiendo ${location}:`, error);
      }
    });
    
    logger.log(`🗑️ Datos removidos para: ${key}`);
  }
  
  // Verificar si los datos existen y son válidos
  hasValidItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
  
  // Obtener información del entorno
  getEnvironmentInfo(): {
    isMobile: boolean;
    isPWA: boolean;
    userAgent: string;
    storageAvailable: boolean;
  } {
    return {
      isMobile: this.isMobile(),
      isPWA: this.isPWA(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      storageAvailable: typeof Storage !== 'undefined'
    };
  }
}

// Exportar instancia singleton
export const mobileStorage = new MobileStorage();

// Utilidades de conveniencia específicas para la sesión del cliente
export const clientSession = {
  save: (cedula: string) => mobileStorage.setItem('clienteSession', {
    cedula: cedula.trim(),
    timestamp: Date.now()
  }, 30), // 30 días
  
  load: (): { cedula: string; timestamp: number } | null => {
    const result = mobileStorage.getItem('clienteSession');
    if (result && typeof result === 'object' && 'cedula' in result && 'timestamp' in result) {
      return result as { cedula: string; timestamp: number };
    }
    return null;
  },
  
  clear: () => mobileStorage.removeItem('clienteSession'),
  
  isValid: () => mobileStorage.hasValidItem('clienteSession')
};

// Utilidades para el nivel de tarjeta
export const levelStorage = {
  save: (cedula: string, level: string) => 
    mobileStorage.setItem(`lastLevel_${cedula}`, level, 365), // 1 año
  
  load: (cedula: string): string | null => {
    const result = mobileStorage.getItem(`lastLevel_${cedula}`);
    return typeof result === 'string' ? result : null;
  },
  
  clear: (cedula: string) => 
    mobileStorage.removeItem(`lastLevel_${cedula}`)
};
