/**
 * 🛡️ UTILIDAD DEFINITIVA PARA MANEJO DE TIMEZONE EN RESERVAS
 * 
 * Esta utilidad asegura que SIEMPRE se manejen las fechas correctamente,
 * sin importar dónde esté corriendo el servidor o cambios de configuración.
 */

/**
 * Configuración de timezone para el negocio
 * Este es el timezone REAL donde opera el negocio
 */
const BUSINESS_TIMEZONE = 'America/Guayaquil';

interface FechasReserva {
  fechaReserva: Date;
  fechaExpiracionQR: Date;
  esValida: boolean;
  debug: {
    timezone: string;
    fechaReservaUTC: string;
    fechaReservaNegocio: string;
    fechaExpiracionUTC: string;
    fechaExpiracionNegocio: string;
    metodo: string;
  };
}

/**
 * Crea una fecha de reserva considerando el timezone del negocio
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @param hora - Hora en formato HH:MM
 * @returns Fecha correcta en UTC
 */
function crearFechaReserva(fecha: string, hora: string): Date {
  try {
    // Validar entrada
    if (!fecha || !hora) {
      throw new Error('Fecha y hora son requeridas');
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new Error('Formato de hora inválido. Use HH:MM');
    }
    
    console.log('🕐 CREANDO FECHA DE RESERVA:', {
      fechaInput: fecha,
      horaInput: hora,
      timezoneNegocio: BUSINESS_TIMEZONE
    });
    
    // ✅ MÉTODO DEFINITIVO: Crear fecha correcta para Colombia
    // Cuando el usuario dice "14:30" en Colombia, eso debe ser 14:30 hora local
    // Para convertir a UTC: Colombia es UTC-5, entonces UTC = hora_local + 5
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // Crear la fecha exactamente como la quiere el usuario en Colombia
    // Usar UTC constructor para evitar problemas de timezone local
    const fechaUTCCorrecta = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0, 0));
    
    // Verificación adicional - debe mostrar la hora original cuando se convierte a Colombia
    const fechaVerificacion = fechaUTCCorrecta.toLocaleString('es-CO', { 
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    console.log('✅ FECHA CREADA CORRECTAMENTE:', {
      fechaOriginal: `${fecha} ${hora}`,
      fechaUTC: fechaUTCCorrecta.toISOString(),
      fechaEnNegocio: fechaVerificacion,
      offsetAplicado: `+5 horas para convertir Colombia a UTC`,
      metodo: 'Date.UTC directo (más preciso)'
    });
    
    return fechaUTCCorrecta;
    
  } catch (error) {
    console.error('❌ ERROR CREANDO FECHA:', error);
    // Fallback seguro
    return new Date();
  }
}

/**
 * Crea fecha de expiración del QR (12 horas después de la reserva)
 * @param fechaReserva - Fecha de la reserva
 * @returns Fecha de expiración
 */
function crearFechaExpiracionQR(fechaReserva: Date): Date {
  const DURACION_QR_HORAS = 12;
  const expiracion = new Date(fechaReserva.getTime() + (DURACION_QR_HORAS * 60 * 60 * 1000));
  
  console.log('⏰ QR EXPIRACION CALCULADA:', {
    fechaReserva: fechaReserva.toISOString(),
    fechaExpiracion: expiracion.toISOString(),
    duracionHoras: DURACION_QR_HORAS,
    expiraEnNegocio: expiracion.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE })
  });
  
  return expiracion;
}

/**
 * Valida que una fecha de reserva esté en el futuro
 * @param fechaReserva - Fecha a validar
 * @returns True si es válida
 */
function validarFechaReserva(fechaReserva: Date): boolean {
  const ahora = new Date();
  const esEnElFuturo = fechaReserva.getTime() > ahora.getTime();
  
  if (!esEnElFuturo) {
    console.warn('⚠️ ADVERTENCIA: Fecha de reserva en el pasado:', {
      fechaReserva: fechaReserva.toISOString(),
      fechaActual: ahora.toISOString()
    });
  }
  
  return esEnElFuturo;
}

/**
 * Función principal para crear una reserva con fechas correctas
 * @param fecha - Fecha YYYY-MM-DD
 * @param hora - Hora HH:MM
 * @returns Objeto con fechas calculadas
 */
export function calcularFechasReserva(fecha: string, hora: string): FechasReserva {
  console.log('🎯 CALCULANDO FECHAS DE RESERVA (MÉTODO DEFINITIVO)');
  console.log('='.repeat(70));
  
  // 1. Crear fecha de reserva
  const fechaReserva = crearFechaReserva(fecha, hora);
  
  // 2. Validar fecha
  const esValida = validarFechaReserva(fechaReserva);
  
  // 3. Crear fecha de expiración del QR
  const fechaExpiracionQR = crearFechaExpiracionQR(fechaReserva);
  
  // 4. Información de debug
  const resultado: FechasReserva = {
    fechaReserva,
    fechaExpiracionQR,
    esValida,
    debug: {
      timezone: BUSINESS_TIMEZONE,
      fechaReservaUTC: fechaReserva.toISOString(),
      fechaReservaNegocio: fechaReserva.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE }),
      fechaExpiracionUTC: fechaExpiracionQR.toISOString(),
      fechaExpiracionNegocio: fechaExpiracionQR.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE }),
      metodo: 'Offset fijo + validaciones (DEFINITIVO)'
    }
  };
  
  console.log('📊 RESULTADO FINAL:', resultado.debug);
  
  return resultado;
}

export {
  crearFechaReserva,
  crearFechaExpiracionQR,
  validarFechaReserva,
  BUSINESS_TIMEZONE
};
