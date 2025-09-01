/**
 * Utilitario para manejar el almacenamiento local (localStorage)
 * Proporciona una interfaz tipada y segura para operaciones de almacenamiento
 */

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

/**
 * Obtiene un valor del localStorage
 * @param key Clave de almacenamiento
 * @param defaultValue Valor por defecto si no existe
 * @returns El valor almacenado o el valor por defecto
 */
export function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error al obtener del localStorage [${key}]:`, error);
    return defaultValue;
  }
}

/**
 * Guarda un valor en localStorage
 * @param key Clave de almacenamiento
 * @param value Valor a almacenar
 * @returns true si la operación fue exitosa
 */
export function setItem<T>(key: string, value: T): boolean {
  if (!isBrowser) return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error al guardar en localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Elimina un valor del localStorage
 * @param key Clave a eliminar
 * @returns true si la operación fue exitosa
 */
export function removeItem(key: string): boolean {
  if (!isBrowser) return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error al eliminar del localStorage [${key}]:`, error);
    return false;
  }
}

/**
 * Verifica si existe una clave en localStorage
 * @param key Clave a verificar
 * @returns true si la clave existe
 */
export function hasItem(key: string): boolean {
  if (!isBrowser) return false;
  
  return window.localStorage.getItem(key) !== null;
}

/**
 * Elimina todos los datos almacenados en localStorage
 * @returns true si la operación se completó correctamente
 */
export function clearAll(): boolean {
  if (!isBrowser) return false;
  
  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
    return false;
  }
}

// Clase Storage con tipado genérico para un uso más conveniente
export class TypedStorage<T extends Record<string, any>> {
  private readonly prefix: string;
  
  constructor(prefix: string = '') {
    this.prefix = prefix ? `${prefix}:` : '';
  }
  
  /**
   * Obtiene un valor del storage
   * @param key Clave (sin prefijo)
   * @param defaultValue Valor por defecto
   */
  get<K extends keyof T>(key: K, defaultValue: T[K]): T[K] {
    return getItem<T[K]>(`${this.prefix}${String(key)}`, defaultValue);
  }
  
  /**
   * Guarda un valor en el storage
   * @param key Clave (sin prefijo)
   * @param value Valor a guardar
   */
  set<K extends keyof T>(key: K, value: T[K]): boolean {
    return setItem<T[K]>(`${this.prefix}${String(key)}`, value);
  }
  
  /**
   * Elimina un valor del storage
   * @param key Clave (sin prefijo)
   */
  remove<K extends keyof T>(key: K): boolean {
    return removeItem(`${this.prefix}${String(key)}`);
  }
  
  /**
   * Verifica si existe una clave en el storage
   * @param key Clave (sin prefijo)
   */
  has<K extends keyof T>(key: K): boolean {
    return hasItem(`${this.prefix}${String(key)}`);
  }
  
  /**
   * Limpia todas las claves con este prefijo
   */
  clear(): void {
    if (!isBrowser) return;
    
    // Solo eliminar las claves que coinciden con nuestro prefijo
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => window.localStorage.removeItem(key));
  }
}

// Exportar funciones y clase
export default {
  getItem,
  setItem,
  removeItem,
  hasItem,
  clearAll,
  TypedStorage,
};
