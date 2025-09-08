import { ClienteData } from '../components/types';

// Función para comparar niveles de tarjeta - EXTRAÍDA DEL ORIGINAL
export const isHigherLevel = (newLevel: string, oldLevel: string): boolean => {
  const levels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
};

// Helper para calcular datos de nivel de lealtad - EXTRAÍDO DEL ORIGINAL
export const calculateLoyaltyLevel = (portalConfig: any, clienteData: ClienteData | null) => {
  const nivelesOrdenados = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const puntosRequeridos = {
    'Bronce': 0,
    'Plata': 100,
    'Oro': 500,
    'Diamante': 1500,
    'Platino': 3000
  };
  
  // Actualizar con configuración del admin si existe
  portalConfig.tarjetas?.forEach((tarjeta: any) => {
    if (tarjeta.condiciones?.puntosMinimos) {
      puntosRequeridos[tarjeta.nivel as keyof typeof puntosRequeridos] = tarjeta.condiciones.puntosMinimos;
    }
  });
  
  const maxPuntos = Math.max(...Object.values(puntosRequeridos));
  const puntosActuales = clienteData?.tarjetaLealtad?.puntos || 100;
  
  return {
    nivelesOrdenados,
    puntosRequeridos,
    maxPuntos,
    puntosActuales
  };
};
