'use client';

import React from 'react';
import { Settings } from 'lucide-react';

/**
 * Componente para configuración del sistema
 * Extraído del código original (líneas 5032-5095)
 * RESPONSABILIDAD: Configuración general del sistema
 */
const ConfiguracionContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-primary-500" />
        <h3 className="text-xl font-semibold text-white">
          Configuración del Sistema
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración General
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Nombre del Negocio</span>
              <input
                type="text"
                defaultValue="Mi Restaurante"
                className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Moneda</span>
              <select className="px-3 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:ring-2 focus:ring-primary-500">
                <option>USD</option>
                <option>EUR</option>
                <option>COP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Configuración del Portal
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Registro automático</span>
              <button className="w-12 h-6 bg-success-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Notificaciones push</span>
              <button className="w-12 h-6 bg-dark-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h5 className="text-white font-medium mb-2">ℹ️ Información del Sistema</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-dark-400">Versión:</span>
            <span className="text-white ml-2">Lealta 2.0</span>
          </div>
          <div>
            <span className="text-dark-400">Última actualización:</span>
            <span className="text-white ml-2">Sep 2025</span>
          </div>
          <div>
            <span className="text-dark-400">Estado:</span>
            <span className="text-success-400 ml-2">✓ Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionContent;
