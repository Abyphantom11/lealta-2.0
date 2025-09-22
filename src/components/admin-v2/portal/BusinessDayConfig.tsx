'use client';

import React, { useState, useCallback } from 'react';
import { Clock, Save, RefreshCw, Calendar } from 'lucide-react';
import { getBusinessDayDebugInfo } from '@/lib/business-day-utils';

interface BusinessDayConfigProps {
  businessId?: string;
  onConfigUpdate?: () => void;
}

export default function BusinessDayConfig({ businessId, onConfigUpdate }: Readonly<BusinessDayConfigProps>) {
  const [resetHour, setResetHour] = useState(4);
  const [resetMinute, setResetMinute] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadCurrentConfig = useCallback(async () => {
    try {
      // Cargar debug info
      const debug = await getBusinessDayDebugInfo(businessId);
      setDebugInfo(debug);
      
      // Usar configuración actual
      setResetHour(debug.config.resetHour);
      setResetMinute(debug.config.resetMinute || 0);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, [businessId]);

  // Cargar configuración inicial
  React.useEffect(() => {
    loadCurrentConfig();
  }, [loadCurrentConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/business/day-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(businessId && { 'x-business-id': businessId })
        },
        body: JSON.stringify({
          resetHour,
          resetMinute
        })
      });

      if (response.ok) {
        await loadCurrentConfig();
        setLastUpdate(new Date());
        onConfigUpdate?.();
        
        // Mostrar notificación de éxito
        alert('✅ Configuración de día comercial actualizada exitosamente');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'No se pudo guardar la configuración'}`);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('❌ Error de conexión al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const resetTimeString = `${resetHour.toString().padStart(2, '0')}:${resetMinute.toString().padStart(2, '0')}`;

  return (
    <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
      <div className="flex items-center mb-6">
        <Clock className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Configuración de Día Comercial
        </h4>
      </div>

      <div className="space-y-6">
        {/* Configuración de hora de reseteo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reset-hour" className="block text-sm font-medium text-white mb-2">
              Hora de Reseteo
            </label>
            <select
              id="reset-hour"
              value={resetHour}
              onChange={(e) => setResetHour(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="reset-minute" className="block text-sm font-medium text-white mb-2">
              Minutos
            </label>
            <select
              id="reset-minute"
              value={resetMinute}
              onChange={(e) => setResetMinute(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información actual */}
        {debugInfo && (
          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <h5 className="text-white font-medium mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Estado Actual
            </h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Día Natural:</span>
                <span className="text-white ml-2 capitalize">{debugInfo.naturalDay}</span>
              </div>
              <div>
                <span className="text-gray-400">Día Comercial:</span>
                <span className="text-white ml-2 capitalize">{debugInfo.businessDay}</span>
              </div>
              <div>
                <span className="text-gray-400">Hora Actual:</span>
                <span className="text-white ml-2">{new Date(debugInfo.currentTime).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Próximo Reseteo:</span>
                <span className="text-white ml-2">{resetTimeString}</span>
              </div>
            </div>
          </div>
        )}

        {/* Explicación */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <h5 className="text-blue-200 font-medium mb-2">¿Qué es el día comercial?</h5>
          <p className="text-blue-300 text-sm leading-relaxed">
            El día comercial define cuándo se actualizan las configuraciones diarias (banners, favorito del día, promociones). 
            Por ejemplo, con reseteo a las <strong>{resetTimeString}</strong>, el "lunes comercial" va desde las {resetTimeString} 
            del lunes hasta las {resetTimeString} del martes.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
          
          <button
            onClick={loadCurrentConfig}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {lastUpdate && (
          <p className="text-xs text-gray-400 text-center">
            Última actualización: {lastUpdate.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
