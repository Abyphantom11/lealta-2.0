'use client';

import React, { useState } from 'react';

// Configuración exacta del admin original
const nivelesConfig = {
  Bronce: {
    colores: { gradiente: ['#CD7F32', '#8B4513'] },
    textoDefault: 'Cliente Inicial',
  },
  Plata: {
    colores: { gradiente: ['#C0C0C0', '#808080'] },
    textoDefault: 'Cliente Frecuente',
  },
  Oro: {
    colores: { gradiente: ['#FFD700', '#FFA500'] },
    textoDefault: 'Cliente VIP',
  },
  Diamante: {
    colores: { gradiente: ['#B9F2FF', '#00CED1'] },
    textoDefault: 'Cliente Elite',
  },
  Platino: {
    colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
    textoDefault: 'Cliente Exclusivo',
  },
};

// Funciones helper exactas del admin original
const getLevelColors = (level: string) => {
  const colorMap: { [key: string]: string } = {
    Bronce: '#8B4513',
    Plata: '#808080',
    Oro: '#B8860B',
    Diamante: '#4169E1',
    Platino: '#71797E',
  };
  return colorMap[level] || '#71797E';
};

const getLevelGradient = (level: string) => {
  const gradientMap: { [key: string]: string } = {
    Bronce: 'linear-gradient(45deg, #DAA520, #B8860B)',
    Plata: 'linear-gradient(45deg, #E5E5E5, #C0C0C0)',
    Oro: 'linear-gradient(45deg, #FFD700, #FFA500)',
    Diamante: 'linear-gradient(45deg, #E0F6FF, #87CEEB)',
    Platino: 'linear-gradient(45deg, #F5F5F5, #D3D3D3)',
  };
  return gradientMap[level] || 'linear-gradient(45deg, #F5F5F5, #D3D3D3)';
};

interface TarjetaCompactaProps {
  config: {
    nivelesConfig?: Record<string, any>;
    empresa?: { nombre: string };
    nombreEmpresa?: string;
  };
}

// Componente compacto para vista previa de tarjetas (panel izquierdo)
export default function TarjetaCompacta({ config }: TarjetaCompactaProps) {
  const [selectedLevel, setSelectedLevel] = useState('Oro');
  
  const tarjeta = {
    nivel: selectedLevel,
    nombrePersonalizado: config.nivelesConfig?.[selectedLevel]?.nombrePersonalizado || `Tarjeta ${selectedLevel}`,
    textoCalidad: config.nivelesConfig?.[selectedLevel]?.textoCalidad ||
      nivelesConfig[selectedLevel as keyof typeof nivelesConfig].textoDefault,
    colores: config.nivelesConfig?.[selectedLevel]?.colores || 
      nivelesConfig[selectedLevel as keyof typeof nivelesConfig].colores,
  };

  const nombreEmpresa = config.nombreEmpresa || config.empresa?.nombre || 'Mi Negocio';

  return (
    <div className="space-y-4">
      {/* Selector de nivel */}
      <div className="flex justify-center space-x-2">
        {Object.entries(nivelesConfig).map(([nivel]) => (
          <button
            key={nivel}
            onClick={() => setSelectedLevel(nivel)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedLevel === nivel
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            {nivel}
          </button>
        ))}
      </div>

      {/* Vista previa de la tarjeta compacta para móvil */}
      <div className="flex justify-center">
        <div className="relative w-72 h-44">
          <div
            className="absolute inset-0 rounded-xl shadow-2xl transform transition-all duration-300 border-2"
            style={{
              background: (tarjeta.colores && Array.isArray(tarjeta.colores.gradiente) && tarjeta.colores.gradiente.length >= 2)
                ? `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
                : `linear-gradient(135deg, ${nivelesConfig[selectedLevel as keyof typeof nivelesConfig].colores.gradiente[0]}, ${nivelesConfig[selectedLevel as keyof typeof nivelesConfig].colores.gradiente[1]})`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              borderColor: getLevelColors(selectedLevel),
            }}
          >
            {/* Overlay para contraste */}
            <div className="absolute inset-0 rounded-xl bg-black opacity-15" />

            {/* Efectos únicos por nivel - versión compacta */}
            {selectedLevel === 'Oro' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                {/* Partículas doradas */}
                <div
                  className="absolute top-6 right-12 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-70 animate-ping"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute bottom-12 left-12 w-2 h-2 bg-yellow-200 rounded-full opacity-50 animate-ping"
                  style={{ animationDelay: '1.6s' }}
                />
              </>
            )}

            {selectedLevel === 'Diamante' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-blue-200 via-transparent to-cyan-400" />
                {/* Efectos cristalinos compactos */}
                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white rounded-full opacity-70 animate-pulse" />
                <div className="absolute bottom-6 left-6 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full opacity-40 animate-pulse delay-1000" />
              </>
            )}

            <div className="relative p-4 h-full flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-lg font-bold drop-shadow-lg text-white"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {tarjeta.nombrePersonalizado}
                  </h3>
                </div>
              </div>

              {/* Chip compacto */}
              <div className="absolute top-12 left-4">
                <div
                  className="w-6 h-4 rounded-sm border"
                  style={{
                    background: getLevelGradient(selectedLevel),
                    borderColor: 'rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>

              <div className="text-center">
                <div
                  className="text-base font-bold tracking-widest mb-1 text-white"
                  style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
                >
                  {tarjeta.nivel.toUpperCase()}
                </div>
                <p
                  className="text-xs font-medium text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {tarjeta.textoCalidad}
                </p>
              </div>

              <div
                className="flex justify-between items-end text-xs font-semibold text-white"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                <span>{nombreEmpresa}</span>
                <span>
                  NIVEL {Object.keys(nivelesConfig).indexOf(tarjeta.nivel as keyof typeof nivelesConfig) + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
