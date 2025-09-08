'use client';

import React, { useState } from 'react';
import { Eye, Save, X } from 'lucide-react';

// Tipos de datos
type NivelTarjeta = 'Bronce' | 'Plata' | 'Oro' | 'Diamante' | 'Platino';

interface NivelConfig {
  colores: { gradiente: string[] };
  textoDefault: string;
  condicionesDefault: {
    puntosMinimos: number;
    gastosMinimos: number;
    visitasMinimas: number;
  };
  beneficioDefault: string;
}

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
}

// Configuración de niveles de tarjetas (constante fuera del componente)
const NIVELES_TARJETAS_CONFIG: Record<string, NivelConfig> = {
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

interface TarjetaEditorComponentProps {
  config: GeneralConfig;
  setConfig: (config: GeneralConfig) => void;
  showNotification: (message: string, type: NivelTarjeta) => void;
}

// Componente para edición de tarjetas
export default function TarjetaEditorComponent({
  config,
  setConfig,
  showNotification,
}: TarjetaEditorComponentProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('Bronce');
  const [nombrePersonalizado, setNombrePersonalizado] = useState(
    config.nivelesConfig[selectedLevel]?.nombrePersonalizado ||
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].textoDefault
  );
  const [textoCalidad, setTextoCalidad] = useState(
    config.nivelesConfig[selectedLevel]?.textoCalidad ||
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].textoDefault
  );
  const [nombreEmpresa, setNombreEmpresa] = useState(
    config.empresa.nombre || 'Lealta'
  );
  const [condiciones, setCondiciones] = useState(
    config.nivelesConfig[selectedLevel]?.condiciones ||
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].condicionesDefault
  );
  const [beneficio, setBeneficio] = useState(
    config.nivelesConfig[selectedLevel]?.beneficio ||
      NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].beneficioDefault
  );

  // Función para validar condiciones jerárquicas
  const validarCondicionesJerarquicas = (
    nivelActual: string,
    nuevasCondiciones: {
      puntosMinimos: number;
      gastosMinimos: number;
      visitasMinimas: number;
    }
  ) => {
    const niveles = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const indiceActual = niveles.indexOf(nivelActual);

    // Verificar que el nivel inferior tenga condiciones menores
    if (indiceActual > 0) {
      const nivelInferior = niveles[indiceActual - 1];
      const configInferior = config.nivelesConfig[nivelInferior];
      const defaultInferior = NIVELES_TARJETAS_CONFIG[nivelInferior as keyof typeof NIVELES_TARJETAS_CONFIG];

      const condicionesInferiores = configInferior?.condiciones || defaultInferior.condicionesDefault;

      if (
        nuevasCondiciones.puntosMinimos < condicionesInferiores.puntosMinimos ||
        nuevasCondiciones.gastosMinimos < condicionesInferiores.gastosMinimos ||
        nuevasCondiciones.visitasMinimas < condicionesInferiores.visitasMinimas
      ) {
        return `Las condiciones no pueden ser menores que ${nivelInferior}`;
      }
    }

    // Verificar que el nivel superior tenga condiciones mayores
    if (indiceActual < niveles.length - 1) {
      const nivelSuperior = niveles[indiceActual + 1];

      if (
        config.nivelesConfig[nivelSuperior] &&
        (nuevasCondiciones.puntosMinimos >= config.nivelesConfig[nivelSuperior].condiciones.puntosMinimos ||
          nuevasCondiciones.gastosMinimos >= config.nivelesConfig[nivelSuperior].condiciones.gastosMinimos ||
          nuevasCondiciones.visitasMinimas >= config.nivelesConfig[nivelSuperior].condiciones.visitasMinimas)
      ) {
        return `Las condiciones no pueden ser iguales o mayores que ${nivelSuperior}`;
      }
    }

    return null;
  };

  // Función para cambiar de nivel y actualizar los campos
  const cambiarNivel = (nuevoNivel: string) => {
    setSelectedLevel(nuevoNivel);

    // Cargar configuración existente o por defecto
    const configExistente = config.nivelesConfig[nuevoNivel];
    const configDefault = NIVELES_TARJETAS_CONFIG[nuevoNivel as keyof typeof NIVELES_TARJETAS_CONFIG];

    setNombrePersonalizado(
      configExistente?.nombrePersonalizado || configDefault.textoDefault
    );
    setTextoCalidad(
      configExistente?.textoCalidad || configDefault.textoDefault
    );
    setCondiciones(
      configExistente?.condiciones || configDefault.condicionesDefault
    );
    setBeneficio(
      configExistente?.beneficio || configDefault.beneficioDefault
    );
  };

  // Función para guardar configuración
  const guardarConfiguracion = () => {
    // Validar condiciones jerárquicas
    const errorValidacion = validarCondicionesJerarquicas(selectedLevel, condiciones);
    if (errorValidacion) {
      showNotification(errorValidacion, 'error' as NivelTarjeta);
      return;
    }

    const nuevaConfig = {
      ...config,
      empresa: {
        ...config.empresa,
        nombre: nombreEmpresa,
      },
      nivelesConfig: {
        ...config.nivelesConfig,
        [selectedLevel]: {
          nombrePersonalizado,
          textoCalidad,
          colores: NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores,
          condiciones,
          beneficio,
          empresa: {
            nombre: nombreEmpresa,
          },
        },
      },
    };

    setConfig(nuevaConfig);
    showNotification(
      `Configuración de tarjeta ${selectedLevel} guardada correctamente`,
      'success' as NivelTarjeta
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Eye className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">
          Editor de Tarjetas de Lealtad
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Panel de Edición */}
        <div className="space-y-6">
          {/* Selector de Nivel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Tarjeta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(NIVELES_TARJETAS_CONFIG).map((nivel) => (
                <button
                  key={nivel}
                  onClick={() => cambiarNivel(nivel)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    selectedLevel === nivel
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-800">
                    {nivel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de la Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Lealta"
            />
          </div>

          {/* Nombre Personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Personalizado de la Tarjeta
            </label>
            <input
              type="text"
              value={nombrePersonalizado}
              onChange={(e) => setNombrePersonalizado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Cliente Premium"
            />
          </div>

          {/* Texto de Calidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texto de Calidad
            </label>
            <input
              type="text"
              value={textoCalidad}
              onChange={(e) => setTextoCalidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Cliente Frecuente"
            />
          </div>

          {/* Condiciones */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">
              Condiciones para obtener esta tarjeta:
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntos mínimos
                </label>
                <input
                  type="number"
                  min="0"
                  value={condiciones.puntosMinimos}
                  onChange={(e) =>
                    setCondiciones({
                      ...condiciones,
                      puntosMinimos: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gastos mínimos ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={condiciones.gastosMinimos}
                  onChange={(e) =>
                    setCondiciones({
                      ...condiciones,
                      gastosMinimos: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visitas mínimas
                </label>
                <input
                  type="number"
                  min="0"
                  value={condiciones.visitasMinimas}
                  onChange={(e) =>
                    setCondiciones({
                      ...condiciones,
                      visitasMinimas: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Beneficio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficio
            </label>
            <textarea
              value={beneficio}
              onChange={(e) => setBeneficio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe los beneficios de esta tarjeta..."
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3">
            <button
              onClick={guardarConfiguracion}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={() => cambiarNivel(selectedLevel)}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>

        {/* Vista Previa de la Tarjeta */}
        <div className="flex justify-center items-start">
          <div className="w-72 h-44 relative transform rotate-0 hover:rotate-1 transition-transform">
            <div
              className="w-full h-full rounded-xl shadow-lg p-4 text-white relative overflow-hidden"
              style={{
                background: selectedLevel === 'default'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : `linear-gradient(135deg, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[0]}, ${NIVELES_TARJETAS_CONFIG[selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG].colores.gradiente[1]})`,
              }}
            >
              {/* Elementos decorativos */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20" />
              <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white/30" />
              
              {/* Contenido de la tarjeta */}
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold">{nombreEmpresa}</h3>
                  <p className="text-sm opacity-90">{nombrePersonalizado}</p>
                </div>
                
                <div>
                  <div className="text-xs opacity-75 mb-1">NIVEL</div>
                  <div className="font-semibold text-sm">{textoCalidad}</div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-xs">
                    <div>★★★★☆</div>
                  </div>
                  <div className="text-xs font-mono">
                    {selectedLevel.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
