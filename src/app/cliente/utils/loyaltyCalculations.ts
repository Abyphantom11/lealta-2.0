import { ClienteData } from '../components/types';
import { calcularProgresoUnificado } from '@/lib/loyalty-progress';

// Función para comparar niveles de tarjeta - EXTRAÍDA DEL ORIGINAL
export const isHigherLevel = (newLevel: string, oldLevel: string): boolean => {
  const levels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
};

// Helper para calcular datos de nivel de lealtad - ACTUALIZADO PARA USAR FUNCIÓN UNIFICADA
export const calculateLoyaltyLevel = (portalConfig: any, clienteData: ClienteData | null): any => {
  const nivelesOrdenados = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];

  // ✅ LÓGICA CORREGIDA PARA TARJETAS MANUALES
  // Para tarjetas manuales: usar el MAYOR entre puntosProgreso de la BD y puntos totales del cliente
  // Para tarjetas automáticas: usar puntosProgreso de la BD (que es igual a puntos totales)
  const puntosCliente = clienteData?.tarjetaLealtad?.puntos || 0;
  const puntosProgresoBD = clienteData?.tarjetaLealtad?.puntosProgreso || 0;
  const esAsignacionManual = clienteData?.tarjetaLealtad?.asignacionManual || false;
  
  // 🎯 CÁLCULO INTELIGENTE: Para tarjetas manuales, usar los puntos del cliente si son mayores
  const puntosProgreso = esAsignacionManual 
    ? Math.max(puntosProgresoBD, puntosCliente)
    : puntosProgresoBD;
    
  const visitasActuales = 0; // No tenemos visitas en ClienteData del frontend
  const nivelActual = clienteData?.tarjetaLealtad?.nivel || 'Bronce';

  // 🎯 CONFIGURACIÓN BASE CORREGIDA QUE COINCIDE CON ADMIN
  const puntosRequeridos = {
    'Bronce': 0,
    'Plata': 100,     // ✅ CORREGIDO: según admin config
    'Oro': 500,
    'Diamante': 1500, // ✅ CORREGIDO: era 15000, debe ser 1500 
    'Platino': 3000   // ✅ CORREGIDO: era 25000, debe ser 3000
  };
  
  // ✅ ACTUALIZAR con configuración del admin si existe
  if (portalConfig?.tarjetas && Array.isArray(portalConfig.tarjetas)) {
    portalConfig.tarjetas.forEach((tarjeta: any) => {
      if (tarjeta.condiciones?.puntosMinimos !== undefined && tarjeta.nivel) {
        puntosRequeridos[tarjeta.nivel as keyof typeof puntosRequeridos] = tarjeta.condiciones.puntosMinimos;
      }
    });
  }

  const resultado = calcularProgresoUnificado(
    puntosProgreso, // ✅ USAR PUNTOS DE PROGRESO EN LUGAR DE PUNTOS TOTALES
    visitasActuales,
    nivelActual,
    esAsignacionManual,
    puntosRequeridos // ✅ PASAR CONFIGURACIÓN REAL
  );
  
  const maxPuntos = Math.max(...Object.values(puntosRequeridos));
  const puntosActuales = puntosProgreso;
  
  return {
    nivelesOrdenados,
    puntosRequeridos,
    maxPuntos,
    puntosActuales,
    // ✅ DATOS DEL CÁLCULO UNIFICADO
    siguienteNivel: resultado.siguienteNivel,
    progreso: resultado.progreso,
    mensaje: resultado.mensaje,
    esAsignacionManual: resultado.esAsignacionManual
  };
};
