'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Save, X, Eye } from 'lucide-react';

// Tipos unificados
interface NivelTarjetaData {
  nombre: string;
  color: string;
  puntosRequeridos: number;
  visitasRequeridas: number;
  beneficios: string[];
  descuento: number;
  descripcion?: string;
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
    color: '#CD7F32',
    puntosRequeridos: 0,
    visitasRequeridas: 0,
    beneficios: ['Puntos básicos por compra'],
    descuento: 0
  },
  {
    nombre: 'Plata',
    color: '#C0C0C0',
    puntosRequeridos: 500,
    visitasRequeridas: 5,
    beneficios: ['5% descuento', 'Puntos bonus en cumpleaños'],
    descuento: 5
  },
  {
    nombre: 'Oro',
    color: '#FFD700',
    puntosRequeridos: 1500,
    visitasRequeridas: 15,
    beneficios: ['10% descuento', 'Acceso a eventos exclusivos', 'Productos en preventa'],
    descuento: 10
  },
  {
    nombre: 'Platino',
    color: '#E5E4E2',
    puntosRequeridos: 3000,
    visitasRequeridas: 30,
    beneficios: ['15% descuento', 'Atención prioritaria', 'Regalos exclusivos', 'Invitaciones VIP'],
    descuento: 15
  },
  {
    nombre: 'Diamante',
    color: '#B9F2FF',
    puntosRequeridos: 5000,
    visitasRequeridas: 50,
    beneficios: ['20% descuento', 'Atención VIP exclusiva', 'Acceso ilimitado a eventos', 'Productos personalizados', 'Consultor personal dedicado'],
    descuento: 20
  }
];

export default function TarjetaEditorUnified({
  config,
  setConfig,
  showNotification,
}: TarjetaEditorProps) {
  const [selectedLevel, setSelectedLevel] = useState('Plata');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado local para los campos editables
  const [editedTarjeta, setEditedTarjeta] = useState<TarjetaConfig | null>(null);
  const [editedNivel, setEditedNivel] = useState<NivelTarjetaData | null>(null);

  // Obtener la tarjeta actual o crear una por defecto
  const currentTarjeta = useMemo(() => {
    if (config.tarjetas && config.tarjetas.length > 0) {
      return config.tarjetas[0];
    }
    // Crear tarjeta por defecto si no existe
    return {
      nombre: 'Tarjeta de Lealtad',
      descripcion: 'Acumula puntos y obtén beneficios exclusivos',
      niveles: NIVELES_DEFAULT
    };
  }, [config.tarjetas]);

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
      // Actualizar el nivel editado en la tarjeta
      const updatedNiveles = editedTarjeta.niveles.map(nivel =>
        nivel.nombre === selectedLevel ? editedNivel : nivel
      );

      const updatedTarjeta = {
        ...editedTarjeta,
        niveles: updatedNiveles
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

  // Función para validar jerarquía de niveles
  const validateHierarchy = (
    field: 'puntosRequeridos' | 'visitasRequeridas',
    newValue: number,
    currentLevelIndex: number
  ): { isValid: boolean; message: string } => {
    if (!currentTarjeta?.niveles) return { isValid: true, message: '' };

    const niveles = currentTarjeta.niveles;
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
      const currentLevelIndex = currentTarjeta?.niveles?.findIndex(
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre de la Tarjeta
          </label>
          <input
            type="text"
            value={editedTarjeta?.nombre || ''}
            onChange={e => handleTarjetaFieldChange('nombre', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Nombre de la tarjeta"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción de la Tarjeta
          </label>
          <input
            type="text"
            value={editedTarjeta?.descripcion || ''}
            onChange={e => handleTarjetaFieldChange('descripcion', e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Descripción de la tarjeta"
          />
        </div>
      </div>

      {/* Configuración del nivel seleccionado */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">
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

          {/* Color del nivel */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color del Nivel
            </label>
            <input
              type="color"
              value={editedNivel?.color || '#000000'}
              onChange={e => handleNivelFieldChange('color', e.target.value)}
              disabled={!isEditing}
              className="w-full h-10 px-1 py-1 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descuento (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={editedNivel?.descuento || 0}
              onChange={e => handleNivelFieldChange('descuento', parseInt(e.target.value) || 0)}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Beneficios */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beneficios
          </label>
          <div className="space-y-2">
            {editedNivel?.beneficios?.map((beneficio, index) => (
              <input
                key={index}
                type="text"
                value={beneficio}
                onChange={e => {
                  if (!editedNivel) return;
                  const newBeneficios = [...editedNivel.beneficios];
                  newBeneficios[index] = e.target.value;
                  handleNivelFieldChange('beneficios', newBeneficios);
                }}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={`Beneficio ${index + 1}`}
              />
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  if (!editedNivel) return;
                  const newBeneficios = [...editedNivel.beneficios, ''];
                  handleNivelFieldChange('beneficios', newBeneficios);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Agregar Beneficio
              </button>
            )}
          </div>
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
            background: `linear-gradient(135deg, ${editedNivel?.color || '#000000'}, ${editedNivel?.color || '#000000'}aa)` 
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
            <p className="text-xs opacity-75 mb-2">{editedTarjeta?.descripcion}</p>
            <div className="flex justify-between text-xs">
              <span>{editedNivel?.puntosRequeridos}+ puntos</span>
              <span>{editedNivel?.visitasRequeridas}+ visitas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
