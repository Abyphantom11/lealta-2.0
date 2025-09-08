'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  LogOut,
  Gift,
  Star,
  Home,
  Plus
} from 'lucide-react';

import { Cliente } from '@/types/admin';

// Interfaces
interface DashboardLegacyProps {
  readonly clienteData: Cliente;
  readonly handleLogout: () => void;
  readonly showLevelUpAnimation?: boolean;
  readonly setShowLevelUpAnimation?: (show: boolean) => void;
  readonly oldLevel?: number;
  readonly newLevel?: number;
  readonly showAddToHomeScreen?: boolean;
  readonly setShowAddToHomeScreen?: (show: boolean) => void;
  readonly deferredPrompt?: any;
  readonly installPWA?: () => void;
  readonly tarjeta?: any;
  readonly nivel?: any;
}

export default function DashboardLegacy({
  clienteData,
  handleLogout,
  showAddToHomeScreen = false,
  setShowAddToHomeScreen,
  installPWA,
  tarjeta,
  nivel
}: DashboardLegacyProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Portal Cliente
              </h1>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors"
              >
                <User className="h-5 w-5 text-gray-600" />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {clienteData.nombre}
                </span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Puntos</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {clienteData.puntos || 0}
                </p>
              </div>
              <Gift className="h-12 w-12 text-blue-600" />
            </div>
            {tarjeta && (
              <div className="mt-4 text-sm text-gray-600">
                Tarjeta: {tarjeta.tipo}
              </div>
            )}
          </motion.div>

          {/* Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nivel</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {nivel?.nombre || 'Básico'}
                </p>
              </div>
              <Star className="h-12 w-12 text-yellow-600" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: '60%' }}
                ></div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                Ver Menú
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                Historial
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                Promociones
              </button>
            </div>
          </motion.div>
        </div>

        {/* PWA Install Prompt */}
        {showAddToHomeScreen && installPWA && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg z-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Plus className="h-6 w-6 mr-3" />
                <div>
                  <p className="font-semibold">Instalar App</p>
                  <p className="text-sm opacity-90">Acceso rápido desde tu pantalla de inicio</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddToHomeScreen?.(false)}
                  className="px-4 py-2 text-sm bg-blue-700 rounded-md hover:bg-blue-800"
                >
                  Ahora no
                </button>
                <button
                  onClick={installPWA}
                  className="px-4 py-2 text-sm bg-white text-blue-600 rounded-md hover:bg-gray-100"
                >
                  Instalar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Placeholder sections */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Promociones</h3>
            <p className="text-gray-600">Contenido de promociones...</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorito del Día</h3>
            <p className="text-gray-600">Contenido del favorito del día...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
