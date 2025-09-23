'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Save, X, Eye } from 'lucide-react';

// Tipos unificados - COINCIDENTES CON JSON REAL
interface NivelTarjetaData {
  nombre: string;
  colores: string[];
  puntosRequeridos: number;
  visitasRequeridas: number;
  beneficio: string;
  descuento: number;
}

interface TarjetaConfig {
  nombre: string;
  descripcion: string;
  niveles: NivelTarjetaData[];
}

interface PortalConfig {
  tarjetas: TarjetaConfig[];
  nombreEmpresa: string;
  [key: string]: any;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface TarjetaEditorProps {
  readonly config: PortalConfig;
  readonly setConfig: (config: PortalConfig) => void;
  readonly showNotification: (message: string, type: NotificationType) => void;
}

const NIVELES_DEFAULT = [
  {
    nombre: 'Bronce',
    colores: ['#CD7F32', '#B8860B'],
    puntosRequeridos: 0,
    visitasRequeridas: 0,
    beneficio: 'Cliente Inicial',
    descuento: 0
  },
  {
    nombre: 'Plata',
    colores: ['#C0C0C0', '#E8E8E8'],
    puntosRequeridos: 500,
    visitasRequeridas: 10,
    beneficio: 'Cliente Frecuente',
    descuento: 5
  },
  {
    nombre: 'Oro',
    colores: ['#FFD700', '#FFA500'],
    puntosRequeridos: 1500,
    visitasRequeridas: 25,
    beneficio: 'Cliente VIP',
    descuento: 10
  },
  {
    nombre: 'Diamante',
    colores: ['#B9F2FF', '#00BFFF'],
    puntosRequeridos: 3000,
    visitasRequeridas: 50,
    beneficio: 'Cliente Premium',
    descuento: 15
  },
  {
    nombre: 'Platino',
    colores: ['#E5E4E2', '#B8B8B8'],
    puntosRequeridos: 5000,
    visitasRequeridas: 100,
    beneficio: 'Cliente Exclusivo',
    descuento: 20
  }
];

// 🎯 JERARQUÍA OFICIAL PARA ORDENAMIENTO
const JERARQUIA_NIVELES = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'] as const;

export default function TarjetaEditorUnified({
  config,
  setConfig,
  showNotification,
}: TarjetaEditorProps) {
  // 🔧 FUNCIONES AUXILIARES DECLARADAS PRIMERO
  
  // 🎯 FUNCIÓN PARA ORDENAR NIVELES POR JERARQUÍA
  const ordenarNivelesPorJerarquia = (niveles: NivelTarjetaData[]) => {
    return niveles.sort((a, b) => {
      const indexA = JERARQUIA_NIVELES.indexOf(a.nombre as any);
      const indexB = JERARQUIA_NIVELES.indexOf(b.nombre as any);
      return indexA - indexB;
    });
  };

  // 🔧 AUTO-CORRECCIÓN JERÁRQUICA AL CARGAR DATOS
  const autoCorrectHierarchy = (niveles: NivelTarjetaData[]): NivelTarjetaData[] => {
    const corrected = [...niveles];
    
    // Ordenar por jerarquía para aplicar correcciones
    corrected.sort((a, b) => {
      const indexA = JERARQUIA_NIVELES.indexOf(a.nombre as any);
      const indexB = JERARQUIA_NIVELES.indexOf(b.nombre as any);
      return indexA - indexB;
    });

    // Auto-corregir para mantener progresión lógica
    for (let i = 1; i < corrected.length; i++) {
      const current = corrected[i];
      const previous = corrected[i - 1];

      // Asegurar que cada nivel tenga valores progresivamente mayores
      if (current.puntosRequeridos <= previous.puntosRequeridos) {
        current.puntosRequeridos = previous.puntosRequeridos + 500;
        console.warn(`🔧 Auto-corregido: ${current.nombre} puntos ${current.puntosRequeridos}`);
      }

      if (current.visitasRequeridas <= previous.visitasRequeridas) {
        current.visitasRequeridas = previous.visitasRequeridas + 5;
        console.warn(`🔧 Auto-corregido: ${current.nombre} visitas ${current.visitasRequeridas}`);
      }

      if (current.descuento <= previous.descuento) {
        current.descuento = previous.descuento + 5;
        console.warn(`🔧 Auto-corregido: ${current.nombre} descuento ${current.descuento}%`);
      }
    }

    return corrected;
  };

  // Obtener la tarjeta actual o crear una por defecto
  const currentTarjeta = useMemo(() => {
    if (config.tarjetas && config.tarjetas.length > 0) {
      const tarjeta = config.tarjetas[0];
      // 🔧 APLICAR AUTO-CORRECCIÓN JERÁRQUICA CRÍTICA
      const correctedTarjeta = {
        ...tarjeta,
        niveles: ordenarNivelesPorJerarquia(autoCorrectHierarchy(tarjeta.niveles))
      };
      return correctedTarjeta;
    }
    // Crear tarjeta por defecto si no existe
    return {
      nombre: 'Tarjeta de Lealtad',
      descripcion: 'Acumula puntos y obtén beneficios exclusivos',
      niveles: NIVELES_DEFAULT
    };
  }, [config.tarjetas]);

  // Mostrar tabs para todos los niveles jerárquicos
  const niveles = currentTarjeta.niveles;

  // 🔧 INICIALIZAR selectedLevel con el primer nivel disponible
  const [selectedLevel, setSelectedLevel] = useState(() => {
    return niveles.length > 0 ? niveles[0].nombre : 'Bronce';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado local para los campos editables
  const [editedTarjeta, setEditedTarjeta] = useState<TarjetaConfig | null>(null);
  const [editedNivel, setEditedNivel] = useState<NivelTarjetaData | null>(null);

  // Calcular min/max jerárquico para el nivel seleccionado
  const getMinMaxForNivel = (nombreNivel: string) => {
    const nivelesOrdenados = ordenarNivelesPorJerarquia([...niveles]);
    const idx = nivelesOrdenados.findIndex(n => n.nombre === nombreNivel);
    
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    
    if (idx > 0) {
      min = nivelesOrdenados[idx - 1].puntosRequeridos + 1;
    }
    if (idx < nivelesOrdenados.length - 1) {
      max = nivelesOrdenados[idx + 1].puntosRequeridos - 1;
    }
    
    return { min, max };
  };

  const currentNivel = niveles.find(n => n.nombre === selectedLevel);
  const { min, max } = currentNivel ? getMinMaxForNivel(currentNivel.nombre) : { min: undefined, max: undefined };

  // Inicializar estados de edición cuando cambie el nivel seleccionado
  useEffect(() => {
    if (currentTarjeta && currentNivel) {
      setEditedTarjeta({ ...currentTarjeta });
      setEditedNivel({ ...currentNivel });
    }
  }, [selectedLevel, currentTarjeta, currentNivel]);

  // 🔧 EFECTO PARA SINCRONIZAR selectedLevel cuando cambien los niveles
  useEffect(() => {
    if (niveles.length > 0 && !niveles.find(n => n.nombre === selectedLevel)) {
      setSelectedLevel(niveles[0].nombre);
    }
  }, [niveles, selectedLevel]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Restaurar valores originales
    if (currentTarjeta && currentNivel) {
      setEditedTarjeta({ ...currentTarjeta });
      setEditedNivel({ ...currentNivel });
    }
  };

  const handleSave = async () => {
    if (!editedTarjeta || !editedNivel) return;

    setSaving(true);
    try {
      // Actualizar el nivel editado en la tarjeta
      const updatedNiveles = editedTarjeta.niveles.map(nivel =>
        nivel.nombre === selectedLevel ? editedNivel : nivel
      );

      // 🔧 APLICAR AUTO-CORRECCIÓN ANTES DE GUARDAR
      const correctedNiveles = autoCorrectHierarchy(updatedNiveles);

      const updatedTarjeta = {
        ...editedTarjeta,
        niveles: correctedNiveles
      };

      // Crear nueva configuración
      const newConfig = {
        ...config,
        tarjetas: [updatedTarjeta]
      };

      // Guardar en el servidor
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }

      // Actualizar el estado local
      setConfig(newConfig);
      setIsEditing(false);

      showNotification(
        `✅ Nivel ${selectedLevel} guardado correctamente`,
        'success'
      );
    } catch (error) {
      console.error('Error saving tarjeta:', error);
      showNotification('❌ Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 🛡️ VALIDACIÓN JERÁRQUICA ESTRICTA - CRÍTICA PARA INTEGRIDAD DEL SISTEMA
  const validateHierarchy = (
    field: 'puntosRequeridos' | 'visitasRequeridas' | 'descuento',
    newValue: number
  ): { isValid: boolean; message: string } => {
    if (!currentTarjeta?.niveles) return { isValid: true, message: '' };

    const fieldNameMap = {
      puntosRequeridos: 'puntos',
      visitasRequeridas: 'visitas',
      descuento: '% descuento'
    };
    const fieldName = fieldNameMap[field];
    const currentJerarquiaIndex = JERARQUIA_NIVELES.indexOf(selectedLevel as any);

    // ✅ VALIDAR CONTRA TODOS LOS OTROS NIVELES USANDO JERARQUÍA LÓGICA
    for (const otherLevel of currentTarjeta.niveles) {
      if (otherLevel.nombre === selectedLevel) continue;

      const otherValue = otherLevel[field] || 0;
      const otherJerarquiaIndex = JERARQUIA_NIVELES.indexOf(otherLevel.nombre as any);

      // Si el nivel actual está más arriba en la jerarquía (índice mayor)
      // DEBE tener valores ESTRICTAMENTE MAYORES
      if (currentJerarquiaIndex > otherJerarquiaIndex) {
        if (newValue <= otherValue) {
          return {
            isValid: false,
            message: `❌ ${selectedLevel} debe tener MÁS ${fieldName} que ${otherLevel.nombre} (actual: ${otherValue})`,
          };
        }
      }
      // Si el nivel actual está más abajo en la jerarquía (índice menor)  
      // DEBE tener valores ESTRICTAMENTE MENORES
      else if (currentJerarquiaIndex < otherJerarquiaIndex) {
        if (newValue >= otherValue) {
          return {
            isValid: false,
            message: `❌ ${selectedLevel} debe tener MENOS ${fieldName} que ${otherLevel.nombre} (actual: ${otherValue})`,
          };
        }
      }
    }

    return { isValid: true, message: '✅ Jerarquía respetada' };
  };

  const handleNivelFieldChange = (
    field: keyof NivelTarjetaData,
    value: any
  ) => {
    if (!editedNivel) return;

    // 🛡️ VALIDACIÓN JERÁRQUICA CRÍTICA - PUNTOS, VISITAS Y DESCUENTOS
    if (field === 'puntosRequeridos' || field === 'visitasRequeridas' || field === 'descuento') {
      const validation = validateHierarchy(
        field,
        parseInt(value) || 0
      );

      if (!validation.isValid) {
        showNotification(validation.message, 'error');
        return; // 🚫 BLOQUEAR CAMBIO QUE ROMPE JERARQUÍA
      }
    }

    setEditedNivel({
      ...editedNivel,
      [field]: value,
    });
  };

  const handleTarjetaFieldChange = (field: keyof TarjetaConfig, value: any) => {
    if (!editedTarjeta) return;

    setEditedTarjeta({
      ...editedTarjeta,
      [field]: value,
    });
  };

  if (!currentTarjeta || !currentNivel) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">
          No hay configuración de tarjetas disponible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs de niveles */}
      <div className="flex gap-2 mb-4">
        {niveles.map((nivel) => (
          <button
            key={nivel.nombre}
            className={`px-4 py-2 rounded-lg font-semibold ${selectedLevel === nivel.nombre ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
            onClick={() => setSelectedLevel(nivel.nombre)}
          >
            {nivel.nombre}
          </button>
        ))}
      </div>

      {/* Editor del nivel seleccionado */}
      {currentNivel && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Editando: {currentNivel.nombre}</h3>
          <div className="mb-2 text-sm text-gray-400">
            Debug: min={min ?? ''}, max={max ?? ''}
          </div>
          {min === undefined && (
            <div className="text-xs text-blue-400">🔽 Este es el nivel más bajo</div>
          )}
          {max === undefined && (
            <div className="text-xs text-yellow-400">🔼 Este es el nivel más alto</div>
          )}
          <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">
                  Editor de Tarjetas de Lealtad
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Selector de Nivel */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Editando: Tarjeta {selectedLevel}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Nombre personalizado del nivel */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre Personalizado
                  </label>
                  <input
                    type="text"
                    value={editedNivel?.nombre || ''}
                    onChange={e => handleNivelFieldChange('nombre', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={selectedLevel}
                  />
                </div>

                {/* Color primario del nivel */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color Primario del Nivel
                  </label>
                  <input
                    type="color"
                    value={editedNivel?.colores?.[0] || '#000000'}
                    onChange={e => {
                      if (!editedNivel) return;
                      const newColores = [...(editedNivel.colores || ['#000000', '#000000'])];
                      newColores[0] = e.target.value;
                      handleNivelFieldChange('colores', newColores);
                    }}
                    disabled={!isEditing}
                    className="w-full h-10 px-1 py-1 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Color secundario del nivel */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color Secundario del Nivel
                  </label>
                  <input
                    type="color"
                    value={editedNivel?.colores?.[1] || '#000000'}
                    onChange={e => {
                      if (!editedNivel) return;
                      const newColores = [...(editedNivel.colores || ['#000000', '#000000'])];
                      newColores[1] = e.target.value;
                      handleNivelFieldChange('colores', newColores);
                    }}
                    disabled={!isEditing}
                    className="w-full h-10 px-1 py-1 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Puntos requeridos */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Puntos Requeridos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedNivel?.puntosRequeridos || 0}
                    onChange={e => handleNivelFieldChange('puntosRequeridos', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Visitas requeridas */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Visitas Requeridas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedNivel?.visitasRequeridas || 0}
                    onChange={e => handleNivelFieldChange('visitasRequeridas', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Beneficio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Beneficio
                </label>
                <input
                  type="text"
                  value={editedNivel?.beneficio || ''}
                  onChange={e => handleNivelFieldChange('beneficio', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Descripción del beneficio"
                />
              </div>
            </div>

            {/* Vista previa de la tarjeta */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Vista Previa - {selectedLevel}
              </h3>
              
              <div 
                className="w-80 h-48 rounded-lg p-6 text-white shadow-lg mx-auto"
                style={{ 
                  background: `linear-gradient(135deg, ${editedNivel?.colores?.[0] || '#000000'}, ${editedNivel?.colores?.[1] || '#000000'})` 
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{editedTarjeta?.nombre}</h4>
                    <p className="text-sm opacity-90">{config.nombreEmpresa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{editedNivel?.nombre}</p>
                    <p className="text-xs opacity-75">{editedNivel?.descuento}% OFF</p>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <p className="text-xs opacity-75 mb-2">{editedNivel?.beneficio}</p>
                  <div className="flex justify-between text-xs">
                    <span>{editedNivel?.puntosRequeridos}+ puntos</span>
                    <span>{editedNivel?.visitasRequeridas}+ visitas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
