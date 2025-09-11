'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
  // Determinar el icono según el tipo - Con punto de color
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />;
      case 'info':
        return <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />;
    }
  };

  // Determinar la clase según el tipo - Diseño profesional oscuro
  const getBgClass = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-dark-800/95 backdrop-blur-sm border border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20';
      case 'error':
        return 'bg-dark-800/95 backdrop-blur-sm border border-red-500/30 bg-gradient-to-r from-red-900/20 to-rose-900/20';
      case 'warning':
        return 'bg-dark-800/95 backdrop-blur-sm border border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-amber-900/20';
      case 'info':
        return 'bg-dark-800/95 backdrop-blur-sm border border-blue-500/30 bg-gradient-to-r from-blue-900/20 to-indigo-900/20';
      default:
        return 'bg-dark-800/95 backdrop-blur-sm border border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
      className={`rounded-xl shadow-2xl p-4 w-full max-w-md ${getBgClass()}`}
      layout
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm">{notification.title}</h3>
          {notification.isHTML ? (
            <div
              className="text-gray-300 text-sm mt-1 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: notification.message }}
            />
          ) : (
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">{notification.message}</p>
          )}
        </div>

        <button
          onClick={() => onClose(notification.id)}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors focus:outline-none"
          aria-label="Cerrar notificación"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
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
    <div className="fixed top-6 right-6 z-50 space-y-3 max-h-screen overflow-hidden pointer-events-none">
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
