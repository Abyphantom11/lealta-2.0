'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Tag, Calendar } from 'lucide-react';

interface PromocionesManagerProps {
  promociones: Promocion[];
  onAdd: (promocion: Promocion) => void;
  onUpdate: (id: string, promocion: Partial<Promocion>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

interface Promocion {
  id?: string;
  dia?: string;
  titulo?: string;
  descripcion?: string;
  descuento?: number;
  horaTermino?: string;
  activo?: boolean;
}

/**
 * Componente para gestionar promociones del portal
 * Extraído del código original (líneas 4331-4706)
 * RESPONSABILIDAD: Gestión completa de promociones
 */
const PromocionesManager: React.FC<PromocionesManagerProps> = ({
  promociones,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [selectedDay, setSelectedDay] = useState('lunes');
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dia: 'lunes',
    titulo: '',
    descripcion: '',
    descuento: '',
    horaTermino: '04:00',
  });
  const [isAddMode, setIsAddMode] = useState(true);

  // Escuchar eventos de cambio de día simulado
  useEffect(() => {
    const handleDayChange = (e: CustomEvent) => {
      if (e.detail && e.detail.day) {
        setSelectedDay(e.detail.day);
      }
    };

    // Verificar si hay un día simulado al cargar el componente
    const currentSimulatedDay = (window as any).portalPreviewDay;
    if (currentSimulatedDay) {
      setSelectedDay(currentSimulatedDay);
    }

    // Suscribirse al evento de cambio de día
    window.addEventListener(
      'portalPreviewDayChanged',
      handleDayChange as EventListener
    );

    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener(
        'portalPreviewDayChanged',
        handleDayChange as EventListener
      );
    };
  }, []);

  const diasSemana = [
    { value: 'lunes', label: 'L' },
    { value: 'martes', label: 'M' },
    { value: 'miercoles', label: 'X' },
    { value: 'jueves', label: 'J' },
    { value: 'viernes', label: 'V' },
    { value: 'sabado', label: 'S' },
    { value: 'domingo', label: 'D' },
  ];

  const diasCompletos = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  const promosPorDia = promociones.filter(
    (p: Promocion) => p.dia === selectedDay
  );

  // Resetear formulario cuando cambia el día
  useEffect(() => {
    if (!editingPromoId) {
      setFormData({
        dia: selectedDay,
        titulo: '',
        descripcion: '',
        descuento: '',
        horaTermino: '04:00',
      });
      setIsAddMode(true);
    }
  }, [selectedDay, editingPromoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar límite de promociones por día (máximo 5)
    if (!editingPromoId && promosPorDia.length >= 5) {
      alert('Máximo 5 promociones por día permitidas');
      return;
    }

    const dataToSubmit = {
      dia: selectedDay,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      descuento: formData.descuento === '' ? 0 : parseFloat(formData.descuento),
      horaTermino: formData.horaTermino,
      activo: true,
    };

    if (editingPromoId) {
      onUpdate(editingPromoId, dataToSubmit);
    } else {
      onAdd(dataToSubmit);
    }

    // Limpiar formulario y restablecer modo
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      dia: selectedDay,
      titulo: '',
      descripcion: '',
      descuento: '',
      horaTermino: '04:00',
    });
    setEditingPromoId(null);
    setIsAddMode(true);
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    resetForm();
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">
          Promociones por Día
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Configura promociones específicas para cada día de la semana. Se
          actualizan automáticamente a las 4:00 AM.
        </p>
      </div>

      {/* Selector de día */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <h5 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Seleccionar Día
        </h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const promosDelDia = promociones.filter(
              (p: Promocion) => p.dia === dia.value && p.titulo
            );

            return (
              <button
                key={dia.value}
                onClick={() => handleDaySelect(dia.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors relative ${
                  selectedDay === dia.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                {dia.label}
                {promosDelDia.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {promosDelDia.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de promociones existentes para el día seleccionado */}
      {promosPorDia.length > 0 && (
        <div className="bg-dark-800 rounded-lg p-4 mb-4">
          <h5 className="text-white font-medium mb-3">
            Promociones para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]} (
            {promosPorDia.length}/5)
          </h5>
          <div className="space-y-3">
            {promosPorDia.map((promo: Promocion) => (
              <div
                key={promo.id}
                className={`p-3 rounded-lg border ${
                  promo.activo
                    ? 'border-success-500 bg-success-500/10'
                    : 'border-yellow-500 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h6 className="text-white font-medium">{promo.titulo}</h6>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setFormData({
                          dia: selectedDay,
                          titulo: promo.titulo || '',
                          descripcion: promo.descripcion || '',
                          descuento: promo.descuento?.toString() || '',
                          horaTermino: promo.horaTermino || '04:00',
                        });
                        setEditingPromoId(promo.id || null);
                        setIsAddMode(false);
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => promo.id && onDelete(promo.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => promo.id && onToggle(promo.id)}
                      className={`px-2 py-1 rounded text-xs ${
                        promo.activo
                          ? 'bg-success-600 hover:bg-success-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {promo.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>
                <p className="text-dark-300 text-sm mb-1">
                  {promo.descripcion}
                </p>
                <div className="flex items-center space-x-4 text-xs text-dark-400">
                  {promo.descuento && promo.descuento > 0 && (
                    <span>🏷️ {promo.descuento}% descuento</span>
                  )}
                  <span>🕒 Hasta {promo.horaTermino}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eliminamos la sección redundante de "Promociones para [día]" */}

      {/* Formulario para añadir/editar promoción */}
      <div className="bg-dark-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-white font-medium">
            {isAddMode ? 'Nueva Promoción' : 'Editar Promoción'} para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]}
          </h5>
          {promosPorDia.length >= 5 && isAddMode && (
            <span className="text-red-400 text-sm">
              Máximo 5 promociones por día
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título de la Promoción */}
          <div>
            <label
              htmlFor="promoTitle"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              <Tag className="w-4 h-4 inline mr-1" />
              Título de la Promoción
            </label>
            <input
              id="promoTitle"
              type="text"
              value={formData.titulo}
              onChange={e =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: 2x1 en Cócteles"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="promoDescription"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="promoDescription"
              value={formData.descripcion}
              onChange={e =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Descripción de la promoción..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Hora de Término */}
            <div>
              <label
                htmlFor="promoEndTime"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Hora de Término
              </label>
              <input
                id="promoEndTime"
                type="time"
                value={formData.horaTermino}
                onChange={e =>
                  setFormData({ ...formData, horaTermino: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-dark-400 mt-1">
                Hora en la que finaliza la promoción (día siguiente)
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isAddMode && promosPorDia.length >= 5}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isAddMode && promosPorDia.length >= 5
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-success-600 hover:bg-success-700 text-white'
              }`}
            >
              {isAddMode ? 'Crear' : 'Actualizar'} Promoción
            </button>

            {/* Mostramos botón de eliminar si existe una promoción para este día */}
            {!isAddMode && (
              <button
                type="button"
                onClick={() => {
                  if (editingPromoId) {
                    onDelete(editingPromoId);
                    resetForm();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Eliminar
              </button>
            )}

            {/* Botón para cancelar */}
            {!isAddMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Estado actual de la promoción para el día seleccionado */}
        {promociones.find(p => p.dia === selectedDay) && (
          <div className="mt-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-white font-medium">Estado Actual</h6>
              <button
                onClick={() => {
                  const promo = promociones.find(p => p.dia === selectedDay);
                  if (promo && promo.id) {
                    onToggle(promo.id);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  promociones.find(p => p.dia === selectedDay)?.activo
                    ? 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                    : 'bg-dark-600 text-dark-400 hover:bg-dark-500'
                }`}
              >
                {promociones.find(p => p.dia === selectedDay)?.activo
                  ? '✓ Activo'
                  : '✕ Inactivo'}
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-dark-300">
                📅 Día:{' '}
                <span className="text-white font-medium">
                  {diasCompletos[selectedDay as keyof typeof diasCompletos]}
                </span>
              </p>
              {/* Solo mostrar descuento si es mayor que 0 */}
              {(promociones.find(p => p.dia === selectedDay)?.descuento || 0) >
                0 && (
                <p className="text-dark-300">
                  🏷️ Descuento:{' '}
                  <span className="text-white font-medium">
                    {promociones.find(p => p.dia === selectedDay)?.descuento}%
                  </span>
                </p>
              )}
              <p className="text-dark-300">
                🕒 Hora de término:{' '}
                <span className="text-white font-medium">
                  {promociones.find(p => p.dia === selectedDay)?.horaTermino}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de promociones de la semana */}
      <div className="bg-dark-800 rounded-lg p-4 mt-4">
        <h6 className="text-white font-medium mb-3">Resumen Semanal</h6>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {diasSemana.map(dia => {
            const promo = promociones.find(
              (p: Promocion) => p.dia === dia.value
            );

            // Determina el estilo de la tarjeta según su estado
            const getCardStyle = () => {
              if (!promo) return 'border-dark-600 bg-dark-700';
              return promo.activo
                ? 'border-success-500 bg-success-500/10'
                : 'border-yellow-500 bg-yellow-500/10';
            };

            // Obtiene el mensaje de estado
            const getStatus = () => {
              if (!promo) return '❌ Sin promoción';
              // No mostrar porcentaje cuando es 0
              const descuentoMsg =
                promo.descuento && promo.descuento > 0
                  ? `${promo.descuento}% de descuento`
                  : '';
              return promo.activo
                ? descuentoMsg
                  ? `✅ ${descuentoMsg}`
                  : '✅ Activo'
                : descuentoMsg
                  ? `⚠️ ${descuentoMsg} (inactivo)`
                  : '⚠️ Inactivo';
            };
            return (
              <div
                key={dia.value}
                className={`p-3 rounded-lg border ${getCardStyle()}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {diasCompletos[dia.value as keyof typeof diasCompletos]}
                  </span>
                  {promo && (
                    <span className="text-xs text-dark-300">
                      hasta {promo.horaTermino}
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400">{getStatus()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PromocionesManager;
