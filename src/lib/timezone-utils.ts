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
  // 🎯 SOLUCIÓN: Usar Temporal API para manejar timezone correctamente
  const instant = Temporal.Instant.from(date.toISOString());
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
    
    // ✅ MÉTODO CORRECTO usando Temporal API
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // Crear fecha en el timezone del negocio
    const zonedDateTime = Temporal.ZonedDateTime.from({
      timeZone: BUSINESS_TIMEZONE,
      year,
      month,
      day,
      hour: hours,
      minute: minutes
    });
    
    // Convertir a Date para compatibilidad
    const fechaCorrecta = new Date(zonedDateTime.epochMilliseconds);
    
    console.log('✅ FECHA CREADA CORRECTAMENTE:', {
      fechaOriginal: `${fecha} ${hora}`,
      fechaUTC: fechaCorrecta.toISOString(),
      fechaEnNegocio: zonedDateTime.toString(),
      metodo: 'Temporal API',
      verificacion: `Hora ingresada: ${hora}, Hora verificada: ${zonedDateTime.toLocaleString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`
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
  const now = Temporal.Now.zonedDateTimeISO(BUSINESS_TIMEZONE);
  const reservaZoned = Temporal.Instant.from(fechaReserva.toISOString())
    .toZonedDateTimeISO(BUSINESS_TIMEZONE);
  
  const esEnElFuturo = Temporal.ZonedDateTime.compare(reservaZoned, now) > 0;
  
  if (!esEnElFuturo) {
    console.warn('⚠️ ADVERTENCIA: Fecha de reserva en el pasado:', {
      fechaReserva: fechaReserva.toISOString(),
      fechaReservaLocal: reservaZoned.toString(),
      fechaActual: now.toString()
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
