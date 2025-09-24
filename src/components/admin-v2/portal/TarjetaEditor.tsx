'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard } from 'lucide-react';
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
  readonly setConfig: (config: GeneralConfig) => void;
  readonly showNotification: (message: string, type: NivelTarjeta) => void;
}

export default function TarjetaEditor({
  config,
  setConfig,
  showNotification,
}: TarjetaEditorProps) {
  const [selectedLevel, setSelectedLevel] = useState('Oro');
  const [editingCard, setEditingCard] = useState<any>(null);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaChanged, setEmpresaChanged] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    
    console.log(`🔍 VALIDACIÓN JERÁRQUICA para ${level} con ${points} puntos:`, {
      configTarjetasOriginales: config.tarjetas?.length || 0,
      editingCard: editingCard?.nivel,
      allCardsFinales: allCards.length,
      estructura: allCards
        .sort((a, b) => JERARQUIA_NIVELES.indexOf(a.nivel) - JERARQUIA_NIVELES.indexOf(b.nivel))
        .map(c => ({ 
          nivel: c.nivel, 
          puntos: c.condiciones?.puntosMinimos || 0,
          esActual: c.nivel === level
        }))
    });
    
    // 🔍 LÍMITE SUPERIOR: Buscar el nivel inmediatamente superior que tenga configuración
    let maxAllowedPoints: number | undefined;
    const nivelesSuperiores = JERARQUIA_NIVELES.slice(currentIndex + 1);
    
    for (const nivelSuperior of nivelesSuperiores) {
      const higherCard = allCards.find(card => card.nivel === nivelSuperior);
      if (higherCard && higherCard.condiciones && typeof higherCard.condiciones.puntosMinimos === 'number') {
        maxAllowedPoints = higherCard.condiciones.puntosMinimos - 1;
        console.log(`� Límite superior encontrado: ${nivelSuperior} (${higherCard.condiciones.puntosMinimos}) → máximo para ${level}: ${maxAllowedPoints}`);
        
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
        console.log(`� Límite inferior encontrado: ${nivelInferior} (${lowerCard.condiciones.puntosMinimos}) → mínimo para ${level}: ${minRequiredPoints}`);
        
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
    
    console.log(`✅ RESULTADO para ${level}:`, {
      isValid: errors.length === 0,
      minRequiredPoints,
      maxAllowedPoints,
      errorsCount: errors.length
    });

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

  // Función auxiliar para actualizar tarjetas localmente
  const updateLocalCards = (cardToSave: Tarjeta) => {
    const newTarjetas = [...(config.tarjetas || [])];
    const existingIndex = newTarjetas.findIndex(
      (t: Tarjeta) => t.nivel === cardToSave.nivel
    );

    if (existingIndex >= 0) {
      newTarjetas[existingIndex] = cardToSave;
    } else {
      newTarjetas.push(cardToSave);
    }

    setConfig({ ...config, tarjetas: newTarjetas });
    return newTarjetas;
  };

  // Función auxiliar para persistir cambios
  const persistCardChanges = async (newTarjetas: Tarjeta[]) => {
    console.log('🔍 Persistiendo tarjetas (businessId desde sesión autenticada)');
    
    const response = await fetch('/api/admin/portal-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        tarjetas: newTarjetas,
        // ❌ NO enviar businessId - el backend usa session.businessId automáticamente
      }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar en el servidor');
    }

    // ✅ NOTIFICAR A CLIENTES CONECTADOS SOBRE EL CAMBIO DE CONFIGURACIÓN
    try {
      await fetch('/api/admin/notify-config-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tarjetas_config_updated',
          data: { tarjetas: newTarjetas }
        }),
      });
      console.log('✅ Notificación de cambio de configuración enviada');
    } catch (error) {
      console.warn('⚠️ Error enviando notificación de cambio:', error);
      // No fallar si la notificación falla
    }
  };

  const handleSaveCard = async () => {
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
      const cardToSave = normalizeCardConditions(editingCard);
      const newTarjetas = updateLocalCards(cardToSave);
      await persistCardChanges(newTarjetas);

      // Actualizar estado local inmediatamente
      setConfig({
        ...config,
        tarjetas: newTarjetas,
      });

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

      console.log('🔍 Guardando cambios de empresa (business ID se obtiene de sesión autenticada)');

      // Persistir en la base de datos - el businessId viene de session.businessId en el backend
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          // ❌ NO enviar businessId - el backend usa session.businessId automáticamente
        }),
      });

      if (response.ok) {
        // Actualizar todas las tarjetas existentes de clientes
        const syncResponse = await fetch('/api/admin/sync-tarjetas-empresa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombreEmpresa: config.nombreEmpresa,
          }),
        });

        if (syncResponse.ok) {
          const result = await syncResponse.json();
          showNotification(
            `✅ Nombre guardado y ${result.updatedCards || 0} tarjetas de clientes actualizadas`,
            'success'
          );
        } else {
          showNotification(
            '✅ Nombre guardado (sin sincronización de tarjetas existentes)',
            'success'
          );
        }

        setEmpresaChanged(false);
      } else {
        throw new Error('Error al guardar en el servidor');
      }
    } catch (error) {
      console.error('Error guardando nombre empresa:', error);
      showNotification('❌ Error al guardar el nombre de la empresa', 'error');
    } finally {
      setSavingEmpresa(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <CreditCard className="w-6 h-6 mr-2 text-primary-500" />
        <h4 className="text-lg font-semibold text-white">
          Gestión de Tarjetas de Lealtad
        </h4>
      </div>

      {/* Configuración del nombre de empresa */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <h5 className="text-white font-medium mb-3">
          Nombre de la Empresa en Tarjetas
        </h5>
        <div className="flex space-x-2 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={config.nombreEmpresa || ''}
              onChange={e => {
                // ✅ ACTUALIZAR ESTADO LOCAL Y MARCAR COMO CAMBIADO
                const updatedConfig = { ...config, nombreEmpresa: e.target.value };
                setConfig(updatedConfig);
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
                  onClick={handleSaveCard}
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
