'use client';

import React, { useState } from 'react';

// Tipos de datos exactos del admin original
interface TarjetaConfig {
  nombrePersonalizado: string;
  textoCalidad: string;
  colores: { gradiente: string[] };
  condiciones: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficio: string;
  empresa: {
    nombre: string;
  };
}

interface GeneralConfig {
  nivelesConfig: Record<string, TarjetaConfig>;
  empresa: {
    nombre: string;
  };
  nombreEmpresa?: string;
}

// Configuración exacta del admin original
const NIVELES_TARJETAS_CONFIG = {
  Bronce: {
    colores: { gradiente: ['#CD7F32', '#8B4513'] },
    textoDefault: 'Cliente Inicial',
    condicionesDefault: {
      puntosMinimos: 0,
      gastosMinimos: 0,
      visitasMinimas: 0,
    },
    beneficioDefault: 'Acumulación de puntos básica',
  },
  Plata: {
    colores: { gradiente: ['#C0C0C0', '#A8A8A8'] },
    textoDefault: 'Cliente Frecuente',
    condicionesDefault: {
      puntosMinimos: 100,
      gastosMinimos: 500,
      visitasMinimas: 5,
    },
    beneficioDefault: '5% descuento en compras',
  },
  Oro: {
    colores: { gradiente: ['#FFD700', '#FFA500'] },
    textoDefault: 'Cliente Premium',
    condicionesDefault: {
      puntosMinimos: 300,
      gastosMinimos: 1500,
      visitasMinimas: 15,
    },
    beneficioDefault: '10% descuento + invitaciones exclusivas',
  },
  Diamante: {
    colores: { gradiente: ['#B9F2FF', '#87CEEB'] },
    textoDefault: 'Cliente VIP',
    condicionesDefault: {
      puntosMinimos: 500,
      gastosMinimos: 3000,
      visitasMinimas: 25,
    },
    beneficioDefault: '15% descuento + eventos privados',
  },
  Platino: {
    colores: { gradiente: ['#E5E4E2', '#CCCCCC'] },
    textoDefault: 'Cliente Elite',
    condicionesDefault: {
      puntosMinimos: 1000,
      gastosMinimos: 5000,
      visitasMinimas: 50,
    },
    beneficioDefault: '20% descuento + concierge personal',
  },
};

interface TarjetaVistaPrevia {
  nombrePersonalizado: string;
  textoCalidad: string;
  nivel: string;
  colores?: { gradiente: string[] };
}

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

interface TarjetaVistaPreviaOriginalProps {
  config: GeneralConfig;
}

export default function TarjetaVistaPreviaOriginal({ config }: TarjetaVistaPreviaOriginalProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('Oro');

  // Crear tarjeta con configuración existente o default
  const tarjeta: TarjetaVistaPrevia = {
    nivel: selectedLevel,
    nombrePersonalizado: config.nivelesConfig?.[selectedLevel]?.nombrePersonalizado || `Tarjeta ${selectedLevel}`,
    textoCalidad: config.nivelesConfig?.[selectedLevel]?.textoCalidad ||
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].textoDefault,
    colores: config.nivelesConfig?.[selectedLevel]?.colores || 
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores,
  };

  // Nombre de empresa editable
  const nombreEmpresa = config.nombreEmpresa || config.empresa?.nombre || 'LEALTA';

  return (
    <div className="space-y-4">
      {/* Selector de nivel */}
      <div className="flex justify-center space-x-2">
        {Object.entries(NIVELES_TARJETAS_CONFIG).map(([nivel]) => (
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

      {/* Vista previa de la tarjeta EXACTA del admin original */}
      <div className="flex justify-center">
        <div className="relative w-80 h-48">
          <div
            className="absolute inset-0 rounded-xl shadow-2xl transform transition-all duration-300 border-2"
            style={{
              background: (tarjeta.colores && Array.isArray(tarjeta.colores.gradiente) && tarjeta.colores.gradiente.length >= 2)
                ? `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
                : `linear-gradient(135deg, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[0]}, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[1]})`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              borderColor: getLevelColors(selectedLevel),
            }}
          >
            {/* Overlay para contraste */}
            <div className="absolute inset-0 rounded-xl bg-black opacity-15" />

            {/* Efectos únicos por nivel - EXACTOS del admin original */}
            {selectedLevel === 'Bronce' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-amber-200 via-transparent to-amber-800" />
                {/* Partículas de bronce flotantes */}
                <div
                  className="absolute top-6 right-8 w-3 h-3 bg-amber-600 rounded-full opacity-40 animate-bounce"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-12 right-12 w-2 h-2 bg-amber-500 rounded-full opacity-50 animate-bounce"
                  style={{ animationDelay: '0.5s' }}
                />
                <div
                  className="absolute bottom-8 left-8 w-2.5 h-2.5 bg-amber-700 rounded-full opacity-45 animate-bounce"
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className="absolute bottom-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-35 animate-bounce"
                  style={{ animationDelay: '1.5s' }}
                />
                {/* Líneas decorativas */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" />
              </>
            )}

            {selectedLevel === 'Plata' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-15 bg-gradient-to-r from-gray-200 via-white to-gray-200" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
                {/* Efectos metálicos ondulantes */}
                <div
                  className="absolute top-4 left-4 w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 animate-pulse"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-8 left-8 w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-40 animate-pulse"
                  style={{ animationDelay: '0.7s' }}
                />
                <div
                  className="absolute top-12 left-12 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 animate-pulse"
                  style={{ animationDelay: '1.4s' }}
                />
                {/* Reflejos metálicos */}
                <div
                  className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white via-transparent to-gray-300 rounded-full opacity-10 animate-spin"
                  style={{ animationDuration: '8s' }}
                />
              </>
            )}

            {selectedLevel === 'Oro' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                {/* Partículas doradas brillantes */}
                <div
                  className="absolute top-8 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-ping"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-60 animate-ping"
                  style={{ animationDelay: '0.8s' }}
                />
                <div
                  className="absolute bottom-16 left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full opacity-50 animate-ping"
                  style={{ animationDelay: '1.6s' }}
                />
                <div
                  className="absolute bottom-20 left-20 w-1 h-1 bg-yellow-500 rounded-full opacity-80 animate-ping"
                  style={{ animationDelay: '2.4s' }}
                />
                {/* Rayos dorados */}
                <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-20 rotate-45 animate-pulse" />
                <div
                  className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 -rotate-45 animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
              </>
            )}

            {selectedLevel === 'Diamante' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-blue-200 via-transparent to-cyan-400" />
                {/* Efectos de cristal diamante */}
                <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse delay-300" />
                <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse delay-700" />
                <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full opacity-40 animate-pulse delay-1000" />
                <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-55 animate-pulse delay-500" />
                <div className="absolute bottom-8 right-12 w-2 h-2 bg-cyan-300 rounded-full opacity-45 animate-pulse delay-1200" />
                {/* Facetas de diamante */}
                <div
                  className="absolute top-4 left-4 w-16 h-16 border border-cyan-200 opacity-20 rotate-45 animate-spin"
                  style={{ animationDuration: '12s' }}
                />
                <div
                  className="absolute bottom-4 right-4 w-12 h-12 border border-blue-200 opacity-15 -rotate-12 animate-spin"
                  style={{ animationDuration: '15s' }}
                />
              </>
            )}

            {selectedLevel === 'Platino' && (
              <>
                <div className="absolute inset-0 rounded-xl opacity-25 bg-gradient-to-br from-gray-100 via-white to-gray-300" />
                <div className="absolute top-0 left-0 w-full h-full border-2 border-white rounded-xl opacity-10" />
                <div className="absolute top-2 left-2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-5" />
                {/* Efectos de lujo platino */}
                <div
                  className="absolute top-6 right-10 w-3 h-3 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-60 animate-pulse"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="absolute top-12 right-6 w-2 h-2 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full opacity-50 animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className="absolute bottom-10 left-10 w-2.5 h-2.5 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-70 animate-pulse"
                  style={{ animationDelay: '2s' }}
                />
                <div
                  className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
                {/* Líneas de elegancia */}
                <div
                  className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-25 animate-pulse"
                  style={{ animationDelay: '1.5s' }}
                />
                <div
                  className="absolute bottom-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
                  style={{ animationDelay: '2.5s' }}
                />
                {/* Corona de lujo */}
                <div
                  className="absolute top-1/2 left-1/2 w-40 h-40 border border-gray-200 rounded-full opacity-5 animate-spin"
                  style={{ animationDuration: '20s' }}
                />
              </>
            )}

            <div className="relative p-6 h-full flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-xl font-bold drop-shadow-lg text-white"
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                  >
                    {tarjeta.nombrePersonalizado}
                  </h3>
                </div>
              </div>

              {/* Chip con mejor contraste */}
              <div className="absolute top-16 left-6">
                <div
                  className="w-8 h-6 rounded-sm border"
                  style={{
                    background: getLevelGradient(selectedLevel),
                    borderColor: 'rgba(255,255,255,0.3)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
              </div>

              <div className="text-center">
                <div
                  className="text-lg font-bold tracking-widest mb-2 text-white"
                  style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}
                >
                  {tarjeta.nivel.toUpperCase()}
                </div>
                <p
                  className="text-sm font-medium text-white"
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
                  NIVEL {Object.keys(NIVELES_TARJETAS_CONFIG).indexOf(tarjeta.nivel as keyof typeof NIVELES_TARJETAS_CONFIG) + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
