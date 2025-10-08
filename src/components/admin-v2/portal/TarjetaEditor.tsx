'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import { Tarjeta, GeneralConfig, NivelTarjeta } from './types';

const NIVELES_TARJETAS_CONFIG = {
  Bronce: {
    textoDefault: 'Cliente Premium',
    colores: {
      gradiente: ['#CD7F32', '#8B4513'],
      texto: '#FFFFFF',
      nivel: '#CD7F32',
    },
    condicionesDefault: { puntosMinimos: 0, visitasMinimas: 0 },
    beneficioDefault: 'Acceso a promociones exclusivas',
  },
  Plata: {
    textoDefault: 'Cliente VIP',
    colores: {
      gradiente: ['#C0C0C0', '#808080'],
      texto: '#FFFFFF',
      nivel: '#C0C0C0',
    },
    condicionesDefault: { puntosMinimos: 100, visitasMinimas: 5 },
    beneficioDefault: '5% de descuento en compras',
  },
  Oro: {
    textoDefault: 'Cliente Premium',
    colores: {
      gradiente: ['#FFD700', '#FFA500'],
      texto: '#000000',
      nivel: '#FFD700',
    },
    condicionesDefault: { puntosMinimos: 500, visitasMinimas: 10 },
    beneficioDefault: '10% de descuento en compras',
  },
  Diamante: {
    textoDefault: 'Cliente VIP',
    colores: {
      gradiente: ['#B9F2FF', '#0891B2'],
      texto: '#FFFFFF',
      nivel: '#B9F2FF',
    },
    condicionesDefault: { puntosMinimos: 1500, visitasMinimas: 20 },
    beneficioDefault: '15% de descuento en compras',
  },
  Platino: {
    textoDefault: 'Cliente Elite',
    colores: {
      gradiente: ['#E5E4E2', '#717171'],
      texto: '#000000',
      nivel: '#E5E4E2',
    },
    condicionesDefault: { puntosMinimos: 3000, visitasMinimas: 30 },
    beneficioDefault: '20% de descuento en compras',
  },
};

interface TarjetaEditorProps {
  readonly config: GeneralConfig;
  readonly onUpdateCard: (nivel: string, updates: Partial<Tarjeta>) => Promise<void>;
  readonly onUpdateNombreEmpresa: (nombreEmpresa: string) => Promise<void>;
  readonly showNotification: (message: string, type: NivelTarjeta) => void;
}

export default function TarjetaEditor({
  config,
  onUpdateCard,
  onUpdateNombreEmpresa,
  showNotification,
}: TarjetaEditorProps) {
  const [selectedLevel, setSelectedLevel] = useState('Oro');
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaChanged, setEmpresaChanged] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tempNombreEmpresa, setTempNombreEmpresa] = useState(config.nombreEmpresa || '');

  // Sincronizar estado temporal cuando cambie el config
  useEffect(() => {
    setTempNombreEmpresa(config.nombreEmpresa || '');
  }, [config.nombreEmpresa]);

  const currentTarjeta = useMemo(() => {
    // Buscar tarjeta existente en la configuración
    const existingCard = (config.tarjetas || []).find(
      (t: Tarjeta) => t.nivel === selectedLevel
    );
    
    if (existingCard) {
      // Si existe, usar los valores guardados
      return existingCard;
    }
    
    // Si no existe, crear una nueva con valores editables
    const defaultConfig = NIVELES_TARJETAS_CONFIG[
      selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG
    ];
    
    return {
      nivel: selectedLevel,
      nombrePersonalizado: `Tarjeta ${selectedLevel}`,
      textoCalidad: defaultConfig.textoDefault,
      colores: defaultConfig.colores,
      condiciones: {
        puntosMinimos: defaultConfig.condicionesDefault.puntosMinimos,
        visitasMinimas: defaultConfig.condicionesDefault.visitasMinimas,
      },
      beneficio: defaultConfig.beneficioDefault,
      activo: true,
    };
  }, [config.tarjetas, selectedLevel]);

  // Inicializar automáticamente en modo edición
  useEffect(() => {
    setEditingCard({ ...currentTarjeta });
  }, [currentTarjeta]);

  // Actualizar editingCard cuando cambie selectedLevel
  useEffect(() => {
    setEditingCard({ ...currentTarjeta });
    setHasUnsavedChanges(false); // Reset unsaved changes cuando cambias de nivel
    setValidationErrors([]); // Limpiar errores de validación cuando cambias de nivel
  }, [selectedLevel, currentTarjeta]);

  // 🎯 Función para obtener jerarquía de niveles ordenada
  const JERARQUIA_NIVELES = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  
  // 🛡️ Función para validar restricciones jerárquicas mejorada
  const validateHierarchy = (level: string, points: number): { 
    isValid: boolean; 
    errors: string[]; 
    maxAllowedPoints?: number;
    minRequiredPoints?: number;
  } => {
    const errors: string[] = [];
    const currentIndex = JERARQUIA_NIVELES.indexOf(level);
    
    if (currentIndex === -1) {
      return { isValid: false, errors: ['Nivel no válido'] };
    }
    
    // ✅ MEJORADO: Construir snapshot completo de todas las tarjetas
    const allCards = [...(config.tarjetas || [])];
    
    // Si estamos editando, simular el estado actualizado
    if (editingCard) {
      const editingIndex = allCards.findIndex(c => c.nivel === editingCard.nivel);
      if (editingIndex >= 0) {
        // Actualizar la tarjeta existente con los valores actuales del form
        allCards[editingIndex] = { ...editingCard };
      } else {
        // Agregar nueva tarjeta si no existe
        allCards.push(editingCard);
      }
    }
    
    // 🔍 LÍMITE SUPERIOR: Buscar el nivel inmediatamente superior que tenga configuración
    let maxAllowedPoints: number | undefined;
    const nivelesSuperiores = JERARQUIA_NIVELES.slice(currentIndex + 1);
    
    for (const nivelSuperior of nivelesSuperiores) {
      const higherCard = allCards.find(card => card.nivel === nivelSuperior);
      if (higherCard && higherCard.condiciones && typeof higherCard.condiciones.puntosMinimos === 'number') {
        maxAllowedPoints = higherCard.condiciones.puntosMinimos - 1;
        
        if (points >= higherCard.condiciones.puntosMinimos) {
          errors.push(`${level} no puede tener ${points} puntos o más porque ${nivelSuperior} requiere ${higherCard.condiciones.puntosMinimos}. Máximo permitido: ${maxAllowedPoints}`);
        }
        break;
      }
    }
    
    // 🔍 LÍMITE INFERIOR: Buscar el nivel inmediatamente inferior que tenga configuración  
    let minRequiredPoints: number | undefined;
    const nivelesInferiores = JERARQUIA_NIVELES.slice(0, currentIndex).reverse();
    
    for (const nivelInferior of nivelesInferiores) {
      const lowerCard = allCards.find(card => card.nivel === nivelInferior);
      if (lowerCard && lowerCard.condiciones && typeof lowerCard.condiciones.puntosMinimos === 'number') {
        minRequiredPoints = lowerCard.condiciones.puntosMinimos + 1;
        
        if (points <= lowerCard.condiciones.puntosMinimos) {
          errors.push(`${level} debe tener más de ${lowerCard.condiciones.puntosMinimos} puntos porque ${nivelInferior} ya requiere ${lowerCard.condiciones.puntosMinimos}. Mínimo requerido: ${minRequiredPoints}`);
        }
        break;
      }
    }
    
    // 🔍 CASO ESPECIAL: Si es el primer nivel (Bronce), mínimo 0
    if (currentIndex === 0) {
      minRequiredPoints = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      maxAllowedPoints,
      minRequiredPoints
    };
  };

  // Función auxiliar para normalizar condiciones de tarjeta
  const normalizeCardConditions = (card: Tarjeta & { id?: string }) => {
    return {
      ...card,
      id: card.id || `tarjeta_${card.nivel}_${Date.now()}`,
      condiciones: {
        ...card.condiciones,
        puntosMinimos:
          typeof card.condiciones?.puntosMinimos === 'number'
            ? card.condiciones.puntosMinimos
            : 0,
        visitasMinimas:
          typeof card.condiciones?.visitasMinimas === 'number'
            ? card.condiciones.visitasMinimas
            : 0,
      },
    };
  };

  // ✅ ELIMINADO: updateLocalCards - ya no se necesita, se maneja por callback

  // Función auxiliar para persistir cambios
  // ✅ ELIMINADO: persistCardChanges - ahora usa callback del padre

  const handleSave = async () => {
    if (!editingCard) return;

    // 🛡️ Validar jerarquía antes de guardar
    const validation = validateHierarchy(
      selectedLevel,
      editingCard.condiciones?.puntosMinimos || 0
    );

    if (!validation.isValid) {
      showNotification(
        `❌ No se puede guardar: ${validation.errors[0]}`,
        'error'
      );
      setValidationErrors(validation.errors);
      return; // Prevenir guardado
    }

    try {
      setIsSaving(true);
      const cardToSave = normalizeCardConditions(editingCard);
      
      // ✅ NUEVO: Usar callback del padre para persistir
      await onUpdateCard(selectedLevel, cardToSave);

      showNotification(
        `✅ Tarjeta ${cardToSave.nivel} guardada correctamente`,
        'success'
      );
      setHasUnsavedChanges(false);
      setValidationErrors([]); // Limpiar errores al guardar exitosamente
    } catch (error) {
      console.error('Error guardando tarjeta:', error);
      showNotification(
        '❌ Error al guardar los cambios de la tarjeta',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Función para manejar cambios en los campos
  const handleFieldChange = (field: string, value: any) => {
    setEditingCard({ ...editingCard, [field]: value });
    setHasUnsavedChanges(true);
  };

  const handleConditionChange = (field: string, value: any) => {
    const updatedCard = {
      ...editingCard,
      condiciones: {
        ...editingCard.condiciones,
        [field]: value,
      },
    };
    
    // 🛡️ Validar jerarquía solo para puntos mínimos
    if (field === 'puntosMinimos' && typeof value === 'number') {
      const validation = validateHierarchy(
        selectedLevel, 
        value
      );
      
      setValidationErrors(validation.errors);
      
      // Si hay errores, mostrar notificación pero permitir el cambio temporal
      if (!validation.isValid) {
        // Mostrar primer error como notificación
        showNotification(validation.errors[0], 'error');
      }
    } else {
      // Para otros campos, limpiar errores
      setValidationErrors([]);
    }
    
    setEditingCard(updatedCard);
    setHasUnsavedChanges(true);
  };

  const handleSaveEmpresaManual = async () => {
    try {
      setSavingEmpresa(true);

      // ✅ NUEVO: Usar callback del padre para persistir
      await onUpdateNombreEmpresa(tempNombreEmpresa);

      showNotification(
        '✅ Nombre de empresa guardado correctamente',
        'success'
      );
      setEmpresaChanged(false);
    } catch (error) {
      console.error('Error guardando nombre empresa:', error);
      showNotification('❌ Error al guardar el nombre de la empresa', 'error');
    } finally {
      setSavingEmpresa(false);
    }
  };

  // ===========================================
  // 🎨 RENDER PRINCIPAL
  // ===========================================
  return (
    <div className="space-y-6">
      {/* Header del editor con warning de cambios sin guardar */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between p-4 bg-amber-900/30 border border-amber-600/50 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-amber-400 mr-2" />
            <span className="text-amber-300 font-medium">
              Tienes cambios sin guardar
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      )}

      {/* Nombre de la Empresa */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h5 className="text-white font-medium mb-3">
          Nombre de la Empresa en Tarjetas
        </h5>
        <div className="flex space-x-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={tempNombreEmpresa}
              onChange={e => {
                setTempNombreEmpresa(e.target.value);
                setHasUnsavedChanges(true);
                setEmpresaChanged(true); // ✅ ACTIVAR INDICADOR DE CAMBIOS
              }}
              placeholder="Nombre de tu empresa"
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none pr-10"
            />
            {savingEmpresa && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {empresaChanged && (
          <div className="flex items-center justify-between mt-2 p-2 bg-amber-900/30 border border-amber-600/50 rounded-lg">
            <span className="text-sm text-amber-300">
              ⚠️ Hay cambios sin guardar
            </span>
            <button
              onClick={handleSaveEmpresaManual}
              disabled={savingEmpresa}
              className="px-3 py-1 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {savingEmpresa ? (
                <>
                  <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>
              ) : (
                '💾 Guardar'
              )}
            </button>
          </div>
        )}
        <p className="text-dark-400 text-sm mt-2">
          Este nombre aparecerá en la esquina inferior izquierda de todas las
          tarjetas. Los cambios se guardan automáticamente.
        </p>
      </div>

      {/* Selector de nivel */}
      <div className="mb-6">
        <h5 className="text-white font-medium mb-3">Seleccionar Nivel</h5>
        <div className="grid grid-cols-5 gap-2">
          {Object.keys(NIVELES_TARJETAS_CONFIG).map(nivel => (
            <button
              key={nivel}
              onClick={() => setSelectedLevel(nivel)}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedLevel === nivel
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <div className="text-sm font-medium">{nivel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h6 className="text-white font-medium">
            Editando: Tarjeta {selectedLevel}
          </h6>
        </div>

        {editingCard && (
          <div className="space-y-6">{/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre-personalizado"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Nombre Personalizado
                </label>
                <input
                  id="nombre-personalizado"
                  type="text"
                  value={editingCard.nombrePersonalizado}
                  onChange={e =>
                    handleFieldChange('nombrePersonalizado', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="texto-calidad"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Texto de Calidad
                </label>
                <input
                  id="texto-calidad"
                  type="text"
                  value={editingCard.textoCalidad}
                  onChange={e =>
                    handleFieldChange('textoCalidad', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Condiciones para obtener la tarjeta */}
            <div>
              <h6 className="text-white font-medium mb-3">
                Condiciones para Obtener este Nivel
              </h6>
              <p className="text-sm text-dark-400 mb-3">
                El cliente obtiene la tarjeta si cumple{' '}
                <strong>cualquiera</strong> de estas condiciones:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="puntos-minimos"
                    className="block text-sm text-dark-300 mb-1"
                  >
                    Puntos mínimos
                  </label>
                  <input
                    id="puntos-minimos"
                    type="text"
                    inputMode="numeric"
                    value={editingCard.condiciones?.puntosMinimos?.toString() || ''}
                    onChange={e => {
                      const value = e.target.value;
                      // Permitir campo completamente vacío o solo números
                      if (value === '' || /^\d+$/.test(value)) {
                        handleConditionChange('puntosMinimos', value === '' ? undefined : Number(value));
                      }
                    }}
                    placeholder="Ej: 500"
                    className={`w-full px-3 py-2 bg-dark-700 border rounded-lg text-white focus:outline-none transition-colors ${
                      validationErrors.length > 0 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-dark-600 focus:border-primary-500'
                    }`}
                  />
                  {/* 💡 Mostrar límites jerárquicos como ayuda */}
                  {(() => {
                    const currentPoints = editingCard.condiciones?.puntosMinimos || 0;
                    const validation = validateHierarchy(selectedLevel, currentPoints);
                    
                    return (
                      <div className="mt-1 text-xs">
                        {/* 🔍 DEBUG: Mostrar valores para diagnosticar */}
                        <p className="text-gray-400 text-xs">
                          Debug: min={validation.minRequiredPoints}, max={validation.maxAllowedPoints}
                        </p>
                        
                        {validation.minRequiredPoints !== undefined && (
                          <p className="text-yellow-400">
                            💡 Mínimo: {validation.minRequiredPoints} puntos
                          </p>
                        )}
                        {validation.maxAllowedPoints !== undefined && (
                          <p className="text-blue-400">
                            💡 Máximo: {validation.maxAllowedPoints} puntos
                          </p>
                        )}
                        {validation.minRequiredPoints === undefined && validation.maxAllowedPoints === undefined && (
                          <p className="text-gray-400">
                            💬 Este es el nivel más alto o no hay otros niveles configurados
                          </p>
                        )}
                        {validation.errors.length > 0 && (
                          <div className="mt-1">
                            {validation.errors.map((error, index) => (
                              <p key={index} className="text-red-400 text-xs">
                                ⚠️ {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label
                    htmlFor="visitas-minimas"
                    className="block text-sm text-dark-300 mb-1"
                  >
                    Visitas mínimas
                  </label>
                  <input
                    id="visitas-minimas"
                    type="text"
                    inputMode="numeric"
                    value={editingCard.condiciones?.visitasMinimas?.toString() || ''}
                    onChange={e => {
                      const value = e.target.value;
                      // Permitir campo completamente vacío o solo números
                      if (value === '' || /^\d+$/.test(value)) {
                        handleConditionChange('visitasMinimas', value === '' ? undefined : Number(value));
                      }
                    }}
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
              
              {/* 🛡️ Mostrar errores de validación jerárquica */}
              {validationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-red-400 mt-0.5">⚠️</div>
                    <div>
                      <h6 className="text-red-400 font-medium text-sm mb-2">
                        Restricciones Jerárquicas
                      </h6>
                      <ul className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-red-300 text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                      <p className="text-red-300 text-xs mt-2 opacity-80">
                        💡 La jerarquía debe ser: Bronce &lt; Plata &lt; Oro &lt; Diamante &lt; Platino
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Beneficio del nivel */}
            <div>
              <h6 className="text-white font-medium mb-3">
                Beneficio de este Nivel
              </h6>
              <textarea
                value={editingCard.beneficio || ''}
                onChange={e => handleFieldChange('beneficio', e.target.value)}
                placeholder="Describe el beneficio principal que obtienen los clientes con este nivel de tarjeta"
                rows={3}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            {/* Estado activo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={editingCard.activo}
                onChange={e => handleFieldChange('activo', e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="activo" className="text-dark-300">
                Tarjeta activa y visible para clientes
              </label>
            </div>

            {/* Botón de guardado manual */}
            <div className="bg-dark-700 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between">
                {hasUnsavedChanges && (
                  <p className="text-sm text-amber-400 flex items-center">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                    {'Cambios sin guardar'}
                  </p>
                )}
                {!hasUnsavedChanges && (
                  <p className="text-sm text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {'Todos los cambios guardados'}
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || validationErrors.length > 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hasUnsavedChanges && validationErrors.length === 0
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                  }`}
                >
                  {validationErrors.length > 0 ? '🚫 Corrige errores primero' : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
