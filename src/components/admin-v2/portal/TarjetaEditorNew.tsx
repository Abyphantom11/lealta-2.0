'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Save, X } from 'lucide-react';

interface NivelTarjetaData {
  nombre: string;
  puntosRequeridos: number;
  visitasRequeridas: number;
  beneficio: string;
  colores: string[];
  descripcion?: string; // Campo para la descripción que aparece en la tarjeta
  textoCalidad?: string; // Campo opcional para texto de calidad separado (por compatibilidad)
}

interface TarjetaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
  condicional: string;
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

export default function TarjetaEditor({
  config,
  setConfig,
  showNotification,
}: TarjetaEditorProps) {
  const [selectedLevel, setSelectedLevel] = useState('Plata');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado local para los campos editables
  const [editedTarjeta, setEditedTarjeta] = useState<TarjetaConfig | null>(
    null
  );
  const [editedNivel, setEditedNivel] = useState<NivelTarjetaData | null>(null);

  // Obtener la tarjeta actual (asumimos que solo hay una tarjeta configurada)
  const currentTarjeta = config.tarjetas?.[0];
  const currentNivel = currentTarjeta?.niveles?.find(
    n => n.nombre === selectedLevel
  );

  // Inicializar estados de edición cuando cambie el nivel seleccionado
  useEffect(() => {
    if (currentTarjeta && currentNivel) {
      setEditedTarjeta({ ...currentTarjeta });
      setEditedNivel({ ...currentNivel });
    }
  }, [selectedLevel, currentTarjeta, currentNivel]);

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
      // Crear la nueva configuración con los datos editados
      const updatedTarjeta = {
        ...editedTarjeta,
        niveles: editedTarjeta.niveles.map(nivel =>
          nivel.nombre === selectedLevel ? editedNivel : nivel
        ),
      };

      const newConfig = {
        ...config,
        tarjetas: [updatedTarjeta], // Reemplazar la tarjeta existente
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

  // Función para validar jerarquía de niveles
  const validateHierarchy = (
    field: 'puntosRequeridos' | 'visitasRequeridas',
    newValue: number,
    currentLevelIndex: number
  ): { isValid: boolean; message: string } => {
    if (!config.tarjetas?.[0]?.niveles) return { isValid: true, message: '' };

    const niveles = config.tarjetas[0].niveles;
    const fieldName = field === 'puntosRequeridos' ? 'puntos' : 'visitas';

    // Verificar niveles superiores (no pueden ser menores que el actual)
    for (let i = currentLevelIndex + 1; i < niveles.length; i++) {
      const nivelSuperior = niveles[i];
      const valorSuperior = nivelSuperior[field];

      if (newValue > valorSuperior) {
        return {
          isValid: false,
          message: `❌ El valor no puede ser mayor que ${nivelSuperior.nombre} (${valorSuperior} ${fieldName})`,
        };
      }
    }

    // Verificar niveles inferiores (no pueden ser mayores que el actual)
    for (let i = 0; i < currentLevelIndex; i++) {
      const nivelInferior = niveles[i];
      const valorInferior = nivelInferior[field];

      if (newValue < valorInferior) {
        return {
          isValid: false,
          message: `❌ El valor no puede ser menor que ${nivelInferior.nombre} (${valorInferior} ${fieldName})`,
        };
      }
    }

    return { isValid: true, message: '✅ Jerarquía respetada' };
  };

  const handleNivelFieldChange = (
    field: keyof NivelTarjetaData,
    value: any
  ) => {
    if (!editedNivel) return;

    // Validar jerarquía para puntos y visitas
    if (field === 'puntosRequeridos' || field === 'visitasRequeridas') {
      const currentLevelIndex =
        config.tarjetas?.[0]?.niveles?.findIndex(
          n => n.nombre === selectedLevel
        ) || 0;
      const validation = validateHierarchy(
        field,
        parseInt(value) || 0,
        currentLevelIndex
      );

      if (!validation.isValid) {
        showNotification(validation.message, 'error');
        return; // No permitir el cambio
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
          Seleccionar Nivel
        </h3>
        <div className="flex gap-2 flex-wrap">
          {currentTarjeta.niveles.map(nivel => (
            <button
              key={nivel.nombre}
              onClick={() => setSelectedLevel(nivel.nombre)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedLevel === nivel.nombre
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {nivel.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Información general de la tarjeta */}
      <div className="max-w-md">
        <div>
          <label
            htmlFor="tarjeta-nombre"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Nombre de la Tarjeta
          </label>
          <input
            id="tarjeta-nombre"
            type="text"
            value={editedTarjeta?.nombre || ''}
            onChange={e => handleTarjetaFieldChange('nombre', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Nombre de la tarjeta"
          />
        </div>
      </div>

      {/* Configuración del nivel seleccionado */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Editando: Tarjeta {selectedLevel}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nombre Personalizado */}
          <div>
            <label
              htmlFor="nivel-nombre"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Nombre Personalizado
            </label>
            <input
              id="nivel-nombre"
              type="text"
              value={editedNivel?.nombre || ''}
              onChange={e => handleNivelFieldChange('nombre', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Nombre del nivel"
            />
          </div>

          {/* Descripción de la Tarjeta */}
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Descripción de la Tarjeta
            </label>
            <p className="text-sm text-gray-400 mb-2">
              Texto corto que aparece en la tarjeta (ej: "Cliente VIP", "Cliente
              Elite")
            </p>
            <input
              id="descripcion"
              type="text"
              value={editedNivel?.descripcion || ''}
              onChange={e =>
                handleNivelFieldChange('descripcion', e.target.value)
              }
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Cliente VIP"
            />
          </div>
        </div>

        {/* Condiciones para Obtener este Nivel */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-white mb-3">
            Condiciones para Obtener este Nivel
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            El cliente obtiene la tarjeta si cumple <strong>cualquiera</strong>{' '}
            de estas condiciones:
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="puntos-minimos"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Puntos mínimos
              </label>
              {/* Mostrar límites jerárquicos */}
              {config.tarjetas?.[0]?.niveles &&
                (() => {
                  const currentIndex = config.tarjetas[0].niveles.findIndex(
                    n => n.nombre === selectedLevel
                  );
                  const nivelInferior =
                    currentIndex > 0
                      ? config.tarjetas[0].niveles[currentIndex - 1]
                      : null;
                  const nivelSuperior =
                    currentIndex < config.tarjetas[0].niveles.length - 1
                      ? config.tarjetas[0].niveles[currentIndex + 1]
                      : null;

                  return (
                    <p className="text-xs text-gray-400 mb-2">
                      {nivelInferior &&
                        `Mín: ${nivelInferior.puntosRequeridos} (${nivelInferior.nombre})`}
                      {nivelInferior && nivelSuperior && ' | '}
                      {nivelSuperior &&
                        `Máx: ${nivelSuperior.puntosRequeridos} (${nivelSuperior.nombre})`}
                    </p>
                  );
                })()}
              <input
                id="puntos-minimos"
                type="number"
                min={(() => {
                  const currentIndex =
                    config.tarjetas?.[0]?.niveles?.findIndex(
                      n => n.nombre === selectedLevel
                    ) || 0;
                  const nivelInferior =
                    currentIndex > 0
                      ? config.tarjetas[0].niveles[currentIndex - 1]
                      : null;
                  return nivelInferior ? nivelInferior.puntosRequeridos : 0;
                })()}
                max={(() => {
                  const currentIndex =
                    config.tarjetas?.[0]?.niveles?.findIndex(
                      n => n.nombre === selectedLevel
                    ) || 0;
                  const niveles = config.tarjetas?.[0]?.niveles || [];
                  const nivelSuperior =
                    currentIndex < niveles.length - 1
                      ? niveles[currentIndex + 1]
                      : null;
                  return nivelSuperior
                    ? nivelSuperior.puntosRequeridos
                    : undefined;
                })()}
                value={editedNivel?.puntosRequeridos || 0}
                onChange={e =>
                  handleNivelFieldChange(
                    'puntosRequeridos',
                    parseInt(e.target.value) || 0
                  )
                }
                onWheel={e => e.currentTarget.blur()} // Prevenir cambios con scroll
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="visitas-minimas"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Visitas mínimas
              </label>
              {/* Mostrar límites jerárquicos */}
              {config.tarjetas?.[0]?.niveles &&
                (() => {
                  const currentIndex = config.tarjetas[0].niveles.findIndex(
                    n => n.nombre === selectedLevel
                  );
                  const nivelInferior =
                    currentIndex > 0
                      ? config.tarjetas[0].niveles[currentIndex - 1]
                      : null;
                  const nivelSuperior =
                    currentIndex < config.tarjetas[0].niveles.length - 1
                      ? config.tarjetas[0].niveles[currentIndex + 1]
                      : null;

                  return (
                    <p className="text-xs text-gray-400 mb-2">
                      {nivelInferior &&
                        `Mín: ${nivelInferior.visitasRequeridas} (${nivelInferior.nombre})`}
                      {nivelInferior && nivelSuperior && ' | '}
                      {nivelSuperior &&
                        `Máx: ${nivelSuperior.visitasRequeridas} (${nivelSuperior.nombre})`}
                    </p>
                  );
                })()}
              <input
                id="visitas-minimas"
                type="number"
                min={(() => {
                  const currentIndex =
                    config.tarjetas?.[0]?.niveles?.findIndex(
                      n => n.nombre === selectedLevel
                    ) || 0;
                  const nivelInferior =
                    currentIndex > 0
                      ? config.tarjetas[0].niveles[currentIndex - 1]
                      : null;
                  return nivelInferior ? nivelInferior.visitasRequeridas : 0;
                })()}
                max={(() => {
                  const currentIndex =
                    config.tarjetas?.[0]?.niveles?.findIndex(
                      n => n.nombre === selectedLevel
                    ) || 0;
                  const niveles = config.tarjetas?.[0]?.niveles || [];
                  const nivelSuperior =
                    currentIndex < niveles.length - 1
                      ? niveles[currentIndex + 1]
                      : null;
                  return nivelSuperior
                    ? nivelSuperior.visitasRequeridas
                    : undefined;
                })()}
                value={editedNivel?.visitasRequeridas || 0}
                onChange={e =>
                  handleNivelFieldChange(
                    'visitasRequeridas',
                    parseInt(e.target.value) || 0
                  )
                }
                onWheel={e => e.currentTarget.blur()} // Prevenir cambios con scroll
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Descripción del Beneficio */}
        <div className="mt-6">
          <label
            htmlFor="beneficio-descripcion"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Descripción del Beneficio
          </label>
          <p className="text-sm text-gray-400 mb-2">
            Esta descripción aparecerá en la tarjeta del cliente como el
            beneficio principal.
          </p>
          <textarea
            id="beneficio-descripcion"
            value={editedNivel?.beneficio || ''}
            onChange={e => handleNivelFieldChange('beneficio', e.target.value)}
            disabled={!isEditing}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ejemplo: 5% de descuento en compras"
          />
        </div>
      </div>
    </div>
  );
}
