'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, Bell, LogOut, Eye, Menu, User, Trophy, ArrowRight, 
  Smartphone, X 
} from 'lucide-react';
import { clientSession } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';
import BannersSection from '../sections/BannersSection';
import PromocionesSection from '../sections/PromocionesSection';
import RecompensasSection from '../sections/RecompensasSection';
import FavoritoDelDiaSection from '../sections/FavoritoDelDiaSection';

interface DashboardProps {
  setStep: (step: 'initial' | 'cedula' | 'register' | 'dashboard') => void;
  clienteData: any;
  showTarjeta: boolean;
  setShowTarjeta: (show: boolean) => void;
  showLevelUpAnimation: boolean;
  setShowLevelUpAnimation: (show: boolean) => void;
  showAddToHomeScreen: boolean;
  setShowAddToHomeScreen: (show: boolean) => void;
  oldLevel: string;
  newLevel: string;
  setIsMenuDrawerOpen: (open: boolean) => void;
  menuCategories: any[];
  loadMenuCategories: () => void;
  cedula: string;
  portalConfig: any;
  installApp: () => void;
}

// Componente LoyaltyLevelDisplay extraído del código original
const LoyaltyLevelDisplay = ({ tarjeta, nivel }: { tarjeta: any; nivel: string }) => {
  const niveles = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const currentIndex = niveles.indexOf(nivel);
  const progress = ((currentIndex + 1) / niveles.length) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-white/80">
        <span>Progreso</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-dark-700 rounded-full h-3">
        <div 
          className="h-3 rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/60">
        <span>Bronce</span>
        <span>Platino</span>
      </div>
    </div>
  );
};

// Componentes de secciones - Completado

export const Dashboard = ({ 
  setStep,
  clienteData,
  showTarjeta,
  setShowTarjeta,
  showLevelUpAnimation,
  setShowLevelUpAnimation,
  showAddToHomeScreen,
  setShowAddToHomeScreen,
  oldLevel,
  newLevel,
  setIsMenuDrawerOpen,
  menuCategories,
  loadMenuCategories,
  cedula,
  portalConfig,
  installApp
}: DashboardProps) => {
  const handleLogout = async () => {
    try {
      clientSession.clear();
      logger.log('🔓 Sesión cerrada');
      setStep('initial');
    } catch (error) {
      logger.error('Error al cerrar sesión:', error);
    }
  };

  // EXACT COPY of renderDashboard() from original
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
        {/* Balance Card */}
        <div className="mx-4 mb-6 mt-4">
          <motion.div
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <Coffee className="w-full h-full text-white/30" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-lg mb-2">Balance de Puntos</div>
                <div className="text-4xl font-bold text-white mb-1">
                  {clienteData?.tarjetaLealtad?.puntos || 100}
                </div>
                <div className="text-white/60 text-sm mb-2">
                  Tarjeta ****{(clienteData?.cedula || cedula).slice(-4)}
                </div>
              </div>
              <button 
                onClick={() => setShowTarjeta(!showTarjeta)} 
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                aria-label="Ver tarjeta de fidelidad"
              >
                <Eye className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>
        </div>
        {/* Banners Section - Editable desde Admin */}
        <BannersSection />
        {/* Promociones Section - Editable desde Admin */}
        <PromocionesSection />
        {/* Favorito del día Section - Editable desde Admin */}
        <FavoritoDelDiaSection />
        {/* Recompensas - Editable desde Admin */}
        <RecompensasSection />
      </div>
      {/* Modal de tarjeta de fidelidad */}
      <AnimatePresence>
        {showTarjeta && (
          <>
            {/* Overlay de fondo */}
            <motion.div 
              className="fixed inset-0 bg-black/70 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTarjeta(false)}
            />
            
            {/* Modal contenido */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-dark-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                {/* Vista de la tarjeta */}
                <div className="p-4">
                  {(() => {
                    // Obtener el nivel directamente desde la API si está disponible
                    // o calcular basado en puntos como fallback
                    const puntos = clienteData?.tarjetaLealtad?.puntos || 100;
                    let nivel = clienteData?.tarjetaLealtad?.nivel || "Bronce";
                    
                    // Si no hay tarjeta asignada, calcular nivel sugerido basado en puntos (solo visualización)
                    if (!clienteData?.tarjetaLealtad) {
                      if (puntos >= 3000) nivel = "Platino";
                      else if (puntos >= 1500) nivel = "Diamante";
                      else if (puntos >= 500) nivel = "Oro";
                      else if (puntos >= 100) nivel = "Plata";
                    }
                    
                    // Obtener configuración de tarjetas desde el portal config
                    const tarjetaConfig = portalConfig.tarjetas?.find((t: any) => t.nivel === nivel);
                    
                    // Configuración según nivel (usar configuración del admin o fallback)
                    const nivelesConfig: {[key: string]: any} = {
                      'Bronce': { 
                        colores: { gradiente: ['#CD7F32', '#8B4513'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Inicial',
                        beneficio: tarjetaConfig?.beneficio || 'Acumulación de puntos básica' 
                      },
                      'Plata': { 
                        colores: { gradiente: ['#C0C0C0', '#808080'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Frecuente',
                        beneficio: tarjetaConfig?.beneficio || '5% descuento en compras' 
                      },
                      'Oro': { 
                        colores: { gradiente: ['#FFD700', '#FFA500'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente VIP',
                        beneficio: tarjetaConfig?.beneficio || '10% descuento + producto gratis mensual' 
                      },
                      'Diamante': { 
                        colores: { gradiente: ['#B9F2FF', '#00CED1'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Elite',
                        beneficio: tarjetaConfig?.beneficio || '15% descuento + acceso a eventos exclusivos' 
                      },
                      'Platino': { 
                        colores: { gradiente: ['#E5E4E2', '#C0C0C0'] }, 
                        textoDefault: tarjetaConfig?.textoCalidad || 'Cliente Exclusivo',
                        beneficio: tarjetaConfig?.beneficio || '20% descuento + servicio VIP personalizado' 
                      }
                    };
                    
                    // Configuración actual
                    const tarjeta = {
                      nivel: nivel,
                      nombrePersonalizado: tarjetaConfig?.nombrePersonalizado || `Tarjeta ${nivel}`,
                      textoCalidad: tarjetaConfig?.textoCalidad || nivelesConfig[nivel].textoDefault,
                      colores: nivelesConfig[nivel].colores,
                      beneficios: tarjetaConfig?.beneficio || nivelesConfig[nivel].beneficio
                    };
                    
                    // Función para obtener colores del nivel
                    const getLevelColors = (level: string) => {
                      const colorMap: { [key: string]: string } = {
                        'Bronce': '#8B4513',
                        'Plata': '#808080',
                        'Oro': '#B8860B',
                        'Diamante': '#4169E1',
                        'Platino': '#C0C0C0'
                      };
                      return colorMap[level] || '#71797E';
                    };
                    
                    return (
                      <div className="space-y-4">
                        {/* Vista previa de la tarjeta */}
                        <div className="flex justify-center">
                          <div className="relative w-80 h-48">
                            <div 
                              className="absolute inset-0 rounded-xl shadow-2xl transform transition-all duration-300 border-2"
                              style={{
                                background: `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                borderColor: getLevelColors(nivel)
                              }}
                            >
                              {/* Efectos específicos por nivel */}
                              {nivel === 'Bronce' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-amber-200 via-transparent to-amber-800" />
                                  <div className="absolute top-6 right-8 w-3 h-3 bg-amber-600 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-12 right-12 w-2 h-2 bg-amber-500 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.5s' }} />
                                  <div className="absolute bottom-8 left-8 w-2.5 h-2.5 bg-amber-700 rounded-full opacity-45 animate-bounce" style={{ animationDelay: '1s' }} />
                                  <div className="absolute bottom-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-35 animate-bounce" style={{ animationDelay: '1.5s' }} />
                                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" />
                                </>
                              )}
                              
                              {nivel === 'Plata' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-15 bg-gradient-to-r from-gray-200 via-white to-gray-200" />
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
                                  <div className="absolute top-4 left-4 w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 animate-pulse" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-8 left-8 w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-40 animate-pulse" style={{ animationDelay: '0.7s' }} />
                                  <div className="absolute top-12 left-12 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 animate-pulse" style={{ animationDelay: '1.4s' }} />
                                  <div className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white via-transparent to-gray-300 rounded-full opacity-10 animate-spin" style={{ animationDuration: '8s' }} />
                                </>
                              )}
                              
                              {nivel === 'Oro' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                                  <div className="absolute top-8 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-60 animate-ping" style={{ animationDelay: '0.8s' }} />
                                  <div className="absolute bottom-16 left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full opacity-50 animate-ping" style={{ animationDelay: '1.6s' }} />
                                  <div className="absolute bottom-20 left-20 w-1 h-1 bg-yellow-500 rounded-full opacity-80 animate-ping" style={{ animationDelay: '2.4s' }} />
                                  <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-20 rotate-45 animate-pulse" />
                                  <div className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 -rotate-45 animate-pulse" style={{ animationDelay: '1s' }} />
                                </>
                              )}
                              
                              {nivel === 'Diamante' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-blue-200 via-transparent to-cyan-400" />
                                  <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse" />
                                  <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse delay-300" />
                                  <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse delay-700" />
                                  <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full opacity-40 animate-pulse delay-1000" />
                                  <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-55 animate-pulse delay-500" />
                                  <div className="absolute bottom-8 right-12 w-2 h-2 bg-cyan-300 rounded-full opacity-45 animate-pulse delay-1200" />
                                  <div className="absolute top-4 left-4 w-16 h-16 border border-cyan-200 opacity-20 rotate-45 animate-spin" style={{ animationDuration: '12s' }} />
                                  <div className="absolute bottom-4 right-4 w-12 h-12 border border-blue-200 opacity-15 -rotate-12 animate-spin" style={{ animationDuration: '15s' }} />
                                </>
                              )}
                              
                              {nivel === 'Platino' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-25 bg-gradient-to-br from-gray-100 via-white to-gray-300" />
                                  <div className="absolute top-0 left-0 w-full h-full border-2 border-white rounded-xl opacity-10" />
                                  <div className="absolute top-2 left-2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-5" />
                                  <div className="absolute top-6 right-10 w-3 h-3 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0s' }} />
                                  <div className="absolute top-12 right-6 w-2 h-2 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }} />
                                  <div className="absolute bottom-10 left-10 w-2.5 h-2.5 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
                                  <div className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                  <div className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-25 animate-pulse" style={{ animationDelay: '1.5s' }} />
                                  <div className="absolute bottom-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" style={{ animationDelay: '2.5s' }} />
                                  <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-gray-200 rounded-full opacity-5 animate-spin" style={{ animationDuration: '20s' }} />
                                </>
                              )}
                              
                              <div className="relative p-6 h-full flex flex-col justify-between text-white">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-xl font-bold drop-shadow-lg text-white"
                                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                      {tarjeta.nombrePersonalizado}
                                    </h3>
                                  </div>
                                </div>
                                
                                {/* Chip con mejor contraste */}
                                <div className="absolute top-16 left-6">
                                  <div 
                                    className="w-8 h-6 rounded-sm border"
                                    style={{
                                      background: `linear-gradient(135deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`,
                                      borderColor: 'rgba(255,255,255,0.3)',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                  />
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-lg font-bold tracking-widest mb-2 text-white"
                                      style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}>
                                    {nivel.toUpperCase()}
                                  </div>
                                  <p className="text-sm font-medium text-white"
                                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                                    {tarjeta.textoCalidad}
                                  </p>
                                </div>
                                
                                <div className="flex justify-between items-end text-xs font-semibold text-white"
                                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                                  <span>{portalConfig.nombreEmpresa || 'LEALTA 2.0'}</span>
                                  <span>****{(clienteData?.cedula || cedula).slice(-4)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Componente visual de nivel de tarjeta */}
                        <div className="bg-dark-900/70 rounded-xl p-4 mt-2">
                          <h3 className="text-white font-semibold mb-3">Nivel de Lealtad</h3>
                          <div className="relative pt-1">
                            <LoyaltyLevelDisplay 
                              tarjeta={tarjeta}
                              nivel={nivel}
                            />
                          </div>
                          
                          {/* Beneficios */}
                          <div className="mt-4">
                            <h4 className="text-white/90 text-sm font-semibold mb-2">Beneficios de tu nivel:</h4>
                            <p className="text-white/80 text-xs">
                              {tarjeta.beneficios}
                            </p>
                          </div>
                        </div>
                        
                        {/* botón cerrar */}
                        <div className="flex justify-center mt-2">
                          <button 
                            onClick={() => setShowTarjeta(false)}
                            className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm"
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Animación de ascenso de nivel - Versión simplificada */}
      {showLevelUpAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gradient-to-b from-dark-900 to-dark-800 p-8 rounded-2xl max-w-sm w-full text-center relative overflow-hidden">
            
            {/* Confeti simplificado */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => {
                const left = Math.random() * 100;
                const size = Math.random() * 10 + 5;
                const animationDuration = (Math.random() * 3 + 2) + 's';
                const animationDelay = (Math.random() * 1) + 's';
                const color = ['#FFD700', '#FFC0CB', '#00CED1', '#FF6347', '#ADFF2F'][Math.floor(Math.random() * 5)];
                // Crear un identificador único basado en múltiples valores aleatorios
                const uniqueKey = `confetti-${left.toFixed(2)}-${size.toFixed(2)}-${i}`;
                
                return (
                  <div
                    key={uniqueKey}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: '-20px',
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: color,
                      borderRadius: '50%',
                      animation: `fall ${animationDuration} linear ${animationDelay} forwards`
                    }}
                  />
                );
              })}
            </div>
            
            {/* CSS para la animación de confeti */}
            <style>{`
              @keyframes fall {
                0% { transform: translateY(-10px); opacity: 1; }
                80% { opacity: 0.8; }
                100% { transform: translateY(100vh); opacity: 0; }
              }
            `}</style>
            
            <div className="bg-yellow-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">
              ¡Felicidades!
            </h3>
            
            <div className="text-gray-300 mb-8">
              <p className="mb-2">Has ascendido de nivel</p>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-gray-400">{oldLevel}</span>
                <ArrowRight className="w-5 h-5 text-primary-500" />
                <span className="text-xl font-semibold text-primary-400">{newLevel}</span>
              </div>
            </div>
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-10 rounded-full transition-all duration-300 text-lg shadow-lg z-[100] relative"
              onClick={() => {
                console.log("botón ¡Continuar! pulsado");
                setShowLevelUpAnimation(false);
                // Mostrar opciones de instalación inmediatamente
                setTimeout(() => {
                  setShowAddToHomeScreen(true);
                  // Intentar instalar la app automáticamente al subir de nivel
                  installApp();
                }, 300);
              }}
            >
              ¡Continuar!
            </button>
          </div>
        </div>
      )}
      {/* Modal para agregar al escritorio */}
      <AnimatePresence>
        {showAddToHomeScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAddToHomeScreen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-dark-800 p-6 rounded-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Acceso rápido</h3>
                <button 
                  onClick={() => setShowAddToHomeScreen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-300 text-sm">
                  Agrega nuestra aplicación a tu pantalla de inicio para un acceso más rápido.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    installApp();
                    setShowAddToHomeScreen(false);
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Agregar a pantalla de inicio</span>
                </button>
                
                <button 
                  onClick={() => setShowAddToHomeScreen(false)}
                  className="w-full bg-dark-700 hover:bg-dark-600 text-dark-300 font-medium py-2 px-4 rounded-lg"
                >
                  No mostrar de nuevo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
        <div className="flex items-center justify-around py-3">
          <div className="text-center">
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </div>
          <button 
            onClick={() => {
              setIsMenuDrawerOpen(true);
              if (menuCategories.length === 0) {
                loadMenuCategories();
              }
            }}
            className="text-center relative"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-pink-500 font-medium">Menú</span>
          </button>
          <div className="text-center">
            <User className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Perfil</span>
          </div>
        </div>
      </div>
      {/* Spacer for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
};
