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
  const [saving, setSaving] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaChanged, setEmpresaChanged] = useState(false);

  const currentTarjeta = useMemo(
    () =>
      (config.tarjetas || []).find(
        (t: Tarjeta) => t.nivel === selectedLevel
      ) || {
        nivel: selectedLevel,
        nombrePersonalizado: `Tarjeta ${selectedLevel}`,
        textoCalidad:
          NIVELES_TARJETAS_CONFIG[
            selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG
          ].textoDefault,
        colores:
          NIVELES_TARJETAS_CONFIG[
            selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG
          ].colores,
        condiciones:
          NIVELES_TARJETAS_CONFIG[
            selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG
          ].condicionesDefault,
        beneficio:
          NIVELES_TARJETAS_CONFIG[
            selectedLevel as keyof typeof NIVELES_TARJETAS_CONFIG
          ].beneficioDefault,
        activo: true,
      },
    [config.tarjetas, selectedLevel]
  );

  // Actualizar editingCard cuando cambie selectedLevel (solo si se está editando)
  useEffect(() => {
    if (editingCard) {
      setEditingCard({ ...currentTarjeta });
    }
  }, [selectedLevel, editingCard, currentTarjeta]);

  // Definir jerarquía de niveles
  const nivelesJerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];

  // Función para obtener límites máximos basados en el nivel superior
  const getLimitesMaximos = (nivelActual: string) => {
    const indexActual = nivelesJerarquia.indexOf(nivelActual);
    if (indexActual >= nivelesJerarquia.length - 1) {
      // Si es el nivel más alto, no hay límites
      return { puntosMinimos: Infinity, visitasMinimas: Infinity };
    }

    const nivelSuperior = nivelesJerarquia[indexActual + 1];
    const tarjetaSuperior = (config.tarjetas || []).find(
      (t: Tarjeta) => t.nivel === nivelSuperior
    );

    if (tarjetaSuperior?.condiciones) {
      return {
        puntosMinimos: tarjetaSuperior.condiciones.puntosMinimos - 1,
        visitasMinimas: tarjetaSuperior.condiciones.visitasMinimas - 1,
      };
    }

    // Si no hay tarjeta superior configurada, usar valores por defecto
    const configSuperior =
      NIVELES_TARJETAS_CONFIG[
        nivelSuperior as keyof typeof NIVELES_TARJETAS_CONFIG
      ];
    return {
      puntosMinimos: configSuperior.condicionesDefault.puntosMinimos - 1,
      visitasMinimas: configSuperior.condicionesDefault.visitasMinimas - 1,
    };
  };

  // Función para validar que el valor no exceda el límite jerárquico
  const validarLimiteJerarquico = (
    valor: number,
    limite: number,
    campo: string
  ): boolean => {
    if (valor > limite) {
      showNotification(
        `${campo} no puede ser mayor a ${limite} (límite del nivel superior)`,
        'error'
      );
      return false;
    }
    return true;
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
    const response = await fetch('/api/admin/portal-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        tarjetas: newTarjetas,
        businessId: 'default',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar en el servidor');
    }
  };

  const handleSave = async () => {
    if (!editingCard) return;

    setSaving(true);

    try {
      const cardToSave = normalizeCardConditions(editingCard);
      const newTarjetas = updateLocalCards(cardToSave);
      await persistCardChanges(newTarjetas);

      showNotification(
        `✅ Tarjeta ${cardToSave.nivel} guardada correctamente`,
        'success'
      );
      setEditingCard(null);
    } catch (error) {
      console.error('Error guardando tarjeta:', error);
      showNotification(
        '❌ Error al guardar los cambios de la tarjeta',
        'error'
      );

      // Revertir cambios locales en caso de error
      const originalTarjeta = (config.tarjetas || []).find(
        (t: Tarjeta) => t.nivel === editingCard.nivel
      );
      if (originalTarjeta) {
        setEditingCard(originalTarjeta);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmpresa = async (nombreEmpresa: string) => {
    // Solo actualizar estado local, marcar como cambiado
    setConfig({ ...config, nombreEmpresa });
    setEmpresaChanged(true);
  };

  const handleSaveEmpresaManual = async () => {
    try {
      setSavingEmpresa(true);

      // Persistir en la base de datos
      const response = await fetch('/api/admin/portal-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          businessId: 'default',
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
              onChange={e => handleSaveEmpresa(e.target.value)}
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
          {!editingCard && (
            <button
              onClick={() => setEditingCard({ ...currentTarjeta })}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {editingCard ? (
          <div className="space-y-6">
            {/* Información básica */}
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
                    setEditingCard({
                      ...editingCard,
                      nombrePersonalizado: e.target.value,
                    })
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
                    setEditingCard({
                      ...editingCard,
                      textoCalidad: e.target.value,
                    })
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
                    pattern="[0-9]*"
                    value={editingCard.condiciones?.puntosMinimos ?? ''}
                    onChange={e => {
                      // Validar que solo contenga números
                      if (
                        /^\d*$/.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const nuevoValor =
                          e.target.value === '' ? '' : Number(e.target.value);

                        // Validar límites jerárquicos si no está vacío
                        if (nuevoValor !== '' && nuevoValor > 0) {
                          const limites = getLimitesMaximos(editingCard.nivel);
                          if (
                            !validarLimiteJerarquico(
                              nuevoValor,
                              limites.puntosMinimos,
                              'Puntos mínimos'
                            )
                          ) {
                            return; // No actualizar si excede el límite
                          }
                        }

                        setEditingCard({
                          ...editingCard,
                          condiciones: {
                            ...editingCard.condiciones,
                            puntosMinimos: nuevoValor,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
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
                    pattern="[0-9]*"
                    value={editingCard.condiciones?.visitasMinimas ?? ''}
                    onChange={e => {
                      // Validar que solo contenga números
                      if (
                        /^\d*$/.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const nuevoValor =
                          e.target.value === '' ? '' : Number(e.target.value);

                        // Validar límites jerárquicos si no está vacío
                        if (nuevoValor !== '' && nuevoValor > 0) {
                          const limites = getLimitesMaximos(editingCard.nivel);
                          if (
                            !validarLimiteJerarquico(
                              nuevoValor,
                              limites.visitasMinimas,
                              'Visitas mínimas'
                            )
                          ) {
                            return; // No actualizar si excede el límite
                          }
                        }

                        setEditingCard({
                          ...editingCard,
                          condiciones: {
                            ...editingCard.condiciones,
                            visitasMinimas: nuevoValor,
                          },
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Beneficio del nivel */}
            <div>
              <h6 className="text-white font-medium mb-3">
                Beneficio de este Nivel
              </h6>
              <textarea
                value={editingCard.beneficio || ''}
                onChange={e =>
                  setEditingCard({ ...editingCard, beneficio: e.target.value })
                }
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
                onChange={e =>
                  setEditingCard({ ...editingCard, activo: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="activo" className="text-dark-300">
                Tarjeta activa y visible para clientes
              </label>
            </div>

            {/* Botones */}
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-success-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
              <button
                onClick={() => setEditingCard(null)}
                disabled={saving}
                className="px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 disabled:bg-dark-400 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Vista de información cuando no está editando */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-dark-400">Nombre:</p>
                <p className="text-white font-medium">
                  {currentTarjeta.nombrePersonalizado}
                </p>
              </div>
              <div>
                <p className="text-dark-400">Texto de calidad:</p>
                <p className="text-white font-medium">
                  {currentTarjeta.textoCalidad}
                </p>
              </div>
            </div>

            <div>
              <p className="text-dark-400 text-sm mb-2">
                Condiciones (cualquiera cumple):
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-dark-400">Puntos mínimos</p>
                  <p className="text-white font-medium">
                    {currentTarjeta.condiciones?.puntosMinimos || 0}
                  </p>
                </div>
                <div>
                  <p className="text-dark-400">Visitas mínimas</p>
                  <p className="text-white font-medium">
                    {currentTarjeta.condiciones?.visitasMinimas || 0}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-dark-400 text-sm mb-2">Beneficio:</p>
              <p className="text-white text-sm">
                {currentTarjeta.beneficio || 'Sin beneficio definido'}
              </p>
            </div>

            <div>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  currentTarjeta.activo
                    ? 'bg-success-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {currentTarjeta.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
