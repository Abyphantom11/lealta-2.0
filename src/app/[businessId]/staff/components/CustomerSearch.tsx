'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, UserPlus } from 'lucide-react';
import { CustomerInfo } from '../types/customer.types';

interface CustomerSearchProps {
  cedula: string;
  onCedulaChange: (value: string) => void;
  customerInfo: CustomerInfo | null;
  searchResults: CustomerInfo[];
  showSearchResults: boolean;
  isSearchingCustomer: boolean;
  onSelectCustomer: (customer: CustomerInfo) => void;
  onRegisterClient: () => void;
  onShowClientDetails: () => void;
}

export const CustomerSearch = ({
  cedula,
  onCedulaChange,
  customerInfo,
  searchResults,
  showSearchResults,
  isSearchingCustomer,
  onSelectCustomer,
  onRegisterClient,
  onShowClientDetails,
}: CustomerSearchProps) => {
  return (
    <div className="search-container relative">
      <label htmlFor="cedula" className="block text-sm font-medium text-dark-300 mb-2">
        Cédula del Cliente *
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-dark-400" />
        </div>
        <input
          id="cedula"
          type="text"
          value={cedula}
          onChange={e => onCedulaChange(e.target.value)}
          placeholder="Ingresa cédula o busca por nombre..."
          className="w-full pl-10 pr-4 p-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          maxLength={20}
          autoComplete="off"
        />
        {isSearchingCustomer && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda en tiempo real */}
      <AnimatePresence>
        {showSearchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={result.id || index}
                type="button"
                onClick={() => onSelectCustomer(result)}
                className="w-full text-left px-4 py-3 hover:bg-dark-700 transition-colors border-b border-dark-600 last:border-b-0 focus:outline-none focus:bg-dark-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{result.nombre}</p>
                    <p className="text-dark-300 text-sm">
                      Cédula: {result.cedula} • {result.puntos} puntos
                    </p>
                  </div>
                  <div className="ml-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        result.nivel === 'oro'
                          ? 'bg-yellow-100 text-yellow-800'
                          : result.nivel === 'plata'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {result.nivel}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cliente seleccionado */}
      <AnimatePresence>
        {customerInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-4 bg-dark-700 border border-dark-600 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{customerInfo.nombre}</p>
                  <p className="text-dark-300 text-sm">
                    {customerInfo.puntos} puntos • Nivel {customerInfo.nivel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onShowClientDetails}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                Ver datos
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opción de registrar cliente nuevo */}
      {cedula.length >= 6 && !customerInfo && !isSearchingCustomer && (
        <div className="mt-3 p-4 bg-dark-700 border border-dark-600 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Cliente no encontrado</p>
                <p className="text-dark-300 text-sm">¿Deseas registrar esta cédula?</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRegisterClient}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              Registrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
