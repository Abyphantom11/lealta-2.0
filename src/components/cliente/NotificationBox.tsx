'use client';

import React, { useState } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientNotifications } from '@/services/clientNotificationService';
import PWAInstallButton from './PWAInstallButton';

interface NotificationBoxProps {
  className?: string;
  clienteId?: string;
}

const NotificationBox: React.FC<NotificationBoxProps> = ({ 
  className = '', 
  clienteId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    forceCleanStorage,
  } = useClientNotifications(clienteId);

  // Debug logs
  console.log('🔔 NotificationBox - clienteId:', clienteId);
  console.log('🔔 NotificationBox - notifications count:', notifications.length);
  console.log('🔔 NotificationBox - notifications:', notifications);

  // Filtrar notificaciones PWA para el render principal
  const pwaNotifications = notifications.filter(n => n.tipo === 'pwa');
  const otherNotifications = notifications.filter(n => n.tipo !== 'pwa');

  // Debug PWA notifications - información detallada
  console.log('🔧 Debug PWA notifications en NotificationBox:');
  console.log('📊 Total notifications:', notifications.length);
  console.log('📱 PWA notifications:', pwaNotifications.length);
  console.log('📱 PWA notification details:', pwaNotifications);
  console.log('🏠 Other notifications:', otherNotifications.length);
  
  // Debug específico para PWA
  pwaNotifications.forEach((notif, index) => {
    console.log(`📱 PWA ${index + 1}:`, {
      id: notif.id,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensaje: notif.mensaje,
      leida: notif.leida,
      fecha: notif.fecha
    });
  });

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'promocion': return '🎉';
      case 'puntos': return '⭐';
      case 'nivel': return '🏆';
      case 'menu': return '🍽️';
      case 'pwa': return '📱';
      default: return '🔔';
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'promocion': return 'from-green-500 to-emerald-500';
      case 'puntos': return 'from-yellow-500 to-orange-500';
      case 'nivel': return 'from-purple-500 to-pink-500';
      case 'menu': return 'from-blue-500 to-indigo-500';
      case 'pwa': return 'from-blue-600 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 60) {
      return minutos <= 1 ? 'Ahora' : `${minutos}m`;
    } else if (horas < 24) {
      return `${horas}h`;
    } else {
      return `${dias}d`;
    }
  };

  const marcarComoLeida = (id: string) => {
    markAsRead(id);
  };

  const eliminarNotificacion = (id: string) => {
    removeNotification(id);
  };

  const marcarTodasComoLeidas = () => {
    markAllAsRead();
  };

  const limpiarNotificaciones = () => {
    clearAll();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón de campanita */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para cerrar */}
            <button
              className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              aria-label="Cerrar panel de notificaciones"
            />

            {/* Box de notificaciones */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-dark-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl z-50 max-h-96 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Notificaciones</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={marcarTodasComoLeidas}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        title="Marcar todas como leídas"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={limpiarNotificaciones}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        title="Limpiar todas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {unreadCount} sin leer
                  </p>
                )}
              </div>

              {/* Lista de notificaciones */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notificacion) => (
                      <motion.div
                        key={notificacion.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 rounded-lg mb-2 border transition-all cursor-pointer ${
                          notificacion.leida
                            ? 'bg-dark-700/30 border-gray-700/30'
                            : 'bg-gradient-to-r from-dark-700/50 to-dark-600/50 border-blue-500/30'
                        }`}
                        onClick={() => marcarComoLeida(notificacion.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 bg-gradient-to-r ${getColorTipo(notificacion.tipo)} ${!notificacion.leida ? 'animate-pulse' : ''}`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${notificacion.leida ? 'text-gray-300' : 'text-white'}`}>
                                {getIconoTipo(notificacion.tipo)} {notificacion.titulo}
                              </h4>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatearFecha(notificacion.fecha)}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${notificacion.leida ? 'text-gray-500' : 'text-gray-300'}`}>
                              {notificacion.mensaje}
                            </p>
                            
                            {/* Botón especial para notificaciones PWA */}
                            {notificacion.tipo === 'pwa' && !notificacion.leida && (
                              <div className="mt-3 space-y-2">
                                <PWAInstallButton />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    marcarComoLeida(notificacion.id);
                                  }}
                                  className="w-full text-xs text-gray-400 hover:text-gray-300 transition-colors py-1"
                                >
                                  Recordar más tarde
                                </button>
                              </div>
                            )}

                            {/* Debug: Mostrar siempre un botón PWA para testing */}
                            {process.env.NODE_ENV === 'development' && notificacion.tipo === 'pwa' && (
                              <div className="mt-3 p-2 bg-blue-900/50 rounded">
                                <small className="text-blue-300 block mb-2">Debug PWA:</small>
                                <PWAInstallButton />
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarNotificacion(notificacion.id);
                            }}
                            className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debug PWA Rendering Section - Solo en desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 border-t border-yellow-600/50 bg-yellow-900/20">
                  <h4 className="text-yellow-300 text-xs font-semibold mb-2">🔧 Debug PWA Status:</h4>
                  <div className="text-xs space-y-1">
                    <div className="text-yellow-200">
                      📊 PWA Notifications: {pwaNotifications.length}
                    </div>
                    {pwaNotifications.map((notif, idx) => (
                      <div key={notif.id} className="text-yellow-100 bg-yellow-900/30 p-2 rounded">
                        <div>📱 PWA {idx + 1}: {notif.titulo}</div>
                        <div>📄 Mensaje: {notif.mensaje}</div>
                        <div>👁️ Leída: {notif.leida ? 'Sí' : 'No'}</div>
                        <div>🕒 Fecha: {notif.fecha.toLocaleTimeString()}</div>
                        <div className="mt-2">
                          <PWAInstallButton />
                        </div>
                      </div>
                    ))}
                    {pwaNotifications.length === 0 && (
                      <div className="text-yellow-300">❌ No hay notificaciones PWA</div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-3 border-t border-gray-700/50">
                <div className="flex gap-2">
                  <button
                    onClick={forceCleanStorage}
                    className="flex-1 text-xs text-center text-red-400 hover:text-red-300 transition-colors py-1 px-2 rounded border border-red-500/30 hover:bg-red-500/10"
                  >
                    🧹 Limpiar todas
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex-1 text-xs text-center text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 rounded border border-blue-500/30 hover:bg-blue-500/10"
                    >
                      ✅ Marcar leídas
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBox;
