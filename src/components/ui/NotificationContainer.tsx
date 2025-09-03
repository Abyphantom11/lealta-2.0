'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import notificationService, {
  Notification as NotificationType,
} from '@/lib/notificationService';

/**
 * Componente NotificationItem para mostrar una única notificación
 */
const NotificationItem: React.FC<{
  notification: NotificationType;
  onClose: (id: string) => void;
}> = ({ notification, onClose }) => {
  // Determinar el icono según el tipo
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return null;
    }
  };

  // Determinar la clase según el tipo
  const getBgClass = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`rounded-lg shadow-md border p-4 w-full max-w-md flex ${getBgClass()}`}
      layout
    >
      <div className="flex-shrink-0 mr-3 pt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium">{notification.title}</h3>
        {notification.isHTML ? (
          <div
            className="text-sm text-gray-600 mt-1"
            dangerouslySetInnerHTML={{ __html: notification.message }}
          />
        ) : (
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        )}
      </div>

      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Cerrar notificación"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
};

/**
 * Componente NotificationContainer para mostrar todas las notificaciones
 */
const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    // Suscribirse al servicio de notificaciones
    const unsubscribe = notificationService.subscribe(setNotifications);
    return () => unsubscribe();
  }, []);

  const handleClose = (id: string) => {
    notificationService.removeNotification(id);
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-hidden pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onClose={handleClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
