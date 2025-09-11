'use client';

export interface ClientNotification {
  id: string;
  tipo: 'promocion' | 'puntos' | 'nivel' | 'menu' | 'general';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  clienteId?: string;
}

class ClientNotificationService {
  private notifications: ClientNotification[] = [];
  private readonly listeners: Array<(notifications: ClientNotification[]) => void> = [];
  private isInitialized = false;

  // Inicializar el servicio con notificaciones de ejemplo
  initialize(clienteId?: string) {
    if (this.isInitialized) return;

    // Cargar notificaciones desde localStorage
    this.loadFromStorage();

    // Si no hay notificaciones, crear algunas de ejemplo
    if (this.notifications.length === 0) {
      this.createSampleNotifications(clienteId);
    }

    this.isInitialized = true;
    this.notifyListeners();
  }

  private createSampleNotifications(clienteId?: string) {
    const sampleNotifications: ClientNotification[] = [
      {
        id: this.generateId(),
        tipo: 'promocion',
        titulo: '🎉 Nueva Promoción Disponible',
        mensaje: 'Descuento del 20% en tu próxima compra. ¡No te lo pierdas!',
        fecha: new Date(Date.now() - 10 * 60 * 1000), // hace 10 minutos
        leida: false,
        clienteId,
      },
      {
        id: this.generateId(),
        tipo: 'puntos',
        titulo: '⭐ Puntos Actualizados',
        mensaje: 'Has ganado 25 puntos por tu última visita.',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
        leida: false,
        clienteId,
      },
      {
        id: this.generateId(),
        tipo: 'nivel',
        titulo: '🏆 ¡Cerca del Siguiente Nivel!',
        mensaje: 'Estás cerca de alcanzar el nivel Oro. Solo necesitas 150 puntos más.',
        fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), // hace 1 día
        leida: true,
        clienteId,
      },
    ];

    this.notifications = sampleNotifications;
    this.saveToStorage();
  }

  // Agregar nueva notificación
  addNotification(notification: Omit<ClientNotification, 'id' | 'fecha'>) {
    const newNotification: ClientNotification = {
      ...notification,
      id: this.generateId(),
      fecha: new Date(),
    };

    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();
    
    return newNotification.id;
  }

  // Obtener todas las notificaciones
  getNotifications(): ClientNotification[] {
    return [...this.notifications];
  }

  // Obtener notificaciones no leídas
  getUnreadNotifications(): ClientNotification[] {
    return this.notifications.filter(n => !n.leida);
  }

  // Marcar como leída
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.leida) {
      notification.leida = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.leida) {
        notification.leida = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Eliminar notificación
  removeNotification(notificationId: string) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // Limpiar todas las notificaciones
  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Suscribirse a cambios
  subscribe(callback: (notifications: ClientNotification[]) => void) {
    this.listeners.push(callback);
    
    // Llamada inicial
    callback([...this.notifications]);

    // Retornar función para cancelar suscripción
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notificar a todos los listeners
  private notifyListeners() {
    this.listeners.forEach(callback => {
      callback([...this.notifications]);
    });
  }

  // Generar ID único
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Guardar en localStorage
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('client-notifications', JSON.stringify(this.notifications));
      } catch (error) {
        console.warn('No se pudo guardar notificaciones en localStorage:', error);
      }
    }
  }

  // Cargar desde localStorage
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('client-notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convertir fechas de strings a Date objects
          this.notifications = parsed.map((n: any) => ({
            ...n,
            fecha: new Date(n.fecha)
          }));
        }
      } catch (error) {
        console.warn('No se pudo cargar notificaciones desde localStorage:', error);
        this.notifications = [];
      }
    }
  }

  // Métodos específicos para diferentes tipos de notificaciones
  notifyPromotion(titulo: string, mensaje: string, clienteId?: string) {
    return this.addNotification({
      tipo: 'promocion',
      titulo,
      mensaje,
      leida: false,
      clienteId,
    });
  }

  notifyPointsUpdate(puntos: number, clienteId?: string) {
    return this.addNotification({
      tipo: 'puntos',
      titulo: '⭐ Puntos Actualizados',
      mensaje: `Has ganado ${puntos} puntos. ¡Sigue acumulando!`,
      leida: false,
      clienteId,
    });
  }

  notifyLevelProgress(nivelActual: string, puntosNecesarios: number, clienteId?: string) {
    return this.addNotification({
      tipo: 'nivel',
      titulo: '🏆 Progreso de Nivel',
      mensaje: `Necesitas ${puntosNecesarios} puntos más para alcanzar el siguiente nivel desde ${nivelActual}.`,
      leida: false,
      clienteId,
    });
  }

  notifyMenuUpdate(clienteId?: string) {
    return this.addNotification({
      tipo: 'menu',
      titulo: '🍽️ Menú Actualizado',
      mensaje: 'Hay nuevos productos disponibles en nuestro menú. ¡Descúbrelos!',
      leida: false,
      clienteId,
    });
  }

  notifyGeneral(titulo: string, mensaje: string, clienteId?: string) {
    return this.addNotification({
      tipo: 'general',
      titulo,
      mensaje,
      leida: false,
      clienteId,
    });
  }
}

// Instancia única del servicio
export const clientNotificationService = new ClientNotificationService();

// Hook de React para usar el servicio
import { useState, useEffect } from 'react';

export function useClientNotifications(clienteId?: string) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  useEffect(() => {
    // Inicializar el servicio
    clientNotificationService.initialize(clienteId);

    // Suscribirse a cambios
    const unsubscribe = clientNotificationService.subscribe(setNotifications);

    return unsubscribe;
  }, [clienteId]);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.leida).length,
    markAsRead: clientNotificationService.markAsRead.bind(clientNotificationService),
    markAllAsRead: clientNotificationService.markAllAsRead.bind(clientNotificationService),
    removeNotification: clientNotificationService.removeNotification.bind(clientNotificationService),
    clearAll: clientNotificationService.clearAll.bind(clientNotificationService),
    addNotification: clientNotificationService.addNotification.bind(clientNotificationService),
    // Métodos específicos
    notifyPromotion: clientNotificationService.notifyPromotion.bind(clientNotificationService),
    notifyPointsUpdate: clientNotificationService.notifyPointsUpdate.bind(clientNotificationService),
    notifyLevelProgress: clientNotificationService.notifyLevelProgress.bind(clientNotificationService),
    notifyMenuUpdate: clientNotificationService.notifyMenuUpdate.bind(clientNotificationService),
    notifyGeneral: clientNotificationService.notifyGeneral.bind(clientNotificationService),
  };
}
