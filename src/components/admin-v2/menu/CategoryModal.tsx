'use client';

import { useState, useEffect } from 'react';

// Tipos para el componente
type MenuCategory = {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  parentId?: string | null;
  businessId: string;
};

type CategoryFormData = {
  nombre: string;
  orden: number;
  activo: boolean;
  parentId: string | null;
  businessId: string;
};

interface CategoryModalProps {
  readonly category: MenuCategory | null;
  onSave: (data: CategoryFormData) => void;
  onClose: () => void;
}

/**
 * Componente CategoryModal - Modal para crear/editar categorías
 * 
 * Responsabilidades:
 * - Formulario para crear nuevas categorías o editar existentes
 * - Selección de categoría padre para crear subcategorías
 * - Validación de datos del formulario
 * - Gestión del estado activo/inactivo de categorías
 */
export default function CategoryModal({
  category,
  onSave,
  onClose,
}: Readonly<CategoryModalProps>): JSX.Element {
  // Obtener BUSINESS_ID del contexto o variable de entorno
  const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID || 'business_1';
  
  const [formData, setFormData] = useState<CategoryFormData>({
    nombre: category?.nombre || '',
    orden: category?.orden || 0,
    activo: category?.activo ?? true,
    parentId: category?.parentId || null,
    businessId: category?.businessId || BUSINESS_ID,
  });

  const [categories, setCategories] = useState<MenuCategory[]>([]);

  // Cargar categorías para el selector de categoría padre
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/admin/menu?businessId=${BUSINESS_ID}`);
        if (response.ok) {
          const data = await response.json();
          // Filtrar categorías que no sean subcategorías y que no sea la categoría actual (para evitar auto-referencia)
          const parentCategories = (data.menu || []).filter(
            (cat: MenuCategory) =>
              !cat.parentId && (!category || cat.id !== category.id)
          );
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [category, BUSINESS_ID]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="category-parent"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Categoría Padre (opcional)
            </label>
            <select
              id="category-parent"
              value={formData.parentId || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  parentId: e.target.value || null,
                }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="">Categoría principal</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category-nombre"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Nombre
            </label>
            <input
              id="category-nombre"
              type="text"
              value={formData.nombre}
              onChange={e =>
                setFormData(prev => ({ ...prev, nombre: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category-orden"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Orden
            </label>
            <input
              id="category-orden"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.orden}
              onChange={e => {
                if (/^\d*$/.test(e.target.value) || e.target.value === '') {
                  setFormData(prev => ({
                    ...prev,
                    orden: e.target.value === '' ? 0 : parseInt(e.target.value),
                  }));
                }
              }}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={e =>
                setFormData(prev => ({ ...prev, activo: e.target.checked }))
              }
              className="mr-2"
            />
            <label htmlFor="activo" className="text-sm text-dark-300">
              Categoría activa
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              {category ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
