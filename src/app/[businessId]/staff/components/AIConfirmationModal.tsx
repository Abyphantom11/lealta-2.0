'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit, Check, AlertCircle } from 'lucide-react';
import { AIResult } from '../types/ai.types';

interface EditableProduct {
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface AIConfirmationModalProps {
  showConfirmation: boolean;
  aiResult: AIResult | null;
  editableData: {
    empleado: string;
    productos: EditableProduct[];
    total: number;
  } | null;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (field: string, value: any) => void;
}

export const AIConfirmationModal = ({
  showConfirmation,
  aiResult,
  editableData,
  isProcessing,
  onConfirm,
  onCancel,
  onEdit,
}: AIConfirmationModalProps) => {
  if (!showConfirmation || !aiResult || !editableData) return null;

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return 'text-green-400';
    if (confianza >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-dark-800 rounded-2xl p-6 w-full max-w-2xl border border-dark-600 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Confirmar Datos Procesados por IA
                </h3>
                <p className="text-dark-400 text-sm">
                  Revisa y confirma la información detectada
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Información del cliente */}
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <h4 className="text-white font-medium mb-2">Cliente</h4>
            <p className="text-dark-300">
              {aiResult.cliente.nombre} • Cédula: {aiResult.cliente.cedula}
            </p>
          </div>

          {/* Empleado detectado */}
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Empleado Detectado</h4>
              <button
                type="button"
                onClick={() => {
                  const newEmployeeName = prompt('Editar nombre del empleado:', editableData.empleado);
                  if (newEmployeeName !== null) {
                    onEdit('empleado', newEmployeeName);
                  }
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-dark-300">{editableData.empleado}</p>
          </div>

          {/* Productos */}
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">
                Productos ({editableData.productos.length})
              </h4>
              <span className={`text-sm ${getConfianzaColor(aiResult.analisis.confianza)}`}>
                {aiResult.analisis.confianza}% confianza
              </span>
            </div>
            <div className="space-y-3">
              {editableData.productos.map((producto, index) => (
                <div
                  key={`product-${index}-${producto.nombre}`}
                  className="flex items-center justify-between p-3 bg-dark-600 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{producto.nombre}</p>
                    <p className="text-dark-300 text-sm">${producto.precio.toFixed(2)} x {producto.cantidad}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPrice = prompt('Editar precio:', producto.precio.toString());
                      if (newPrice !== null) {
                        const precio = parseFloat(newPrice);
                        if (!isNaN(precio)) {
                          const updatedProducts = [...editableData.productos];
                          updatedProducts[index] = { ...producto, precio };
                          onEdit('productos', updatedProducts);
                        }
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors ml-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-dark-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">Total</h4>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">
                  ${editableData.total.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newTotal = prompt('Editar total:', editableData.total.toString());
                    if (newTotal !== null) {
                      const total = parseFloat(newTotal);
                      if (!isNaN(total)) {
                        onEdit('total', total);
                      }
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Metadata adicional */}
          {aiResult.metadata && (
            <div className="bg-dark-700 rounded-lg p-4 mb-6">
              <h4 className="text-white font-medium mb-2">Información del Procesamiento</h4>
              <div className="space-y-1 text-sm text-dark-300">
                {aiResult.metadata.isBatchProcess && (
                  <p>📱 Procesamiento múltiple: {aiResult.metadata.successfulImages}/{aiResult.metadata.totalImages} imágenes</p>
                )}
                <p>⏰ Procesado automáticamente por IA</p>
                <p>🎯 Confianza: {aiResult.analisis.confianza}%</p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar y Registrar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
