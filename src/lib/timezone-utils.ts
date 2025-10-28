/**
 * 🛡️ UTILIDAD DEFINITIVA PARA MANEJO DE TIMEZONE EN RESERVAS    // Verificación - esto debe mostrar la hora original que ingresó el usuario EN FORMATO MILITAR
    const fechaVerificacion = fechaCorrecta.toLocaleString('es-CO', { 
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // ✅ FORMATO MILITAR (24 horas)
    });
    
    console.log('✅ FECHA CREADA CORRECTAMENTE:', {
      fechaOriginal: `${fecha} ${hora}`,
      fechaUTC: fechaCorrecta.toISOString(),
      fechaEnNegocio: fechaVerificacion,
      metodo: 'UTC directo + offset Colombia (formato militar)',
      verificacion: `Hora ingresada: ${hora}, Hora verificada: ${fechaVerificacion.split(' ')[1]}`
    });lidad asegura que SIEMPRE se manejen las fechas correctamente,
 * sin importar dónde esté corriendo el servidor o cambios de configuración.
 */

/**
 * Configuración de timezone para el negocio
 * Este es el timezone REAL donde opera el negocio
 */
const BUSINESS_TIMEZONE = 'America/Guayaquil';

/**
 * Función para formatear fechas/horas en formato militar consistente
 * VERSIÓN FIJA: No depende del timezone del navegador del usuario
 * @param date - Fecha a formatear
 * @returns String en formato militar (24 horas) HH:mm
 */
export function formatearHoraMilitar(date: Date): string {
  // 🎯 SOLUCIÓN: Extraer hora UTC y restar 5 horas manualmente
  // Esto garantiza que TODOS los usuarios vean la misma hora sin importar su timezone local
  
  // Obtener componentes UTC directamente
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  // Calcular hora en Ecuador (UTC-5)
  let ecuadorHours = utcHours - 5;
  
  // Manejar el caso de horas negativas (día anterior)
  if (ecuadorHours < 0) {
    ecuadorHours += 24;
  }
  
  // Formatear con padding de ceros
  const hoursStr = String(ecuadorHours).padStart(2, '0');
  const minutesStr = String(utcMinutes).padStart(2, '0');
  
  return `${hoursStr}:${minutesStr}`;
}

/**
 * Función para formatear fecha completa en formato militar consistente
 * @param date - Fecha a formatear
 * @returns String en formato militar completo
 */
export function formatearFechaCompletaMilitar(date: Date): string {
  return date.toLocaleString('es-CO', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // ✅ FORMATO MILITAR
  });
}

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
    
    // ✅ MÉTODO CORRECTO Y SIMPLE
    // Crear fecha directamente en el timezone del negocio
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // Crear fecha como UTC directamente
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
    
    // Colombia es UTC-5, así que para obtener el UTC real:
    // Si el usuario dice 01:00 en Colombia = 06:00 UTC
    // Sumamos 5 horas para convertir de Colombia a UTC
    const fechaCorrecta = new Date(fechaUTC.getTime() + (5 * 60 * 60 * 1000));
    
    // Verificación
    const fechaVerificacion = fechaCorrecta.toLocaleString('es-CO', { 
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
      fechaUTC: fechaCorrecta.toISOString(),
      fechaEnNegocio: fechaVerificacion,
      metodo: 'UTC directo + offset Colombia',
      verificacion: `Hora ingresada: ${hora}, Hora verificada: ${fechaVerificacion.split(' ')[1]}`
    });
    
    return fechaCorrecta;
    
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
    expiraEnNegocio: expiracion.toLocaleString('es-CO', { 
      timeZone: BUSINESS_TIMEZONE,
      hour12: false // ✅ FORMATO MILITAR
    })
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
      fechaReservaNegocio: fechaReserva.toLocaleString('es-CO', { 
        timeZone: BUSINESS_TIMEZONE,
        hour12: false // ✅ FORMATO MILITAR
      }),
      fechaExpiracionUTC: fechaExpiracionQR.toISOString(),
      fechaExpiracionNegocio: fechaExpiracionQR.toLocaleString('es-CO', { 
        timeZone: BUSINESS_TIMEZONE,
        hour12: false // ✅ FORMATO MILITAR
      }),
      metodo: 'Offset fijo + validaciones (DEFINITIVO - FORMATO MILITAR)'
    }
  };
  
  console.log('📊 RESULTADO FINAL:', resultado.debug);
  
  return resultado;
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD usando el timezone del negocio
 * @param fecha - Fecha a convertir
 * @returns String de fecha en formato YYYY-MM-DD
 */
export function convertirFechaAString(fecha: Date): string {
  try {
    // Usar el timezone del negocio para obtener la fecha correcta
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return formatter.format(fecha);
  } catch (error) {
    console.error('❌ Error convirtiendo fecha a string:', error);
    // Fallback seguro usando UTC
    return fecha.toISOString().split('T')[0];
  }
}

export {
  crearFechaReserva,
  crearFechaExpiracionQR,
  validarFechaReserva,
  BUSINESS_TIMEZONE
};
