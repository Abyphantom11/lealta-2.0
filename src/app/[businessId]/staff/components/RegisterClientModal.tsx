'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';

interface RegisterClientModalProps {
  showRegisterModal: boolean;
  registerData: {
    cedula: string;
    nombre: string;
    telefono: string;
    email: string;
  };
  isRegistering: boolean;
  onRegisterDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const RegisterClientModal = ({
  showRegisterModal,
  registerData,
  isRegistering,
  onRegisterDataChange,
  onSubmit,
  onClose,
}: RegisterClientModalProps) => {
  const handlePhoneChange = (value: string) => {
    // Solo permitir números y algunos símbolos comunes de teléfono
    const sanitizedValue = value.replace(/[^0-9+\-() ]/g, '');
    onRegisterDataChange({ ...registerData, telefono: sanitizedValue });
  };

  return (
    <AnimatePresence>
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-dark-800 rounded-2xl p-6 w-full max-w-md border border-dark-600 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <UserPlus className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Registrar Nuevo Cliente
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Cédula */}
              <div>
                <label htmlFor="register-cedula" className="block text-sm font-medium text-dark-300 mb-2">
                  Cédula *
                </label>
                <input
                  id="register-cedula"
                  type="text"
                  value={registerData.cedula}
                  onChange={e => onRegisterDataChange({ ...registerData, cedula: e.target.value })}
                  placeholder="Ej: 12345678"
                  className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={12}
                />
              </div>

              {/* Nombre */}
              <div>
                <label htmlFor="register-nombre" className="block text-sm font-medium text-dark-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  id="register-nombre"
                  type="text"
                  value={registerData.nombre}
                  onChange={e => onRegisterDataChange({ ...registerData, nombre: e.target.value })}
                  className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="register-telefono" className="block text-sm font-medium text-dark-300 mb-2">
                  Teléfono *
                </label>
                <input
                  id="register-telefono"
                  type="tel"
                  value={registerData.telefono}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="Ej: 09XXXXXXXX"
                  className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={15}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-dark-300 mb-2">
                  Email *
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={e => onRegisterDataChange({ ...registerData, email: e.target.value })}
                  placeholder="ejemplo@gmail.com"
                  className="w-full p-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  {isRegistering ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Registrar'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
