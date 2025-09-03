'use client';

import React from 'react';
import { MenuContextType } from '../../../../types/admin/menu';
import { MenuCategory, MenuItem } from '../../../../types/admin';

interface MenuPanelProps {
  menuContext: MenuContextType;
}

export const MenuPanel: React.FC<Readonly<MenuPanelProps>> = ({
  menuContext,
}) => {
  const {
    categories,
    products,
    loading,
    error,
    deleteCategory,
    deleteProduct,
  } = menuContext;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Menú</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Panel de Categorías */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Categorías</h3>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              // Lógica para abrir modal para nueva categoría
            }}
          >
            Agregar Categoría
          </button>
        </div>

        {/* Lista de categorías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((categoria: MenuCategory) => (
            <div
              key={categoria.id}
              className="border rounded-md p-4 flex justify-between items-center"
            >
              <span>{categoria.nombre}</span>
              <div className="flex space-x-2">
                <button
                  className="bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded"
                  onClick={() => {
                    // Lógica para editar categoría
                  }}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white p-2 rounded"
                  onClick={() => deleteCategory(categoria.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel de Items del Menú */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Productos del Menú</h3>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              // Lógica para abrir modal para nuevo producto
            }}
          >
            Agregar Producto
          </button>
        </div>

        {/* Lista de productos */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((item: MenuItem) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {categories.find(cat => cat.id === item.categoryId)
                      ?.nombre || 'Sin categoría'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.tipoProducto === 'simple'
                      ? `$${item.precio?.toFixed(2) || '0.00'}`
                      : `Vaso: $${item.precioVaso?.toFixed(2) || '0.00'} / Botella: $${item.precioBotella?.toFixed(2) || '0.00'}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {item.tipoProducto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {item.disponible ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-700 text-white p-2 rounded"
                      onClick={() => {
                        // Lógica para editar producto
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white p-2 rounded"
                      onClick={() => deleteProduct(item.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};
