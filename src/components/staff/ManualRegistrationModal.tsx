'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

interface ManualProduct {
  name: string;
  quantity: number;
  price: number;
}

interface ManualEntryData {
  cedula: string;
  total: string;
  productsCount: string;
  products: ManualProduct[];
  fechaCompra: string;
}

interface ManualRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ManualEntryData;
  onDataChange: (data: ManualEntryData) => void;
  onSubmit: () => void;
  onAddProduct: () => void;
  onUpdateProduct: (index: number, field: string, value: any) => void;
  onRemoveProduct: (index: number) => void;
}

export default function ManualRegistrationModal({
  isOpen,
  onClose,
  data,
  onDataChange,
  onSubmit,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
}: ManualRegistrationModalProps) {
  const handleInputChange = (field: string, value: string) => {
    onDataChange({
      ...data,
      [field]: value,
    });
  };

  const calculateTotal = () => {
    return data.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  ✏️ Registro Manual
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cédula del Cliente *
                    </label>
                    <input
                      type="text"
                      value={data.cedula}
                      onChange={(e) => handleInputChange('cedula', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ej: 1234567890"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Compra
                    </label>
                    <input
                      type="date"
                      value={data.fechaCompra}
                      onChange={(e) => handleInputChange('fechaCompra', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Productos
                    </h3>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onAddProduct}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </motion.button>
                  </div>

                  <div className="space-y-3">
                    {data.products.map((product, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => onUpdateProduct(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            placeholder="Nombre del producto"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => onUpdateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Precio
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price}
                            onChange={(e) => onUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                        </div>

                        <div className="flex items-end">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRemoveProduct(index)}
                            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}

                    {data.products.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Manual *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.total}
                      onChange={(e) => handleInputChange('total', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Calculado
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      ${calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Procesar Registro
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
