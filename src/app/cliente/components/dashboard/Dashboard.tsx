'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  LogOut,
  Menu,
  User,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { clientSession } from '@/utils/mobileStorage';
import { logger } from '@/utils/logger';
import { calcularProgresoUnificado } from '@/lib/loyalty-progress';
import { useVisitTracking } from '@/hooks/useVisitTracking';
import { useTheme } from '@/contexts/ThemeContext';
import BannersSection from '../sections/BannersSection';
import PromocionesSection from '../sections/PromocionesSection';
import RecompensasSection from '../sections/RecompensasSection';
import FavoritoDelDiaSection from '../sections/FavoritoDelDiaSection';
import NotificationBox from '@/components/cliente/NotificationBox';
import { BalanceCard } from './BalanceCard';

interface DashboardProps {
  clienteData: any;
  cedula: string;
  showTarjeta: boolean;
  setShowTarjeta: (show: boolean) => void;
  showLevelUpAnimation: boolean;
  setShowLevelUpAnimation: (show: boolean) => void;
  oldLevel: string;
  newLevel: string;
  portalConfig: any;
  businessId?: string; // Agregar businessId prop
  onMenuOpen?: () => void;
  handleLogout?: () => void;
  // Compatibilidad con versiones antiguas
  setStep?: (step: 'initial' | 'cedula' | 'register' | 'dashboard') => void;
  setIsMenuDrawerOpen?: (open: boolean) => void;
  menuCategories?: any[];
  loadMenuCategories?: () => void;
}

// Componente LoyaltyLevelDisplay extraído del código original
const LoyaltyLevelDisplay = ({
  tarjeta,
  nivel,
  clienteData,
  portalConfig,
}: {
  tarjeta: any;
  nivel: string;
  clienteData: any;
  portalConfig: any;
}) => {
  // OBTENER NIVELES DINÁMICAMENTE desde portalConfig

  // Verificar que hay tarjetas configuradas
  if (!(portalConfig?.tarjetas?.length)) {
    // Fallback si no hay configuración de tarjetas
    console.warn(
      '❌ No se encontraron tarjetas configuradas en portalConfig:',
      portalConfig
    );
    return (
      <div className="text-gray-400">
        Configuración de tarjetas no disponible
      </div>
    );
  }

  // 🎯 USAR FUNCIÓN UNIFICADA PARA CALCULAR PROGRESO CORRECTO
  let progress = 0;
  let siguienteNivel = 'Platino'; // Por defecto
  let mensaje: string;

  try {
    // ✅ CONFIGURACIÓN BASE QUE COINCIDE CON ADMIN
    const puntosRequeridosConfig: { [key: string]: number } = {
      'Bronce': 0,
      'Plata': 100,  // ✅ CORREGIDO: según admin config
      'Oro': 500,
      'Diamante': 1500,  // ✅ CORREGIDO: era 15000, debe ser 1500
      'Platino': 3000    // ✅ CORREGIDO: era 25000, debe ser 3000
    };

    // ✅ ACTUALIZAR con configuración del admin si existe
    if (portalConfig?.tarjetas && Array.isArray(portalConfig.tarjetas)) {
      portalConfig.tarjetas.forEach((tarjetaConfig: any) => {
        if (tarjetaConfig.condiciones?.puntosMinimos !== undefined && tarjetaConfig.nivel) {
          puntosRequeridosConfig[tarjetaConfig.nivel as keyof typeof puntosRequeridosConfig] = tarjetaConfig.condiciones.puntosMinimos;
        }
      });
    }

    // 🔧 LÓGICA CORREGIDA PARA TARJETAS MANUALES
    const puntosCliente = clienteData.puntos || 0;
    const puntosProgresoBD = clienteData.tarjetaLealtad?.puntosProgreso || 0;
    const esAsignacionManual = clienteData.tarjetaLealtad?.asignacionManual || false;
    
    // 🎯 CÁLCULO INTELIGENTE: Para tarjetas manuales, usar los puntos del cliente si son mayores
    const puntosProgreso = esAsignacionManual 
      ? Math.max(puntosProgresoBD, puntosCliente)
      : puntosProgresoBD;
      
    const resultado = calcularProgresoUnificado(
      puntosProgreso, // ✅ USAR PUNTOS CALCULADOS INTELIGENTEMENTE
      clienteData.totalVisitas || 0,
      clienteData.tarjetaLealtad?.nivel || 'Bronce',
      esAsignacionManual,
      puntosRequeridosConfig // ✅ PASAR CONFIGURACIÓN REAL
    );

    progress = resultado.progreso;
    siguienteNivel = resultado.siguienteNivel;
    mensaje = resultado.mensaje;

  } catch (error) {
    console.error('Error calculando progreso:', error);
    mensaje = 'Error al calcular progreso';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-white/80">
        <span>Progreso</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-dark-700 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/60">
        <span>{nivel}</span>
        <span>{siguienteNivel}</span>
      </div>
      {mensaje && siguienteNivel !== 'Máximo' && (
        <div className="text-center text-xs text-white/50">
          {mensaje}
        </div>
      )}
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
  oldLevel,
  newLevel,
  setIsMenuDrawerOpen,
  menuCategories = [],
  loadMenuCategories = () => {},
  cedula,
  portalConfig,
  businessId, // Agregar businessId
  handleLogout: externalHandleLogout,
  onMenuOpen,
  // refreshClienteData no se usa actualmente
}: DashboardProps) => {
  // Estado para el drawer de perfil
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = React.useState(false);
  
  // 🎨 Hook de tema para obtener colores personalizados
  const { themeConfig } = useTheme();

  // 📊 Tracking de visitas automático
  useVisitTracking({
    clienteId: clienteData?.id || undefined, // Usar el ID real del cliente, no la cédula
    businessId: businessId,
    enabled: true,
    path: '/cliente'
  });

  const handleLogout = async () => {
    try {
      // Si hay una función handleLogout externa, usarla
      if (externalHandleLogout) {
        externalHandleLogout();
        return;
      }

      // De lo contrario, usar la implementación original
      clientSession.clear();
      logger.log('🔓 Sesión cerrada');
      if (setStep) {
        setStep('initial');
      }
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
            <h1 className="text-xl text-white">
              ¡Bienvenido,{' '}
              <span style={{ color: themeConfig.nameColor || '#ec4899' }} className="font-semibold">
                {clienteData?.nombre?.split(' ')[0] || 'Cliente'}
              </span>!
            </h1>
          </div>
          <div className="flex items-center justify-end">
            <NotificationBox clienteId={cedula} />
          </div>
        </div>
      </div>
      
      {/* Contenido principal con padding superior */}
      <div className="pt-16">
        {/* Balance Card con tema dinámico */}
        <BalanceCard
          clienteData={clienteData}
          cedula={cedula}
          showTarjeta={showTarjeta}
          setShowTarjeta={setShowTarjeta}
        />
        
        {/* Banners Section - Editable desde Admin */}
        <BannersSection businessId={businessId} />
        {/* Promociones Section - Editable desde Admin */}
        <PromocionesSection businessId={businessId} />
        {/* Favorito del día Section - Editable desde Admin */}
        <FavoritoDelDiaSection businessId={businessId} />
        {/* Recompensas - Editable desde Admin */}
        <RecompensasSection businessId={businessId} />
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="bg-dark-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                {/* Vista de la tarjeta */}
                <div className="p-4">
                  {(() => {
                    // ✅ USAR PUNTOS CORRECTOS: Canjeables para mostrar, progreso inteligente para nivel
                    const puntosCanjeables = clienteData?.puntos || 100;
                    const puntosProgresoBD = clienteData?.tarjetaLealtad?.puntosProgreso || 0;
                    const esAsignacionManual = clienteData?.tarjetaLealtad?.asignacionManual || false;
                    
                    // 🎯 MISMA LÓGICA: Para tarjetas manuales, usar el mayor entre BD y puntos cliente
                    const puntosProgreso = esAsignacionManual 
                      ? Math.max(puntosProgresoBD, puntosCanjeables)
                      : (puntosProgresoBD || puntosCanjeables);
                    let nivel = clienteData?.tarjetaLealtad?.nivel || 'Bronce';

                    // Solo calcular si NO hay tarjeta asignada (no sobrescribir la BD)
                    if (!clienteData?.tarjetaLealtad) {
                      // Si no hay tarjeta, calcular basado en puntos usando configuración dinámica
                      if (puntosProgreso >= 25000) nivel = 'Platino';
                      else if (puntosProgreso >= 15000) nivel = 'Diamante';
                      else if (puntosProgreso >= 500) nivel = 'Oro';  // ✅ CORREGIDO
                      else if (puntosProgreso >= 400) nivel = 'Plata';
                      else nivel = 'Bronce';
                    }

                    // Obtener configuración de niveles desde el portal config
                    const nivelConfig =
                      portalConfig?.tarjetas?.[0]?.niveles?.find(
                        (n: any) => n.nombre === nivel
                      );

                    // Configuración según nivel (usar configuración del admin o fallback)
                    const nivelesConfig: { [key: string]: any } = {
                      Bronce: {
                        colores: {
                          gradiente: nivelConfig?.colores || [
                            '#CD7F32',
                            '#8B4513',
                          ],
                        },
                        textoDefault: 'Cliente Inicial',
                        beneficio: 'Acumulación de puntos básica',
                      },
                      Plata: {
                        colores: {
                          gradiente: nivelConfig?.colores || [
                            '#C0C0C0',
                            '#808080',
                          ],
                        },
                        textoDefault: 'Cliente Frecuente',
                        beneficio: '5% descuento en compras',
                      },
                      Oro: {
                        colores: {
                          gradiente: nivelConfig?.colores || [
                            '#FFD700',
                            '#FFA500',
                          ],
                        },
                        textoDefault: 'Cliente VIP',
                        beneficio: '10% descuento + producto gratis mensual',
                      },
                      Diamante: {
                        colores: {
                          gradiente: nivelConfig?.colores || [
                            '#B9F2FF',
                            '#00CED1',
                          ],
                        },
                        textoDefault: 'Cliente Elite',
                        beneficio:
                          '15% descuento + acceso a eventos exclusivos',
                      },
                      Platino: {
                        colores: {
                          gradiente: nivelConfig?.colores || [
                            '#E5E4E2',
                            '#C0C0C0',
                          ],
                        },
                        textoDefault: 'Cliente Exclusivo',
                        beneficio: '20% descuento + servicio VIP personalizado',
                      },
                    };

                    // Configuración actual (COMPLETAMENTE DINÁMICA)
                    const tarjeta = {
                      nivel: nivel,
                      nombrePersonalizado:
                        portalConfig?.tarjetas?.find((t: any) => t.nivel === nivel)?.nombrePersonalizado ||
                        `Tarjeta ${nivel}`,
                      textoCalidad:
                        portalConfig?.tarjetas?.find((t: any) => t.nivel === nivel)?.textoCalidad ||
                        nivelesConfig[nivel].textoDefault,
                      colores: nivelesConfig[nivel].colores,
                      beneficios:
                        portalConfig?.tarjetas?.find((t: any) => t.nivel === nivel)?.beneficio ||
                        nivelesConfig[nivel].beneficio,
                    };

                    // Función para obtener colores del nivel
                    const getLevelColors = (level: string) => {
                      const colorMap: { [key: string]: string } = {
                        Bronce: '#8B4513',
                        Plata: '#808080',
                        Oro: '#B8860B',
                        Diamante: '#4169E1',
                        Platino: '#C0C0C0',
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
                                borderColor: getLevelColors(nivel),
                              }}
                            >
                              {/* Efectos específicos por nivel */}
                              {nivel === 'Bronce' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-amber-200 via-transparent to-amber-800" />
                                  <div
                                    className="absolute top-6 right-8 w-3 h-3 bg-amber-600 rounded-full opacity-40 animate-bounce"
                                    style={{ animationDelay: '0s' }}
                                  />
                                  <div
                                    className="absolute top-12 right-12 w-2 h-2 bg-amber-500 rounded-full opacity-50 animate-bounce"
                                    style={{ animationDelay: '0.5s' }}
                                  />
                                  <div
                                    className="absolute bottom-8 left-8 w-2.5 h-2.5 bg-amber-700 rounded-full opacity-45 animate-bounce"
                                    style={{ animationDelay: '1s' }}
                                  />
                                  <div
                                    className="absolute bottom-12 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-35 animate-bounce"
                                    style={{ animationDelay: '1.5s' }}
                                  />
                                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" />
                                </>
                              )}

                              {nivel === 'Plata' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-15 bg-gradient-to-r from-gray-200 via-white to-gray-200" />
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
                                  <div
                                    className="absolute top-4 left-4 w-20 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 animate-pulse"
                                    style={{ animationDelay: '0s' }}
                                  />
                                  <div
                                    className="absolute top-8 left-8 w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-40 animate-pulse"
                                    style={{ animationDelay: '0.7s' }}
                                  />
                                  <div
                                    className="absolute top-12 left-12 w-12 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60 animate-pulse"
                                    style={{ animationDelay: '1.4s' }}
                                  />
                                  <div
                                    className="absolute top-6 right-6 w-24 h-24 bg-gradient-to-br from-white via-transparent to-gray-300 rounded-full opacity-10 animate-spin"
                                    style={{ animationDuration: '8s' }}
                                  />
                                </>
                              )}

                              {nivel === 'Oro' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-20 bg-gradient-to-br from-yellow-200 via-transparent to-yellow-600" />
                                  <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-10" />
                                  <div className="absolute bottom-4 left-4 w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full opacity-15" />
                                  <div
                                    className="absolute top-8 right-16 w-2 h-2 bg-yellow-300 rounded-full opacity-70 animate-ping"
                                    style={{ animationDelay: '0s' }}
                                  />
                                  <div
                                    className="absolute top-16 right-20 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-60 animate-ping"
                                    style={{ animationDelay: '0.8s' }}
                                  />
                                  <div
                                    className="absolute bottom-16 left-16 w-2.5 h-2.5 bg-yellow-200 rounded-full opacity-50 animate-ping"
                                    style={{ animationDelay: '1.6s' }}
                                  />
                                  <div
                                    className="absolute bottom-20 left-20 w-1 h-1 bg-yellow-500 rounded-full opacity-80 animate-ping"
                                    style={{ animationDelay: '2.4s' }}
                                  />
                                  <div className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent opacity-20 rotate-45 animate-pulse" />
                                  <div
                                    className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30 -rotate-45 animate-pulse"
                                    style={{ animationDelay: '1s' }}
                                  />
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
                                  <div
                                    className="absolute top-4 left-4 w-16 h-16 border border-cyan-200 opacity-20 rotate-45 animate-spin"
                                    style={{ animationDuration: '12s' }}
                                  />
                                  <div
                                    className="absolute bottom-4 right-4 w-12 h-12 border border-blue-200 opacity-15 -rotate-12 animate-spin"
                                    style={{ animationDuration: '15s' }}
                                  />
                                </>
                              )}

                              {nivel === 'Platino' && (
                                <>
                                  <div className="absolute inset-0 rounded-xl opacity-25 bg-gradient-to-br from-gray-100 via-white to-gray-300" />
                                  <div className="absolute top-0 left-0 w-full h-full border-2 border-white rounded-xl opacity-10" />
                                  <div className="absolute top-2 left-2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-5" />
                                  <div
                                    className="absolute top-6 right-10 w-3 h-3 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-60 animate-pulse"
                                    style={{ animationDelay: '0s' }}
                                  />
                                  <div
                                    className="absolute top-12 right-6 w-2 h-2 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full opacity-50 animate-pulse"
                                    style={{ animationDelay: '1s' }}
                                  />
                                  <div
                                    className="absolute bottom-10 left-10 w-2.5 h-2.5 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-70 animate-pulse"
                                    style={{ animationDelay: '2s' }}
                                  />
                                  <div
                                    className="absolute bottom-6 left-16 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-pulse"
                                    style={{ animationDelay: '0.5s' }}
                                  />
                                  <div
                                    className="absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-25 animate-pulse"
                                    style={{ animationDelay: '1.5s' }}
                                  />
                                  <div
                                    className="absolute bottom-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
                                    style={{ animationDelay: '2.5s' }}
                                  />
                                  <div
                                    className="absolute top-1/2 left-1/2 w-40 h-40 border border-gray-200 rounded-full opacity-5 animate-spin"
                                    style={{ animationDuration: '20s' }}
                                  />
                                </>
                              )}

                              <div className="relative p-6 h-full flex flex-col justify-between text-white">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3
                                      className="text-xl font-bold drop-shadow-lg text-white"
                                      style={{
                                        textShadow:
                                          '2px 2px 4px rgba(0,0,0,0.8)',
                                      }}
                                    >
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
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    }}
                                  />
                                </div>

                                <div className="text-center">
                                  <div
                                    className="text-lg font-bold tracking-widest mb-2 text-white"
                                    style={{
                                      textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                                    }}
                                  >
                                    {nivel.toUpperCase()}
                                  </div>
                                  <p
                                    className="text-sm font-medium text-white"
                                    style={{
                                      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                                    }}
                                  >
                                    {tarjeta.textoCalidad}
                                  </p>
                                </div>

                                <div
                                  className="flex justify-between items-end text-xs font-semibold text-white"
                                  style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  }}
                                >
                                  <span>
                                    {portalConfig.nombreEmpresa || 'LEALTA 2.0'}
                                  </span>
                                  <span>
                                    ****
                                    {(clienteData?.cedula || cedula).slice(-4)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Componente visual de nivel de tarjeta */}
                        <div className="bg-dark-900/70 rounded-xl p-4 mt-2">
                          <h3 className="text-white font-semibold mb-3">
                            Nivel de Lealtad
                          </h3>
                          <div className="relative pt-1">
                            <LoyaltyLevelDisplay
                              tarjeta={tarjeta}
                              nivel={nivel}
                              clienteData={clienteData}
                              portalConfig={portalConfig}
                            />
                          </div>

                          {/* Beneficios */}
                          <div className="mt-4">
                            <h4 className="text-white/90 text-sm font-semibold mb-2">
                              Beneficios de tu nivel:
                            </h4>
                            <p className="text-white/80 text-xs">
                              {portalConfig?.tarjetas?.find(
                                (t: any) => t.nivel === nivel
                              )?.beneficio || tarjeta.beneficios}
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

      {/* Profile Drawer */}
      <AnimatePresence>
        {isProfileDrawerOpen && (
          <>
            {/* Overlay de fondo */}
            <motion.div
              className="fixed inset-0 bg-black/70 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileDrawerOpen(false)}
            />

            {/* Profile Drawer */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-dark-800 rounded-t-2xl p-6 z-50"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col space-y-4">
                {/* Handle bar */}
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Perfil</h3>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
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
                const animationDuration = Math.random() * 3 + 2 + 's';
                const animationDelay = Math.random() * 1 + 's';
                const color = [
                  '#FFD700',
                  '#FFC0CB',
                  '#00CED1',
                  '#FF6347',
                  '#ADFF2F',
                ][Math.floor(Math.random() * 5)];
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
                      animation: `fall ${animationDuration} linear ${animationDelay} forwards`,
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
                <span className="text-xl font-semibold text-primary-400">
                  {newLevel}
                </span>
              </div>
            </div>
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-10 rounded-full transition-all duration-300 text-lg shadow-lg z-[100] relative"
              onClick={() => {
                setShowLevelUpAnimation(false);
              }}
            >
              ¡Continuar!
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
        <div className="flex items-center justify-around py-3">
          <div className="text-center">
            <Coffee className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Inicio</span>
          </div>
          <button
            onClick={() => {
              // Usar la función apropiada dependiendo de cuál esté disponible
              if (onMenuOpen) {
                onMenuOpen();
              } else if (setIsMenuDrawerOpen) {
                setIsMenuDrawerOpen(true);
                if (
                  menuCategories &&
                  menuCategories.length === 0 &&
                  loadMenuCategories
                ) {
                  loadMenuCategories();
                }
              }
            }}
            className="text-center relative"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-1">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-pink-500 font-medium">Menú</span>
          </button>
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="text-center"
          >
            <User className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
      {/* Spacer for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
};
