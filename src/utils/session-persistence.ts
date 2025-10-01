/**
 * Utilidad para persistir la sesión del usuario en localStorage
 * como backup de las cookies que pueden perderse en hard refresh
 * 
 * Similar a cómo funciona superadmin
 */

const SESSION_STORAGE_KEY = 'lealta_session_backup';
const SESSION_EXPIRY_HOURS = 24;

export interface SessionBackup {
  businessId: string;
  businessSlug?: string;
  userId?: string;
  timestamp: number;
}

/**
 * Guarda los datos de sesión en localStorage
 */
export function saveSessionBackup(data: Omit<SessionBackup, 'timestamp'>): void {
  try {
    const sessionData: SessionBackup = {
      ...data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    console.log('💾 Sesión guardada en localStorage:', sessionData);
  } catch (error) {
    console.error('Error guardando sesión en localStorage:', error);
  }
}

/**
 * Recupera los datos de sesión desde localStorage
 * Retorna null si no existe o está expirada
 */
export function getSessionBackup(): SessionBackup | null {
  try {
    const storedData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedData) {
      return null;
    }

    const sessionData: SessionBackup = JSON.parse(storedData);
    
    // Verificar si la sesión ha expirado
    const expiryTime = sessionData.timestamp + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    const isExpired = Date.now() > expiryTime;
    
    if (isExpired) {
      console.log('⚠️ Sesión en localStorage expirada');
      clearSessionBackup();
      return null;
    }

    console.log('✅ Sesión recuperada desde localStorage:', sessionData);
    return sessionData;
  } catch (error) {
    console.error('Error recuperando sesión desde localStorage:', error);
    return null;
  }
}

/**
 * Limpia los datos de sesión de localStorage
 */
export function clearSessionBackup(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log('🗑️ Sesión eliminada de localStorage');
  } catch (error) {
    console.error('Error limpiando sesión de localStorage:', error);
  }
}

/**
 * Verifica si hay una sesión válida en localStorage
 */
export function hasValidSessionBackup(): boolean {
  return getSessionBackup() !== null;
}

/**
 * Actualiza el timestamp de la sesión para mantenerla activa
 */
export function refreshSessionBackup(): void {
  try {
    const sessionData = getSessionBackup();
    if (sessionData) {
      saveSessionBackup({
        businessId: sessionData.businessId,
        businessSlug: sessionData.businessSlug,
        userId: sessionData.userId
      });
    }
  } catch (error) {
    console.error('Error actualizando sesión en localStorage:', error);
  }
}
