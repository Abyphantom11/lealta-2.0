'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

/**
 * Componente para analytics y reportes
 * Extraído del código original (líneas 4982-5031)
 * RESPONSABILIDAD: Dashboard de analytics y reportes
 */
const AnalyticsContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Analytics y Reportes</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Productos Más Vendidos
          </h4>
          <div className="space-y-4">
            <div className="text-center text-dark-400 py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-dark-500" />
              <p>Analytics disponible próximamente</p>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Ingresos Mensuales
          </h4>
          <div className="text-center text-dark-400 py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Reportes disponibles próximamente</p>
          </div>
        </div>

        <div className="premium-card">
          <h4 className="text-lg font-semibold text-white mb-4">
            Clientes Activos
          </h4>
          <div className="text-center text-dark-400 py-8">
            <Users className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p>Métricas disponibles próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsContent;
