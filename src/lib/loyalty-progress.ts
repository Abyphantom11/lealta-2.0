// Utilidad para calcular progreso de lealtad unificado

export interface ProgressResult {
  progreso: number;
  siguienteNivel: string;
  mensaje: string;
  esAsignacionManual: boolean;
}

export function calcularProgresoUnificado(
  puntosProgreso: number,
  visitasActuales: number, 
  nivelActual: string,
  esAsignacionManual: boolean,
  puntosRequeridosConfig?: { [key: string]: number }
): ProgressResult {
  
  const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  
  // ✅ USAR CONFIGURACIÓN PASADA O VALORES POR DEFECTO
  const puntosRequeridos: { [key: string]: number } = puntosRequeridosConfig || {
    'Bronce': 0,
    'Plata': 400,
    'Oro': 480,
    'Diamante': 15000,
    'Platino': 25000
  };

  const indexActual = jerarquia.indexOf(nivelActual);
  const siguienteNivel = indexActual < jerarquia.length - 1 ? jerarquia[indexActual + 1] : 'Maximo';
  
  if (siguienteNivel === 'Maximo') {
    return {
      progreso: 100,
      siguienteNivel: 'Maximo',
      mensaje: 'Has alcanzado el nivel maximo!',
      esAsignacionManual
    };
  }

  const puntosActual = puntosRequeridos[nivelActual] || 0;
  const puntosSiguiente = puntosRequeridos[siguienteNivel] || 1000;
  
  const rangoPuntos = puntosSiguiente - puntosActual;
  const puntosExtra = Math.max(0, puntosProgreso - puntosActual);
  const progreso = Math.min(100, (puntosExtra / rangoPuntos) * 100);
  
  const puntosFaltantes = Math.max(0, puntosSiguiente - puntosProgreso);
  const mensaje = puntosFaltantes > 0 
    ? puntosFaltantes.toLocaleString() + ' puntos mas para ' + siguienteNivel
    : 'Ya calificas para ' + siguienteNivel + '!';

  return {
    progreso: Math.round(progreso),
    siguienteNivel,
    mensaje,
    esAsignacionManual
  };
}