'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Search } from 'lucide-react';
import type { CustomerInfo } from '../types/customer.types';

interface CustomerSearchFormProps {
  cedula: string;
  onCedulaChange: (value: string) => void;
  customerInfo: CustomerInfo | null;
  searchResults: CustomerInfo[];
  showSearchResults: boolean;
  isSearchingCustomer: boolean;
  onSelectClient: (client: CustomerInfo) => void;
  onShowRegister: () => void;
  onShowClientDetails: () => void;
}

export default function CustomerSearchForm({
  cedula,
  onCedulaChange,
  customerInfo,
  searchResults,
  showSearchResults,
  isSearchingCustomer,
  onSelectClient,
  onShowRegister,
  onShowClientDetails
}: CustomerSearchFormProps) {

  return (
    <div className="space-y-6">
      {/* Customer Search Input */}
      <div className="search-container relative">
        <label htmlFor="cedula" className="block text-sm font-medium text-dark-300 mb-2">
          Cédula del Cliente *
        </label>
        <div className="relative">
          <input
            id="cedula"
            type="text"
            value={cedula}
            onChange={e => onCedulaChange(e.target.value)}
            placeholder="Ingresa cédula o busca por nombre..."
            className="w-full p-3 pl-10 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            maxLength={20}
            autoComplete="off"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          {isSearchingCustomer && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showSearchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {searchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => onSelectClient(result)}
                className="w-full text-left px-4 py-3 hover:bg-dark-700 transition-colors border-b border-dark-600 last:border-b-0 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium group-hover:text-blue-300 transition-colors">
                      {result.nombre}
                    </div>
                    <div className="text-dark-400 text-sm">
                      Cédula: {result.cedula} • {result.puntos} puntos • Nivel {result.nivel}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Info Display */}
      <AnimatePresence>
        {customerInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-dark-700 border border-dark-600 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">{customerInfo.nombre}</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-dark-300">
                      Cédula: <span className="text-blue-400">{customerInfo.cedula}</span>
                    </span>
                    <span className="text-dark-300">
                      Puntos: <span className="text-yellow-400 font-medium">{customerInfo.puntos}</span>
                    </span>
                    <span className="text-dark-300">
                      Nivel: <span className="text-purple-400 font-medium">{customerInfo.nivel}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onShowClientDetails}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Ver detalles
              </button>
            </div>
            
            {/* Additional customer info */}
            {(customerInfo.email || customerInfo.telefono || customerInfo.totalGastado) && (
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {customerInfo.email && (
                    <div>
                      <span className="text-dark-400">Email:</span>
                      <p className="text-white">{customerInfo.email}</p>
                    </div>
                  )}
                  {customerInfo.telefono && (
                    <div>
                      <span className="text-dark-400">Teléfono:</span>
                      <p className="text-white">{customerInfo.telefono}</p>
                    </div>
                  )}
                  {customerInfo.totalGastado !== undefined && (
                    <div>
                      <span className="text-dark-400">Total gastado:</span>
                      <p className="text-green-400 font-medium">${customerInfo.totalGastado.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register New Customer Option */}
      <AnimatePresence>
        {cedula.length >= 6 && !customerInfo && !isSearchingCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-dark-700 border border-dark-600 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Cliente no encontrado</h3>
                  <p className="text-dark-300 text-sm">
                    ¿Deseas registrar la cédula <span className="text-green-400 font-medium">{cedula}</span>?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onShowRegister}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar cliente</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
