'use client';

import { motion, AnimatePresence } from '../../../components/motion';
import { Bell, LogOut, Menu } from 'lucide-react';
import { DashboardProps } from './types';
import { BalanceCard } from './dashboard/BalanceCard';
import { FidelityCardModal } from './dashboard/FidelityCardModal';
import BannersSection from './sections/BannersSection';
import PromocionesSection from './sections/PromocionesSection';
import FavoritoDelDiaSection from './sections/FavoritoDelDiaSection';
import RecompensasSection from './sections/RecompensasSection';

const Dashboard: React.FC<DashboardProps> = ({
  clienteData,
  cedula,
  brandingConfig,
  onMenuOpen,
  handleLogout,
  showLevelUpAnimation,
  setShowLevelUpAnimation,
  oldLevel,
  newLevel,
  showTarjeta,
  setShowTarjeta,
  portalConfig
}) => {

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl">
              Hola, <span className="text-pink-500 font-semibold">{clienteData?.nombre || 'Cliente'}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onMenuOpen}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5 text-gray-300" />
            </button>
            <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-300" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full bg-red-600/20 hover:bg-red-600/40 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {(clienteData?.nombre || 'C')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal con padding superior */}
      <div className="pt-16">
        {/* Balance Card - COMPONENTE EXTRAÍDO */}
        <BalanceCard 
          clienteData={clienteData}
          cedula={cedula}
          showTarjeta={showTarjeta}
          setShowTarjeta={setShowTarjeta}
        />

        {/* Secciones del dashboard */}
        <BannersSection />
        <PromocionesSection />
        <FavoritoDelDiaSection />
        <RecompensasSection />
      </div>

      {/* Animación de ascenso de nivel */}
      <AnimatePresence>
        {showLevelUpAnimation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-900 to-gray-800 p-8 rounded-2xl max-w-sm w-full text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">¡Felicitaciones!</h2>
                <p className="text-gray-300">Has subido de nivel</p>
              </div>
              
              <div className="mb-6">
                <div className="text-center mb-4">
                  <span className="text-gray-400">{oldLevel}</span>
                  <span className="mx-4 text-white">→</span>
                  <span className="text-purple-400 font-bold">{newLevel}</span>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🎉</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowLevelUpAnimation(false)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                ¡Genial!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Tarjeta de Fidelidad - COMPONENTE EXTRAÍDO */}
      <FidelityCardModal 
        showTarjeta={showTarjeta}
        setShowTarjeta={setShowTarjeta}
        clienteData={clienteData}
        cedula={cedula}
        portalConfig={portalConfig}
      />
    </div>
  );
};

export default Dashboard;
