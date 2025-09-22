'use client';

import React, { useState } from 'react';
import { Plus, Gift, Edit3, Trash2 } from 'lucide-react';

interface RecompensasManagerProps {
  recompensas: Recompensa[];
  onAdd: (recompensa: Recompensa) => void;
  onUpdate: (id: string, recompensa: Partial<Recompensa>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

interface Recompensa {
  id?: string;
  nombre?: string;
  descripcion?: string;
  puntosRequeridos?: number;
  stock?: number;
  activo?: boolean;
}

/**
 * Componente para gestionar sistema de recompensas
 * Extraído del código original (líneas 4707-4981)
 * RESPONSABILIDAD: Gestión completa de recompensas
 */
const RecompensasManager: React.FC<RecompensasManagerProps> = ({
  recompensas,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    puntosRequeridos: '',
    stock: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      puntosRequeridos: parseInt(formData.puntosRequeridos),
      stock: formData.stock ? parseInt(formData.stock) : undefined,
    };

    if (editingItem) {
      onUpdate(editingItem.id, data);
      setEditingItem(null);
    } else {
      onAdd(data);
    }

    setFormData({
      nombre: '',
      descripcion: '',
      puntosRequeridos: '',
      stock: '',
    });
    setShowForm(false);
  };

  const startEdit = (item: Recompensa) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre || '',
      descripcion: item.descripcion || '',
      puntosRequeridos: item.puntosRequeridos?.toString() || '',
      stock: item.stock?.toString() || '',
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-white mb-3">
          Sistema de Recompensas
        </h4>
        <p className="text-dark-400 text-sm mb-4">
          Crea recompensas que los clientes pueden canjear usando sus puntos de
          lealtad acumulados.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Recompensa</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-dark-800 rounded-lg p-4">
          <h5 className="text-white font-medium mb-4">
            {editingItem ? 'Editar Recompensa' : 'Nueva Recompensa'}
          </h5>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="rewardName"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Nombre de la Recompensa
              </label>
              <input
                id="rewardName"
                type="text"
                placeholder="Ej: Bebida Gratis"
                value={formData.nombre}
                onChange={e =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="rewardDescription"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Descripción
              </label>
              <textarea
                id="rewardDescription"
                placeholder="Describe los detalles de la recompensa..."
                value={formData.descripcion}
                onChange={e =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rewardPoints"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Puntos Requeridos
                </label>
                <input
                  id="rewardPoints"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="100"
                  value={formData.puntosRequeridos}
                  onChange={e => {
                    if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                      setFormData({
                        ...formData,
                        puntosRequeridos: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400"
                  required
                />
              </div>

            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded transition-colors"
              >
                {editingItem ? 'Actualizar' : 'Crear'} Recompensa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    puntosRequeridos: '',
                    stock: '',
                  });
                }}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {recompensas.length === 0 ? (
          <div className="text-center py-8 bg-dark-800 rounded-lg border-2 border-dashed border-dark-600">
            <Gift className="w-8 h-8 mx-auto mb-3 text-dark-500" />
            <p className="text-dark-400">No hay recompensas creadas</p>
            <p className="text-dark-500 text-sm">
              Agrega recompensas para incentivar la lealtad de tus clientes
            </p>
          </div>
        ) : (
          // Ordenar recompensas de menor a mayor puntos
          [...recompensas]
            .sort((a, b) => (a.puntosRequeridos || 0) - (b.puntosRequeridos || 0))
            .map((recompensa: Recompensa) => (
            <div key={recompensa.id} className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-white font-medium">
                      {recompensa.nombre}
                    </h5>
                    <span className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium">
                      {recompensa.puntosRequeridos} pts
                    </span>
                    <button
                      onClick={() => recompensa.id && onToggle(recompensa.id)}
                      disabled={!recompensa.id}
                      className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 ${
                        recompensa.activo
                          ? 'bg-success-600 text-white'
                          : 'bg-dark-600 text-dark-300'
                      }`}
                    >
                      {recompensa.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                  <p className="text-dark-300 text-sm mb-1">
                    {recompensa.descripcion}
                  </p>
                  {recompensa.stock && (
                    <p className="text-dark-400 text-xs">
                      📦 Stock: {recompensa.stock}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(recompensa)}
                    className="p-2 bg-primary-600 hover:bg-primary-700 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => recompensa.id && onDelete(recompensa.id)}
                    disabled={!recompensa.id}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecompensasManager;
