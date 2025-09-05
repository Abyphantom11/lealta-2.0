import React from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';

interface SSEStatusIndicatorProps {
  isConnected?: boolean;
  notificationsEnabled?: boolean;
  className?: string;
}

export function SSEStatusIndicator({ 
  isConnected = false, 
  notificationsEnabled = false,
  className = '' 
}: SSEStatusIndicatorProps) {
  const getStatusColor = () => {
    if (isConnected && notificationsEnabled) return 'text-green-400';
    if (isConnected) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (isConnected && notificationsEnabled) return 'Conectado + Notificaciones';
    if (isConnected) return 'Conectado';
    return 'Desconectado';
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      <div className="flex items-center space-x-1">
        {/* Indicador de conexión SSE */}
        {isConnected ? (
          <Wifi className={`w-3 h-3 ${getStatusColor()}`} />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        
        {/* Indicador de notificaciones */}
        {notificationsEnabled && (
          <Bell className="w-3 h-3 text-green-400" />
        )}
      </div>
      
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      
      {/* Pulso animado para conexión activa */}
      {isConnected && (
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${
            notificationsEnabled ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          <div className={`absolute inset-0 w-2 h-2 rounded-full animate-ping ${
            notificationsEnabled ? 'bg-green-400' : 'bg-yellow-400'
          } opacity-75`}></div>
        </div>
      )}
    </div>
  );
}
