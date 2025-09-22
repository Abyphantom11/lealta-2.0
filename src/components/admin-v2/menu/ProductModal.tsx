'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useImageUpload } from '../../../hooks/useImageUpload';

// Tipos para el componente
type CategoryData = {
  id: string;
  nombre: string;
};

type ProductData = {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria?: string;
  categoryId: string;
  precio: number | string;
  precioVaso?: number | string;
  precioBotella?: number | string;
  tipoProducto: string;
  disponible: boolean;
  destacado: boolean;
  imagenUrl: string;
};

interface ProductModalProps {
  readonly product: ProductData | null;
  readonly categories: CategoryData[];
  onSave: (data: ProductData) => void;
  onClose: () => void;
}

/**
 * Componente ProductModal - Modal para crear/editar productos
 * 
 * Responsabilidades:
 * - Formulario completo para crear/editar productos
 * - Selección de categoría y tipo de producto
 * - Gestión de precios según tipo (simple, botella, variable)
 * - Upload y preview de imágenes
 * - Validación de datos del formulario
 */
export default function ProductModal({
  product,
  categories,
  onSave,
  onClose,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    nombre: product?.nombre || '',
    descripcion: product?.descripcion || '',
    categoryId: product?.categoryId || '',
    precio: product?.precio || '',
    precioVaso: product?.precioVaso || '',
    precioBotella: product?.precioBotella || '',
    tipoProducto: product?.tipoProducto || 'simple',
    disponible: product?.disponible ?? true,
    destacado: product?.destacado ?? false,
    imagenUrl: product?.imagenUrl || '',
  });

  // ✅ USAR HOOK UNIFICADO para upload de imágenes
  const [uploadState, uploadActions] = useImageUpload({
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    onSuccess: (imageUrl) => {
      setFormData(prev => ({ ...prev, imagenUrl: imageUrl }));
    },
    onError: (error) => {
      console.error('Error uploading product image:', error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Si hay archivo seleccionado, subirlo primero
    let finalImageUrl = formData.imagenUrl;
    if (uploadState.selectedFile) {
      const uploadedUrl = await uploadActions.uploadImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    // Agregar la categoria basada en categoryId
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const submitData = {
      ...formData,
      imagenUrl: finalImageUrl, // ✅ Usar URL del servidor
      categoria: selectedCategory?.nombre || formData.categoryId,
      precio: typeof formData.precio === 'string' ? parseFloat(formData.precio) || 0 : formData.precio,
      precioVaso: typeof formData.precioVaso === 'string' ? parseFloat(formData.precioVaso) || undefined : formData.precioVaso,
      precioBotella: typeof formData.precioBotella === 'string' ? parseFloat(formData.precioBotella) || undefined : formData.precioBotella
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto relative z-10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="product-categoria"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Categoría
            </label>
            <select
              id="product-categoria"
              value={formData.categoryId}
              onChange={e =>
                setFormData(prev => ({ ...prev, categoryId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-nombre"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Nombre
            </label>
            <input
              id="product-nombre"
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
              htmlFor="product-descripcion"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="product-descripcion"
              value={formData.descripcion}
              onChange={e =>
                setFormData(prev => ({ ...prev, descripcion: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="product-tipo"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Tipo de Producto
            </label>
            <select
              id="product-tipo"
              value={formData.tipoProducto}
              onChange={e =>
                setFormData(prev => ({ ...prev, tipoProducto: e.target.value }))
              }
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
            >
              <option value="simple">Simple</option>
              <option value="botella">Botella</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          {formData.tipoProducto === 'simple' && (
            <div>
              <label
                htmlFor="product-precio"
                className="block text-sm font-medium text-dark-300 mb-2"
              >
                Precio
              </label>
              <input
                id="product-precio"
                type="text"
                inputMode="decimal"
                value={formData.precio}
                onChange={e => {
                  // Permitir números y un punto decimal
                  if (
                    /^(\d*\.?\d*)$/.test(e.target.value) ||
                    e.target.value === ''
                  ) {
                    setFormData(prev => ({ ...prev, precio: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
              />
            </div>
          )}

          {formData.tipoProducto === 'botella' && (
            <>
              <div>
                <label
                  htmlFor="product-precio-vaso"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Precio por Vaso
                </label>
                <input
                  id="product-precio-vaso"
                  type="text"
                  inputMode="decimal"
                  value={formData.precioVaso}
                  onChange={e => {
                    // Permitir números y un punto decimal
                    if (
                      /^(\d*\.?\d*)$/.test(e.target.value) ||
                      e.target.value === ''
                    ) {
                      setFormData(prev => ({
                        ...prev,
                        precioVaso: e.target.value,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="product-precio-botella"
                  className="block text-sm font-medium text-dark-300 mb-2"
                >
                  Precio por Botella
                </label>
                <input
                  id="product-precio-botella"
                  type="text"
                  inputMode="decimal"
                  value={formData.precioBotella}
                  onChange={e => {
                    // Permitir números y un punto decimal
                    if (
                      /^(\d*\.?\d*)$/.test(e.target.value) ||
                      e.target.value === ''
                    ) {
                      setFormData(prev => ({
                        ...prev,
                        precioBotella: e.target.value,
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="product-imagen"
              className="block text-sm font-medium text-dark-300 mb-2"
            >
              Imagen del Producto
            </label>
            <input
              id="product-imagen"
              type="file"
              accept="image/*"
              onChange={uploadActions.handleFileSelect}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
            
            {/* ✅ Mostrar preview de imagen nueva o existente */}
            {(uploadState.previewUrl || formData.imagenUrl) && (
              <div className="mt-2">
                <Image
                  src={uploadState.previewUrl || formData.imagenUrl}
                  alt="Preview"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-md"
                />
                {uploadState.previewUrl && !formData.imagenUrl && (
                  <p className="text-xs text-primary-400 mt-1">
                    ✅ Nueva imagen seleccionada
                  </p>
                )}
                {formData.imagenUrl && !uploadState.previewUrl && (
                  <p className="text-xs text-green-400 mt-1">
                    ✅ Imagen guardada
                  </p>
                )}
              </div>
            )}
            
            {/* ✅ Mostrar estado de upload */}
            {uploadState.isUploading && (
              <p className="text-xs text-primary-400 mt-1">
                Subiendo imagen...
              </p>
            )}
            
            {/* ✅ Mostrar errores de validación */}
            {uploadState.error && (
              <p className="text-xs text-red-400 mt-1">
                {uploadState.error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="disponible"
                checked={formData.disponible}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    disponible: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <label htmlFor="disponible" className="text-sm text-dark-300">
                Producto disponible
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="destacado"
                checked={formData.destacado}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    destacado: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <label htmlFor="destacado" className="text-sm text-dark-300">
                Producto destacado
              </label>
            </div>
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
              {product ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
