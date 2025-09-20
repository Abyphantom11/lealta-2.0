'use client';

import React, { useState } from 'react';

interface Tarjeta {
  id?: string;
  nivel?: string;
  nombre?: string;
  descripcion?: string;
  puntosRequeridos?: number;
  beneficios?: string[];
  color?: string;
  activo?: boolean;
}

interface GeneralConfig {
  tarjetas?: Tarjeta[];
  nombreEmpresa?: string;
}

interface TarjetaPreviewProps {
  config: GeneralConfig;
}

const NIVELES_TARJETAS_CONFIG = {
  Bronce: { color: '#CD7F32', gradiente: ['#CD7F32', '#8B4513'] },
  Plata: { color: '#C0C0C0', gradiente: ['#C0C0C0', '#A8A8A8'] },
  Oro: { color: '#FFD700', gradiente: ['#FFD700', '#FFA500'] },
  Platino: { color: '#E5E4E2', gradiente: ['#E5E4E2', '#C0C0C0'] },
  Diamante: { color: '#B9F2FF', gradiente: ['#B9F2FF', '#87CEEB'] },
};

const TarjetaPreview: React.FC<TarjetaPreviewProps> = ({ config }) => {
  const [selectedLevel, setSelectedLevel] = useState('Bronce');
  const tarjetasActivas = config.tarjetas?.filter(tarjeta => tarjeta.activo) || [];

  return (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Vista Previa de Tarjetas</h3>
        
        <div className="mb-6">
          <label className="block text-white mb-2">Nivel de Tarjeta:</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full p-3 bg-dark-700 text-white rounded-lg border border-gray-600"
          >
            {Object.keys(NIVELES_TARJETAS_CONFIG).map(nivel => (
              <option key={nivel} value={nivel}>{nivel}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-80 h-48 rounded-2xl relative overflow-hidden shadow-xl">
            <div
              className="w-full h-full flex flex-col justify-between p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].gradiente[0]}, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].gradiente[1]})`
              }}
            >
              <div>
                <div className="text-lg font-bold">{config.nombreEmpresa || 'Mi Negocio'}</div>
                <div className="text-sm opacity-80">Tarjeta {selectedLevel}</div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">{selectedLevel}</div>
                <div className="text-sm opacity-80">Cliente Premium</div>
              </div>
            </div>
          </div>
        </div>

        {tarjetasActivas.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Tarjetas Configuradas</h4>
            <div className="grid gap-4">
              {tarjetasActivas.map((tarjeta, index) => (
                <div key={tarjeta.id || index} className="bg-dark-700 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-white font-medium">{tarjeta.nombre || tarjeta.nivel}</h5>
                      {tarjeta.descripcion && (
                        <p className="text-gray-300 text-sm">{tarjeta.descripcion}</p>
                      )}
                      {tarjeta.puntosRequeridos && (
                        <p className="text-gray-400 text-sm">Puntos requeridos: {tarjeta.puntosRequeridos}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tarjeta.color || '#888' }}
                      ></div>
                      {tarjeta.activo && (
                        <span className="text-green-400 text-sm">Activa</span>
                      )}
                    </div>
                  </div>
                  
                  {tarjeta.beneficios && tarjeta.beneficios.length > 0 && (
                    <div className="mt-2">
                      <p className="text-gray-400 text-sm mb-1">Beneficios:</p>
                      <ul className="list-disc list-inside text-gray-300 text-sm ml-2">
                        {tarjeta.beneficios.map((beneficio, idx) => (
                          <li key={idx}>{beneficio}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tarjetasActivas.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay tarjetas configuradas
          </div>
        )}
      </div>
    </div>
  );
};

export default TarjetaPreview;
