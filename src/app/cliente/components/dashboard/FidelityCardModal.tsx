'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ClienteData } from '../types';
import { calculateLoyaltyLevel } from '../../utils/loyaltyCalculations';

interface FidelityCardModalProps {
  showTarjeta: boolean;
  setShowTarjeta: (show: boolean) => void;
  clienteData: ClienteData | null;
  cedula: string;
  portalConfig: any;
}

// Componente para mostrar nivel de lealtad - ACTUALIZADO PARA USAR FUNCIÓN UNIFICADA
function LoyaltyLevelDisplay({ portalConfig, clienteData, tarjeta, nivel }: { 
  readonly portalConfig: any, 
  readonly clienteData: any, 
  readonly tarjeta: any, 
  readonly nivel: string 
}) {
  const levelData = calculateLoyaltyLevel(portalConfig, clienteData);
  const { nivelesOrdenados, puntosRequeridos,
          progreso, mensaje, esAsignacionManual } = levelData;
  
  return (
    <>
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white"
            style={{ background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})` }}
          >
            {nivel}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-white/80">
            {progreso}%
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-dark-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(progreso, 100)}%`
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: `linear-gradient(90deg, ${tarjeta.colores.gradiente[0]}, ${tarjeta.colores.gradiente[1]})`
          }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded"
        />
      </div>

      {/* Progreso personalizado según función unificada */}
      <div className="text-center">
        <div className="text-sm text-white/90 font-medium mb-2">
          {nivel} {esAsignacionManual ? '(Asignación Manual)' : ''}
        </div>
        <div className="text-xs text-white/70">
          {mensaje}
        </div>
      </div>

      <div className="grid grid-cols-5 text-xs text-white/60 mb-1 mt-3">
        {nivelesOrdenados.map(nivelNombre => (
          <div key={nivelNombre} className="text-center">{nivelNombre}</div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-white/60">
        {nivelesOrdenados.map(nivelNombre => (
          <div key={nivelNombre}>{puntosRequeridos[nivelNombre as keyof typeof puntosRequeridos]}</div>
        ))}
      </div>
    </>
  );
}

// Modal de Tarjeta de Fidelidad - EXTRAÍDO COMPLETO DEL ORIGINAL
export const FidelityCardModal = ({ 
  showTarjeta, 
  setShowTarjeta, 
  clienteData, 
  cedula, 
  portalConfig 
}: FidelityCardModalProps) => {
  return (
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
                            portalConfig={portalConfig}
                            clienteData={clienteData}
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
  );
};
