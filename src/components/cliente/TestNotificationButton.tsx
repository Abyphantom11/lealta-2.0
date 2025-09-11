'use client';

import React from 'react';
import { useClientNotifications } from '@/services/clientNotificationService';

interface TestNotificationButtonProps {
  clienteId?: string;
  className?: string;
}

const TestNotificationButton: React.FC<TestNotificationButtonProps> = ({ 
  clienteId, 
  className = '' 
}) => {
  const {
    notifyPromotion,
    notifyPointsUpdate,
    notifyLevelProgress,
    notifyMenuUpdate,
    notifyGeneral,
  } = useClientNotifications(clienteId);

  const testNotifications = [
    {
      id: 'test-promocion',
      label: '🎉 Promoción',
      action: () => notifyPromotion(
        '🎉 ¡Oferta Especial!',
        'Descuento del 30% en bebidas hasta las 8 PM. ¡Aprovecha!',
        clienteId
      ),
    },
    {
      id: 'test-puntos',
      label: '⭐ Puntos',
      action: () => notifyPointsUpdate(50, clienteId),
    },
    {
      id: 'test-nivel',
      label: '🏆 Nivel',
      action: () => notifyLevelProgress('Plata', 200, clienteId),
    },
    {
      id: 'test-menu',
      label: '🍽️ Menú',
      action: () => notifyMenuUpdate(clienteId),
    },
    {
      id: 'test-general',
      label: '📢 General',
      action: () => notifyGeneral(
        '📢 Aviso Importante',
        'Recuerda que estaremos cerrados el domingo por mantenimiento.',
        clienteId
      ),
    },
  ];

  if (process.env.NODE_ENV !== 'development') {
    return null; // Solo mostrar en desarrollo
  }

  return (
    <div className={`fixed bottom-4 left-4 z-40 ${className}`}>
      <details className="bg-dark-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg">
        <summary className="px-3 py-2 text-xs text-gray-300 cursor-pointer hover:text-white">
          🧪 Test Notificaciones
        </summary>
        <div className="p-2 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-1">
            {testNotifications.map((test) => (
              <button
                key={test.id}
                onClick={test.action}
                className="px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded transition-colors"
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
};

export default TestNotificationButton;
