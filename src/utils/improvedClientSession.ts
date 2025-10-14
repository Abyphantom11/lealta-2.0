// 🛡️ CLIENTE SESSION MEJORADO - Manejo robusto de sesiones
// Versión mejorada con fallbacks y recovery automático

import { logger } from '@/utils/logger';

interface ClientSessionData {
  cedula: string;
  timestamp: number;
  businessId?: string;
  version: string; // Para versionado de datos
}

interface StorageItem {
  data: ClientSessionData;
  timestamp: number;
  expires: number;
  version: string;
}

class ImprovedClientSession {
  private prefix = 'lealta_mobile_';
  private key = 'clienteSession';
  private version = '1.0.0';
  private maxRetries = 3;
  private retryDelay = 100; // ms

  private getStorageKeys() {
    return [
      `${this.prefix}${this.key}`,
      `${this.prefix}${this.key}_backup`,
      `${this.prefix}${this.key}_mobile`,
      `${this.prefix}${this.key}_emergency`
    ];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isStorageAvailable(): boolean {
    try {
      if (typeof Storage === 'undefined') return false;
      
      // Test localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('Storage no disponible:', error);
      return false;
    }
  }

  private createStorageItem(data: ClientSessionData): StorageItem {
    return {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 días
      version: this.version
    };
  }

  private async saveToStorage(key: string, item: StorageItem): Promise<boolean> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const serialized = JSON.stringify(item);
        localStorage.setItem(key, serialized);
        
        // Verificar que se guardó correctamente
        const verification = localStorage.getItem(key);
        if (verification === serialized) {
          return true;
        }
        
        logger.warn(`Attempt ${attempt + 1}: Storage verification failed for ${key}`);
      } catch (error) {
        logger.warn(`Attempt ${attempt + 1}: Error saving to ${key}:`, error);
        
        if (attempt < this.maxRetries - 1) {
          await this.sleep(this.retryDelay * (attempt + 1));
        }
      }
    }
    
    return false;
  }

  private loadFromStorage(key: string): StorageItem | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed: StorageItem = JSON.parse(stored);
      
      // Verificar estructura
      if (!parsed.data || !parsed.data.cedula || !parsed.timestamp) {
        logger.warn(`Invalid data structure in ${key}`);
        return null;
      }

      // Verificar expiración
      if (parsed.expires && Date.now() > parsed.expires) {
        logger.log(`Data expired in ${key}, removing`);
        localStorage.removeItem(key);
        return null;
      }

      // Verificar versión (para futuras migraciones)
      if (parsed.version && parsed.version !== this.version) {
        logger.log(`Version mismatch in ${key}: ${parsed.version} vs ${this.version}`);
        // Aquí podríamos hacer migración de datos si es necesario
      }

      return parsed;
    } catch (error) {
      logger.warn(`Error loading from ${key}:`, error);
      // Limpiar datos corruptos
      try {
        localStorage.removeItem(key);
      } catch (cleanError) {
        logger.warn(`Error cleaning corrupted data from ${key}:`, cleanError);
      }
      return null;
    }
  }

  async save(cedula: string, businessId?: string): Promise<boolean> {
    if (!cedula?.trim()) {
      logger.warn('Cannot save session: cedula is empty');
      return false;
    }

    if (!this.isStorageAvailable()) {
      logger.warn('Storage not available, cannot save session');
      return false;
    }

    const sessionData: ClientSessionData = {
      cedula: cedula.trim(),
      timestamp: Date.now(),
      businessId,
      version: this.version
    };

    const storageItem = this.createStorageItem(sessionData);
    const keys = this.getStorageKeys();
    let successCount = 0;

    // Intentar guardar en múltiples ubicaciones
    for (const key of keys) {
      const success = await this.saveToStorage(key, storageItem);
      if (success) {
        successCount++;
        logger.log(`✅ Session saved to ${key}`);
      }
    }

    // También guardar en sessionStorage como fallback inmediato
    try {
      sessionStorage.setItem(`${this.prefix}${this.key}_session`, JSON.stringify(storageItem));
      successCount++;
    } catch (error) {
      logger.warn('Failed to save to sessionStorage:', error);
    }

    const allSuccessful = successCount > 0;
    if (allSuccessful) {
      logger.log(`✅ Session saved successfully (${successCount}/${keys.length + 1} locations)`);
    } else {
      logger.error('❌ Failed to save session to any location');
    }

    return allSuccessful;
  }

  load(): ClientSessionData | null {
    if (!this.isStorageAvailable()) {
      logger.warn('Storage not available');
      return null;
    }

    // Intentar cargar desde múltiples ubicaciones
    const keys = [
      ...this.getStorageKeys(),
      `${this.prefix}${this.key}_session` // sessionStorage
    ];

    for (const key of keys) {
      try {
        const storageItem = key.includes('_session') 
          ? this.loadFromSessionStorage(key)
          : this.loadFromStorage(key);

        if (storageItem?.data) {
          logger.log(`✅ Session loaded from ${key}`);
          return storageItem.data;
        }
      } catch (error) {
        logger.warn(`Error loading from ${key}:`, error);
        continue;
      }
    }

    logger.log('❌ No se pudieron recuperar datos para: clienteSession');
    return null;
  }

  private loadFromSessionStorage(key: string): StorageItem | null {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      return JSON.parse(stored) as StorageItem;
    } catch (error) {
      logger.warn(`Error loading from sessionStorage ${key}:`, error);
      try {
        sessionStorage.removeItem(key);
      } catch (cleanError) {
        // Ignore cleanup errors
      }
      return null;
    }
  }

  clear(): void {
    const keys = [
      ...this.getStorageKeys(),
      `${this.prefix}${this.key}_session`
    ];

    let clearedCount = 0;
    for (const key of keys) {
      try {
        localStorage.removeItem(key);
        clearedCount++;
      } catch (error) {
        logger.warn(`Error clearing ${key}:`, error);
      }
    }

    // Limpiar sessionStorage
    try {
      sessionStorage.removeItem(`${this.prefix}${this.key}_session`);
      clearedCount++;
    } catch (error) {
      logger.warn('Error clearing sessionStorage:', error);
    }

    logger.log(`🗑️ Session cleared (${clearedCount} locations)`);
  }

  isValid(): boolean {
    return this.load() !== null;
  }

  // Método de emergency recovery
  async emergencyRecovery(cedula: string, businessId?: string): Promise<boolean> {
    logger.log('🚨 Running emergency session recovery...');
    
    // Limpiar datos corruptos primero
    this.clear();
    
    // Esperar un poco para que el storage se limpie
    await this.sleep(100);
    
    // Crear nueva sesión
    const success = await this.save(cedula, businessId);
    
    if (success) {
      logger.log('✅ Emergency recovery successful');
    } else {
      logger.error('❌ Emergency recovery failed');
    }
    
    return success;
  }

  // Diagnóstico de salud del storage
  async healthCheck(): Promise<{
    isHealthy: boolean;
    details: {
      storageAvailable: boolean;
      sessionsFound: number;
      corruptedSessions: number;
      canWrite: boolean;
    };
  }> {
    const details = {
      storageAvailable: this.isStorageAvailable(),
      sessionsFound: 0,
      corruptedSessions: 0,
      canWrite: false
    };

    if (!details.storageAvailable) {
      return { isHealthy: false, details };
    }

    // Verificar sesiones existentes
    const keys = this.getStorageKeys();
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          JSON.parse(item);
          details.sessionsFound++;
        } catch (error) {
          details.corruptedSessions++;
        }
      }
    }

    // Test de escritura
    try {
      const testKey = `${this.prefix}health_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      details.canWrite = true;
    } catch (error) {
      details.canWrite = false;
    }

    const isHealthy = details.storageAvailable && details.canWrite;
    
    logger.log('💊 Session health check:', { isHealthy, details });
    
    return { isHealthy, details };
  }
}

// Crear instancia singleton mejorada
export const improvedClientSession = new ImprovedClientSession();

// Mantener compatibilidad con la API anterior
export const clientSession = {
  save: (cedula: string, businessId?: string) => improvedClientSession.save(cedula, businessId),
  load: () => improvedClientSession.load(),
  clear: () => improvedClientSession.clear(),
  isValid: () => improvedClientSession.isValid(),
  emergencyRecovery: (cedula: string, businessId?: string) => improvedClientSession.emergencyRecovery(cedula, businessId),
  healthCheck: () => improvedClientSession.healthCheck()
};

// Utilidades para el nivel de tarjeta (storage simple para niveles)
class LevelStorage {
  private prefix = 'lealta_mobile_lastLevel_';
  
  async save(cedula: string, level: string): Promise<boolean> {
    if (!cedula?.trim() || !level?.trim()) {
      logger.warn('Cannot save level: cedula or level is empty');
      return false;
    }
    
    try {
      if (typeof Storage === 'undefined') {
        logger.warn('Storage not available for level storage');
        return false;
      }
      
      const key = `${this.prefix}${cedula.trim()}`;
      const data = {
        level: level.trim(),
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      logger.log(`✅ Level saved for ${cedula}: ${level}`);
      return true;
    } catch (error) {
      logger.warn('Error saving level storage:', error);
      return false;
    }
  }
  
  load(cedula: string): string | null {
    if (!cedula?.trim()) {
      return null;
    }
    
    try {
      if (typeof Storage === 'undefined') {
        return null;
      }
      
      const key = `${this.prefix}${cedula.trim()}`;
      const stored = localStorage.getItem(key);
      if (!stored) {
        return null;
      }
      
      const parsed = JSON.parse(stored);
      if (parsed.expires && Date.now() > parsed.expires) {
        localStorage.removeItem(key);
        logger.log(`Level expired for ${cedula}, removed`);
        return null;
      }
      
      return parsed.level || null;
    } catch (error) {
      logger.warn('Error loading level storage:', error);
      return null;
    }
  }
  
  clear(cedula: string): void {
    if (!cedula?.trim()) {
      return;
    }
    
    try {
      const key = `${this.prefix}${cedula.trim()}`;
      localStorage.removeItem(key);
      logger.log(`🗑️ Level cleared for ${cedula}`);
    } catch (error) {
      logger.warn('Error clearing level storage:', error);
    }
  }
}

export const levelStorage = new LevelStorage();
