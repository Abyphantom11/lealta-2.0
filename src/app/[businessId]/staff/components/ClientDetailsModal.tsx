'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy } from 'lucide-react';
import { CustomerInfo } from '../types/customer.types';
import { getCustomerLevelClasses } from '../utils/customerLevel';
import { copyToClipboard } from '../utils/clipboard';

interface ClientDetailsModalProps {
  showClientModal: boolean;
  selectedClientData: CustomerInfo | null;
  onClose: () => void;
  onCopySuccess: (message: string) => void;
  onCopyError: (message: string) => void;
}

export const ClientDetailsModal = ({
  showClientModal,
  selectedClientData,
  onClose,
  onCopySuccess,
  onCopyError,
}: ClientDetailsModalProps) => {
  const handleCopy = async (text: string, successMessage: string) => {
    const result = await copyToClipboard(text, successMessage);
    if (result.success) {
      onCopySuccess(result.message);
    } else {
      onCopyError(result.message);
    }
  };

  return (
    <AnimatePresence>
      {showClientModal && selectedClientData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-dark-800 rounded-2xl p-6 w-full max-w-md border border-dark-600 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Datos del Cliente
              </h3>
              <button
                onClick={onClose}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="block text-sm font-medium text-dark-300 mb-1">
                  Nombre Completo
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium flex-1">{selectedClientData.nombre}</p>
                  <button
                    onClick={() => handleCopy(selectedClientData.nombre, 'Nombre copiado')}
                    className="ml-2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Copiar nombre"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cédula */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="block text-sm font-medium text-dark-300 mb-1">
                  Cédula
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium flex-1">{selectedClientData.cedula}</p>
                  <button
                    onClick={() => handleCopy(selectedClientData.cedula, 'Cédula copiada')}
                    className="ml-2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Copiar cédula"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teléfono */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="block text-sm font-medium text-dark-300 mb-1">
                  Teléfono
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium flex-1">
                    {selectedClientData.telefono || 'No registrado'}
                  </p>
                  <button
                    onClick={() => handleCopy(selectedClientData.telefono || '', 'Teléfono copiado')}
                    className="ml-2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copiar teléfono"
                    disabled={!selectedClientData.telefono}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="block text-sm font-medium text-dark-300 mb-1">
                  Correo Electrónico
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium flex-1">
                    {selectedClientData.email || 'No registrado'}
                  </p>
                  <button
                    onClick={() => handleCopy(selectedClientData.email || '', 'Email copiado')}
                    className="ml-2 p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copiar email"
                    disabled={!selectedClientData.email}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="block text-sm font-medium text-dark-300 mb-1">
                      Puntos
                    </div>
                    <p className="text-yellow-400 font-semibold">{selectedClientData.puntos}</p>
                  </div>
                  <div>
                    <div className="block text-sm font-medium text-dark-300 mb-1">
                      Nivel
                    </div>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCustomerLevelClasses(selectedClientData.nivel || 'Bronze')}`}
                    >
                      {selectedClientData.nivel || 'Bronze'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-4">
              📋 Usa los botones de copia para copiar cada dato individualmente
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
