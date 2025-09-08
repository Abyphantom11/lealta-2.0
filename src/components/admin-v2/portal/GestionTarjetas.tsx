'use client';

import React, { useState } from 'react';
import { CreditCard, Settings } from 'lucide-react';

interface GestionTarjetasProps {
  config: {
    nombreEmpresa?: string;
  };
  onUpdateConfig: (field: string, value: any) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const GestionTarjetas: React.FC<GestionTarjetasProps> = ({ config, onUpdateConfig, showNotification }) => {
  const [nombreEmpresa, setNombreEmpresa] = useState(config.nombreEmpresa || '');

  const handleUpdateNombreEmpresa = async () => {
    try {
      await onUpdateConfig('nombreEmpresa', nombreEmpresa);
      showNotification('Nombre de empresa actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error actualizando nombre:', error);
      showNotification('Error al actualizar el nombre de la empresa', 'error');
    }
  };

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          🎯 Gestión de Tarjetas de Lealtad
        </h4>
      </div>

      <div className="space-y-6">
        {/* Configuración del Nombre de la Empresa */}
        <div>
          <h5 className="text-white font-medium mb-2">
            Nombre de la Empresa en Tarjetas
          </h5>
          <p className="text-dark-400 text-sm mb-3">
            Este nombre aparecerá en la esquina inferior izquierda de todas las tarjetas. Los cambios se guardan automáticamente.
          </p>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              placeholder="Ingresa el nombre de tu empresa"
              className="flex-1 p-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={handleUpdateNombreEmpresa}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>

        {/* Información sobre los niveles de tarjetas */}
        <div>
          <h5 className="text-white font-medium mb-3">Configuración de Niveles de Tarjetas</h5>
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Bronce */}
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg p-3 text-white">
                  <h6 className="font-semibold text-sm">Bronce</h6>
                  <div className="text-xs mt-1 opacity-90">
                    <div>0+ puntos</div>
                    <div>$0+ gastos</div>
                    <div>0+ visitas</div>
                  </div>
                </div>

                {/* Plata */}
                <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg p-3 text-white">
                  <h6 className="font-semibold text-sm">Plata</h6>
                  <div className="text-xs mt-1 opacity-90">
                    <div>100+ puntos</div>
                    <div>$500+ gastos</div>
                    <div>5+ visitas</div>
                  </div>
                </div>

                {/* Oro */}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-3 text-white">
                  <h6 className="font-semibold text-sm">Oro</h6>
                  <div className="text-xs mt-1 opacity-90">
                    <div>500+ puntos</div>
                    <div>$2000+ gastos</div>
                    <div>15+ visitas</div>
                  </div>
                </div>

                {/* Platino */}
                <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg p-3 text-white">
                  <h6 className="font-semibold text-sm">Platino</h6>
                  <div className="text-xs mt-1 opacity-90">
                    <div>2500+ puntos</div>
                    <div>$8000+ gastos</div>
                    <div>50+ visitas</div>
                  </div>
                </div>

                {/* Diamante */}
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg p-3 text-white">
                  <h6 className="font-semibold text-sm">Diamante</h6>
                  <div className="text-xs mt-1 opacity-90">
                    <div>1500+ puntos</div>
                    <div>$5000+ gastos</div>
                    <div>30+ visitas</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-dark-400">
                <p className="mb-2">
                  <strong className="text-white">Asignación Automática:</strong> Los clientes reciben automáticamente el nivel de tarjeta más alto para el cual califican basado en sus puntos, gastos totales y número de visitas.
                </p>
                <p>
                  <strong className="text-white">Asignación Manual:</strong> Puedes asignar manualmente cualquier nivel de tarjeta a un cliente usando la herramienta de arriba.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones adicionales */}
        <div>
          <h5 className="text-white font-medium mb-3">Acciones Administrativas</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center p-4 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors">
              <Settings className="w-5 h-5 mr-2" />
              <span>Configurar Beneficios</span>
            </button>
            
            <button className="flex items-center justify-center p-4 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors">
              <CreditCard className="w-5 h-5 mr-2" />
              <span>Historial de Tarjetas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionTarjetas;
