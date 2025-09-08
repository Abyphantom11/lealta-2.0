'use client';

import { useState } from 'react';
import { UtensilsCrossed, Coffee } from 'lucide-react';

// Tipos para el componente
type MenuCategory = {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  parentId?: string | null;
};

type MenuItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  precioVaso?: number;
  precioBotella?: number;
  disponible: boolean;
  categoryId: string;
};

interface MenuPreviewProps {
  readonly categories: MenuCategory[];
  readonly products: MenuItem[];
}

/**
 * Componente MenuPreview - Vista previa del menú para el cliente
 * 
 * Responsabilidades:
 * - Mostrar categorías activas y sus productos disponibles
 * - Permitir navegación entre categorías
 * - Mostrar productos con precios y descripciones
 * - Manejar subcategorías de forma jerárquica
 */
export default function MenuPreview({ 
  categories, 
  products 
}: MenuPreviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null
  );

  const activeCategories = categories.filter(
    cat => cat.activo && !cat.parentId
  ); // Solo categorías principales activas
  const availableProducts = products.filter(prod => prod.disponible);

  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId && cat.activo);
  };

  const getProductsForCategory = (categoryId: string) => {
    return availableProducts.filter(
      product => product.categoryId === categoryId
    );
  };

  return (
    <div
      className="bg-black rounded-xl p-6 max-w-md mx-auto text-white"
      style={{ minHeight: '600px' }}
    >
      {/* Header del menú */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Nuestro Menú</h1>
        <p className="text-gray-400 text-sm">
          Vista previa del menú del cliente
        </p>
      </div>

      {/* Categorías */}
      {activeCategories.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p>No hay categorías activas</p>
          <p className="text-sm">Crea categorías para mostrar el menú</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Lista de categorías */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {activeCategories.map((category: MenuCategory) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory?.id === category.id ? null : category
                  )
                }
                className={`p-4 rounded-lg border transition-all ${
                  selectedCategory?.id === category.id
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-medium">{category.nombre}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {category.descripcion}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Productos de la categoría seleccionada */}
          {selectedCategory && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-3">
                {selectedCategory.nombre}
              </h3>

              {/* Subcategorías si existen */}
              {getSubcategories(selectedCategory.id).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-300 mb-2">
                    Subcategorías:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {getSubcategories(selectedCategory.id).map(
                      (subcategory: MenuCategory) => (
                        <div
                          key={subcategory.id}
                          className="bg-gray-700 rounded-lg p-3"
                        >
                          <h5 className="font-medium text-white mb-2">
                            {subcategory.nombre}
                          </h5>

                          {/* Productos de la subcategoría */}
                          <div className="space-y-2">
                            {getProductsForCategory(subcategory.id).map(
                              (product: MenuItem) => (
                                <div
                                  key={product.id}
                                  className="bg-gray-600 rounded-md p-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-white text-sm">
                                        {product.nombre}
                                      </h6>
                                      {product.descripcion && (
                                        <p className="text-gray-300 text-xs mt-1">
                                          {product.descripcion}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {product.precio && (
                                        <div className="text-primary-400 font-bold text-sm">
                                          ${product.precio.toFixed(2)}
                                        </div>
                                      )}
                                      {product.precioVaso && (
                                        <div className="text-primary-400 font-bold text-xs">
                                          Vaso: ${product.precioVaso.toFixed(2)}
                                        </div>
                                      )}
                                      {product.precioBotella && (
                                        <div className="text-primary-400 font-bold text-xs">
                                          Botella: $
                                          {product.precioBotella.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}

                            {getProductsForCategory(subcategory.id).length ===
                              0 && (
                              <div className="text-center text-gray-400 py-4">
                                <p className="text-xs">
                                  No hay productos en esta subcategoría
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Productos directos de la categoría principal */}
              {getProductsForCategory(selectedCategory.id).map(
                (product: MenuItem) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {product.nombre}
                        </h4>
                        {product.descripcion && (
                          <p className="text-gray-400 text-sm mt-1">
                            {product.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {product.precio && (
                          <div className="text-primary-400 font-bold">
                            ${product.precio.toFixed(2)}
                          </div>
                        )}
                        {product.precioVaso && (
                          <div className="text-primary-400 font-bold text-sm">
                            Vaso: ${product.precioVaso.toFixed(2)}
                          </div>
                        )}
                        {product.precioBotella && (
                          <div className="text-primary-400 font-bold text-sm">
                            Botella: ${product.precioBotella.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {getProductsForCategory(selectedCategory.id).length === 0 &&
                getSubcategories(selectedCategory.id).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Coffee className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm">
                      No hay productos ni subcategorías en esta categoría
                    </p>
                  </div>
                )}
            </div>
          )}

          {!selectedCategory && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">
                Selecciona una categoría para ver los productos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
