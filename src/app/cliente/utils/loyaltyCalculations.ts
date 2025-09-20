import { ClienteData } from '../components/types';
import { calcularProgresoUnificado } from '@/lib/loyalty-progress';

// Función para comparar niveles de tarjeta - EXTRAÍDA DEL ORIGINAL
export const isHigherLevel = (newLevel: string, oldLevel: string): boolean => {
  const levels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
};

// Helper para calcular datos de nivel de lealtad - ACTUALIZADO PARA USAR FUNCIÓN UNIFICADA
export const calculateLoyaltyLevel = (portalConfig: any, clienteData: ClienteData | null) => {
  const nivelesOrdenados = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];

  // ✅ USAR FUNCIÓN UNIFICADA QUE RESPETA ASIGNACIONES MANUALES
  const puntosProgreso = clienteData?.tarjetaLealtad?.puntosProgreso || clienteData?.tarjetaLealtad?.puntos || 100;
  const visitasActuales = 0; // No tenemos visitas en ClienteData del frontend
  const nivelActual = clienteData?.tarjetaLealtad?.nivel || 'Bronce';
  const esAsignacionManual = clienteData?.tarjetaLealtad?.asignacionManual || false; // ✅ USAR CAMPO CORRECTO

  // 🎯 USAR CONFIGURACIÓN REAL DEL ADMIN en lugar de valores hardcoded
  const puntosRequeridos = {
    'Bronce': 0,
    'Plata': 400,
    'Oro': 480,
    'Diamante': 15000,
    'Platino': 25000
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
