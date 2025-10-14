'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, User, MapPin, Calendar, Star } from 'lucide-react';
import { CustomerInfo } from '@/types/staff';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: CustomerInfo;
  onCopyToClipboard: (text: string, message: string) => void;
}

export default function ClientDetailsModal({
  isOpen,
  onClose,
  clientData,
  onCopyToClipboard,
}: ClientDetailsModalProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const copyField = (value: string, fieldName: string) => {
    onCopyToClipboard(value, `${fieldName} copiado al portapapeles`);
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Detalles del Cliente
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Información completa del cliente
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cliente Info */}
              <div className="space-y-6">
                {/* Información Personal */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Información Personal
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Nombre Completo
                          </label>
                          <p className="text-gray-900 font-medium">
                            {clientData.first_name} {clientData.last_name}
                          </p>
                        </div>
                        <button
                          onClick={() => copyField(`${clientData.first_name} ${clientData.last_name}`, 'Nombre')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Cédula
                          </label>
                          <p className="text-gray-900 font-medium">
                            {clientData.cedula}
                          </p>
                        </div>
                        <button
                          onClick={() => copyField(clientData.cedula, 'Cédula')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      {clientData.email && (
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">
                              Email
                            </label>
                            <p className="text-gray-900 font-medium">
                              {clientData.email}
                            </p>
                          </div>
                          <button
                            onClick={() => copyField(clientData.email, 'Email')}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {clientData.phone && (
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">
                              Teléfono
                            </label>
                            <p className="text-gray-900 font-medium">
                              {clientData.phone}
                            </p>
                          </div>
                          <button
                            onClick={() => copyField(clientData.phone, 'Teléfono')}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}

                      {clientData.birthday && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Fecha de Nacimiento
                          </label>
                          <p className="text-gray-900 font-medium flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(clientData.birthday)}
                          </p>
                        </div>
                      )}

                      {clientData.address && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Dirección
                          </label>
                          <p className="text-gray-900 font-medium flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                            {clientData.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información de Fidelidad */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    Programa de Fidelidad
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-3xl font-bold text-purple-600">
                          {clientData.points || 0}
                        </p>
                        <p className="text-sm text-gray-600">Puntos Actuales</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-3xl font-bold text-green-600">
                          {clientData.total_purchases || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Compras</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-3xl font-bold text-blue-600">
                          ${(clientData.total_spent || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Total Gastado</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Sistema */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Información del Sistema
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        ID del Cliente
                      </label>
                      <p className="text-gray-900 font-mono">
                        {clientData.id}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900">
                        {clientData.created_at ? formatDate(clientData.created_at) : 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Última Actualización
                      </label>
                      <p className="text-gray-900">
                        {clientData.updated_at ? formatDate(clientData.updated_at) : 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Estado
                      </label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Acciones Rápidas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => copyField(clientData.cedula, 'Cédula')}
                      className="flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Cédula
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => copyField(`${clientData.first_name} ${clientData.last_name}`, 'Nombre completo')}
                      className="flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Nombre
                    </motion.button>

                    {clientData.phone && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => copyField(clientData.phone, 'Teléfono')}
                        className="flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Teléfono
                      </motion.button>
                    )}

                    {clientData.email && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => copyField(clientData.email, 'Email')}
                        className="flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Email
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-6 border-t mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
