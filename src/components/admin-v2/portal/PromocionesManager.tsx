'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

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

  const promosPorDia = promociones.filter((p: Promocion) => p.dia === selectedDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      dia: selectedDay,
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      descuento: formData.descuento ? parseFloat(formData.descuento) : undefined,
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

  const handleEditPromo = (promo: Promocion) => {
    setFormData({
      dia: promo.dia || '',
      titulo: promo.titulo || '',
      descripcion: promo.descripcion || '',
      descuento: promo.descuento?.toString() || '',
      horaTermino: promo.horaTermino || '04:00',
    });
    setEditingPromoId(promo.id || null);
    setIsAddMode(false);
  };

  const handleDaySelect = (dia: string) => {
    setSelectedDay(dia);
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
        <h5 className="text-white font-medium mb-3">Seleccionar Día</h5>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const tienePromo = promociones.some(
              (p: Promocion) => p.dia === dia.value
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
                {tienePromo && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de promociones para el día seleccionado */}
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-white font-medium">
            Promociones para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]}
          </h5>
          <button
            onClick={() => {
              resetForm();
              setIsAddMode(true);
            }}
            className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors"
          >
            Nueva Promoción
          </button>
        </div>

        {promosPorDia.length === 0 ? (
          <div className="text-center py-4 text-dark-400 text-sm">
            No hay promociones configuradas para{' '}
            {diasCompletos[selectedDay as keyof typeof diasCompletos]}
          </div>
        ) : (
          <div className="space-y-2">
            {promosPorDia.map((promo: Promocion) => (
              <div key={promo.id} className="p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <div className="text-white text-sm font-medium">
                      {promo.titulo}
                    </div>
                    <div className="text-dark-300 text-xs mt-1">
                      {promo.descripcion}
                    </div>
                    <div className="text-sm text-dark-300 mt-1">
                      {promo.descuento}% descuento hasta las {promo.horaTermino}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditPromo(promo)}
                      className="p-1.5 rounded bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promo.id && onDelete(promo.id)}
                      disabled={!promo.id}
                      className="p-1.5 rounded bg-dark-600 hover:bg-red-600 text-dark-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promo.id && onToggle(promo.id)}
                      disabled={!promo.id}
                      className={`p-1.5 rounded ${
                        promo.activo
                          ? 'bg-success-600 text-white'
                          : 'bg-dark-600 text-dark-300 hover:text-white hover:bg-dark-500'
                      }`}
                    >
                      {promo.activo ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para añadir/editar promoción */}
      <div className="bg-dark-800 rounded-lg p-4">
        <h5 className="text-white font-medium mb-3">
          {isAddMode ? 'Añadir nueva promoción' : 'Editar promoción'}
        </h5>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="promoTitle"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Título de la Promoción
            </label>
            <input
              id="promoTitle"
              type="text"
              placeholder="Ej: 2x1 en Cócteles"
              value={formData.titulo}
              onChange={e =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="promoDescription"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="promoDescription"
              placeholder="Descripción de la promoción..."
              value={formData.descripcion}
              onChange={e =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="promoDiscount"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Descuento (%)
              </label>
              <input
                id="promoDiscount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="50"
                value={formData.descuento}
                onChange={e => {
                  if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                    const inputValue =
                      e.target.value === '' ? '' : Number(e.target.value);
                    // Limitar valores entre 0 y 100
                    if (
                      inputValue === '' ||
                      (Number(inputValue) >= 0 && Number(inputValue) <= 100)
                    ) {
                      setFormData({
                        ...formData,
                        descuento:
                          inputValue === '' ? '0' : inputValue.toString(),
                      });
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="promoEndTime"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Hora de Término (día siguiente)
              </label>
              <input
                id="promoEndTime"
                type="time"
                value={formData.horaTermino}
                onChange={e =>
                  setFormData({ ...formData, horaTermino: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white"
                required
              />
            </div>
          </div>

          <p className="text-xs text-dark-400">
            Horario de trabajo: 6pm a 3am. La promoción se actualiza
            automáticamente al día siguiente a las 4am.
          </p>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded transition-colors"
            >
              {isAddMode ? 'Crear' : 'Actualizar'} Promoción
            </button>
            {!isAddMode && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Resumen de promociones de la semana */}
      <div className="bg-dark-800 rounded-lg p-4 mt-4">
        <h6 className="text-white font-medium mb-3">Resumen de la Semana</h6>
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map(dia => {
            const promo = promociones.find((p: Promocion) => p.dia === dia.value);
            return (
              <div key={dia.value} className="text-center">
                <div className="text-xs text-dark-400 mb-1">{dia.label}</div>
                <div
                  className={`text-xs p-2 rounded ${
                    promo
                      ? 'bg-success-600 text-white'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
                  {promo ? `${promo.descuento}%` : 'Sin promo'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PromocionesManager;
