import { Temporal } from '@js-temporal/polyfill';

/**
 * 🛡️ UTILIDAD DEFINITIVA PARA MANEJO DE TIMEZONE EN RESERVAS
 * Esta utilidad usa Temporal API para asegurar un manejo consistente de fechas/horas,
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
 * @param date - Fecha a formatear (Date o string ISO)
 * @returns String en formato militar (24 horas) HH:mm
 */
export function formatearHoraMilitar(date: Date | string): string {
  // Si es string, usar directamente con Temporal
  const instant = typeof date === 'string' 
    ? Temporal.Instant.from(date)
    : Temporal.Instant.from(date.toISOString());
    
  const zonedDateTime = instant.toZonedDateTimeISO(BUSINESS_TIMEZONE);
  
  return zonedDateTime.toLocaleString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
    
    // Parsear los componentes de fecha y hora
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // Validar rangos de fecha/hora
    if (month < 1 || month > 12) throw new Error('Mes inválido');
    if (day < 1 || day > 31) throw new Error('Día inválido');
    if (hours < 0 || hours > 23) throw new Error('Hora inválida');
    if (minutes < 0 || minutes > 59) throw new Error('Minutos inválidos');
    
    // Crear fecha en el timezone del negocio
    const zonedDateTime = Temporal.ZonedDateTime.from({
      timeZone: BUSINESS_TIMEZONE,
      year,
      month,
      day,
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0
    });
    
    // Convertir a Date para compatibilidad
    const fechaCorrecta = new Date(zonedDateTime.epochMilliseconds);
    
    console.log('✅ FECHA CREADA CORRECTAMENTE:', {
      fechaOriginal: `${fecha} ${hora}`,
      fechaUTC: fechaCorrecta.toISOString(),
      fechaEnNegocio: zonedDateTime.toString(),
      epochMs: zonedDateTime.epochMilliseconds,
      verificacion: `${hours}:${minutes.toString().padStart(2, '0')}`
    });
    
    return fechaCorrecta;
    
  } catch (error) {
    console.error('❌ ERROR CREANDO FECHA:', error);
    throw error; // Re-lanzar el error para manejarlo arriba
  }
}

/**
 * Crea fecha de expiración del QR (12 horas después de la reserva)
 * @param fechaReserva - Fecha de la reserva
 * @returns Fecha de expiración
 */
function crearFechaExpiracionQR(fechaReserva: Date): Date {
  const DURACION_QR_HORAS = 12;
  
  // Convertir Date a ZonedDateTime
  const instant = Temporal.Instant.from(fechaReserva.toISOString());
  const zonedDateTime = instant.toZonedDateTimeISO(BUSINESS_TIMEZONE);
  
  // Agregar horas usando Temporal
  const expiracionZoned = zonedDateTime.add({ hours: DURACION_QR_HORAS });
  const expiracion = new Date(expiracionZoned.epochMilliseconds);
  
  console.log('⏰ QR EXPIRACION CALCULADA:', {
    fechaReserva: fechaReserva.toISOString(),
    fechaExpiracion: expiracion.toISOString(),
    duracionHoras: DURACION_QR_HORAS,
    expiraEnNegocio: expiracionZoned.toLocaleString('es-CO', { 
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
  try {
    // 1. Obtener la fecha/hora actual en el timezone del negocio
    const ahora = Temporal.Now.zonedDateTimeISO(BUSINESS_TIMEZONE);
    const ahoraEpochMs = ahora.epochMilliseconds;
    
    // 2. Convertir la fecha de reserva a epochMilliseconds en el timezone del negocio
    const reservaInstant = Temporal.Instant.from(fechaReserva.toISOString());
    const reservaZoned = reservaInstant.toZonedDateTimeISO(BUSINESS_TIMEZONE);
    const reservaEpochMs = reservaZoned.epochMilliseconds;
    
    // 3. Comparar timestamps
    const diferenciaMs = reservaEpochMs - ahoraEpochMs;
    const esEnElFuturo = diferenciaMs > 0;
    
    // 4. Logging detallado
    console.log('🕒 VALIDANDO FECHA DE RESERVA:', {
      fechaActual: {
        isoString: ahora.toString(),
        epochMs: ahoraEpochMs
      },
      fechaReserva: {
        isoString: reservaZoned.toString(),
        epochMs: reservaEpochMs
      },
      diferencia: {
        milliseconds: diferenciaMs,
        minutes: Math.floor(diferenciaMs / (1000 * 60)),
        hours: Math.floor(diferenciaMs / (1000 * 60 * 60))
      },
      esValida: esEnElFuturo
    });
    
    return esEnElFuturo;
  } catch (error) {
    console.error('❌ Error validando fecha:', error);
    return false;
  }
}

/**
 * Función principal para crear una reserva con fechas correctas
 * @param fecha - Fecha YYYY-MM-DD
 * @param hora - Hora HH:MM
 * @returns Objeto con fechas calculadas
 */
export function calcularFechasReserva(fecha: string, hora: string): FechasReserva {
  try {
    console.log('🎯 CALCULANDO FECHAS DE RESERVA (MÉTODO DEFINITIVO)');
    console.log('='.repeat(70));
    
    // 1. Crear fecha de reserva
    const fechaReserva = crearFechaReserva(fecha, hora);
    
    // 2. Validar que la fecha se haya creado correctamente
    if (!fechaReserva || Number.isNaN(fechaReserva.getTime())) {
      throw new Error('Error al crear la fecha de reserva');
    }
    
    // 3. Validar que sea en el futuro
    const esValida = validarFechaReserva(fechaReserva);
    
    if (!esValida) {
      throw new Error('La fecha de reserva debe ser en el futuro');
    }
    
    // 4. Crear fecha de expiración del QR
    const fechaExpiracionQR = crearFechaExpiracionQR(fechaReserva);
    
    // 5. Validar fecha de expiración
    if (!fechaExpiracionQR || Number.isNaN(fechaExpiracionQR.getTime())) {
      throw new Error('Error al crear la fecha de expiración del QR');
    }
    
    // 6. Información de debug
    const resultado: FechasReserva = {
      fechaReserva,
      fechaExpiracionQR,
      esValida: true, // Si llegamos aquí, es válida
      debug: {
        timezone: BUSINESS_TIMEZONE,
        fechaReservaUTC: fechaReserva.toISOString(),
        fechaReservaNegocio: fechaReserva.toLocaleString('es-CO', { 
          timeZone: BUSINESS_TIMEZONE,
          hour12: false
        }),
        fechaExpiracionUTC: fechaExpiracionQR.toISOString(),
        fechaExpiracionNegocio: fechaExpiracionQR.toLocaleString('es-CO', { 
          timeZone: BUSINESS_TIMEZONE,
          hour12: false
        }),
        metodo: 'Temporal API + validaciones estrictas'
      }
    };
    
    console.log('📊 RESULTADO FINAL:', resultado.debug);
    
    return resultado;
  } catch (error) {
    console.error('❌ ERROR CREANDO FECHA:', error);
    throw error;
  }
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD usando el timezone del negocio
 * @param fecha - Fecha a convertir
 * @returns String de fecha en formato YYYY-MM-DD
 */
export function convertirFechaAString(fecha: Date): string {
  try {
    const instant = Temporal.Instant.from(fecha.toISOString());
    const zonedDateTime = instant.toZonedDateTimeISO(BUSINESS_TIMEZONE);
    
    return zonedDateTime.toPlainDate().toString(); // Retorna YYYY-MM-DD
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
