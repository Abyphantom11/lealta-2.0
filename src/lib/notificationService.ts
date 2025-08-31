/**
 * Servicio de notificaciones
 * Proporciona una interfaz centralizada para mostrar notificaciones al usuario
 */

// Tipos de notificaciones
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Interfaz para una notificación
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // duración en ms, undefined = indefinida (hasta que el usuario la cierre)
  onClose?: () => void; // callback cuando se cierra la notificación
  isHTML?: boolean; // si el mensaje contiene HTML
}

// Interfaz para opciones de creación de notificación
export interface CreateNotificationOptions {
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  isHTML?: boolean;
}

// Almacén de notificaciones activas
let notifications: Notification[] = [];

// Listeners de cambios en el estado de notificaciones
const listeners: Array<(notifications: Notification[]) => void> = [];

/**
 * Genera un ID único para notificaciones
 */
function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Notifica a todos los listeners de un cambio en las notificaciones
 */
function notifyListeners(): void {
  listeners.forEach(listener => listener([...notifications]));
}

/**
 * Agrega una notificación
 */
function addNotification(notification: Notification): string {
  notifications.push(notification);
  notifyListeners();

  // Configura un temporizador para eliminar la notificación si tiene duración
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      removeNotification(notification.id);
    }, notification.duration);
  }

  return notification.id;
}

/**
 * Elimina una notificación por su ID
 */
export function removeNotification(id: string): void {
  const notification = notifications.find(n => n.id === id);
  if (notification && notification.onClose) {
    notification.onClose();
  }
  
  notifications = notifications.filter(n => n.id !== id);
  notifyListeners();
}

/**
 * Elimina todas las notificaciones
 */
export function clearNotifications(): void {
  notifications.forEach(notification => {
    if (notification.onClose) {
      notification.onClose();
    }
  });
  
  notifications = [];
  notifyListeners();
}

/**
 * Suscribe a cambios en las notificaciones
 */
export function subscribe(callback: (notifications: Notification[]) => void): () => void {
  listeners.push(callback);
  
  // Llamada inicial con el estado actual
  callback([...notifications]);
  
  // Devuelve una función para cancelar la suscripción
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Crea una notificación de éxito
 */
export function success(options: CreateNotificationOptions): string {
  return addNotification({
    id: generateId(),
    type: 'success',
    title: options.title || 'Éxito',
    message: options.message,
    duration: options.duration !== undefined ? options.duration : 5000,
    onClose: options.onClose,
    isHTML: options.isHTML,
  });
}

/**
 * Crea una notificación de error
 */
export function error(options: CreateNotificationOptions): string {
  return addNotification({
    id: generateId(),
    type: 'error',
    title: options.title || 'Error',
    message: options.message,
    duration: options.duration !== undefined ? options.duration : 8000,
    onClose: options.onClose,
    isHTML: options.isHTML,
  });
}

/**
 * Crea una notificación de advertencia
 */
export function warning(options: CreateNotificationOptions): string {
  return addNotification({
    id: generateId(),
    type: 'warning',
    title: options.title || 'Advertencia',
    message: options.message,
    duration: options.duration !== undefined ? options.duration : 6000,
    onClose: options.onClose,
    isHTML: options.isHTML,
  });
}

/**
 * Crea una notificación informativa
 */
export function info(options: CreateNotificationOptions): string {
  return addNotification({
    id: generateId(),
    type: 'info',
    title: options.title || 'Información',
    message: options.message,
    duration: options.duration !== undefined ? options.duration : 5000,
    onClose: options.onClose,
    isHTML: options.isHTML,
  });
}

// Exportar el objeto de notificaciones completo para facilitar su uso
export default {
  success,
  error,
  warning,
  info,
  removeNotification,
  clearNotifications,
  subscribe,
};
