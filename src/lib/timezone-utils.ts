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
 * VERSIÓN SIMPLIFICADA: Lee directamente los componentes UTC sin conversión
 * Como las fechas se guardan en UTC representando la hora local exacta,
 * no necesitamos conversiones de timezone
 * @param date - Fecha a formatear (Date o string ISO)
 * @returns String en formato militar (24 horas) HH:mm
 */
export function formatearHoraMilitar(date: Date | string): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
      if (Number.isNaN(dateObj.getTime())) {
        throw new Error(`Fecha inválida: ${date}`);
      }
    } else {
      dateObj = date;
    }
    
    // Leer directamente los componentes UTC (que representan la hora local)
    const hours = dateObj.getUTCHours().toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('⚠️ Error parseando hora:', error);
    return '00:00';
  }
}

/**
 * Función para formatear fecha completa en formato militar consistente
 * Lee directamente los componentes UTC sin conversión de timezone
 * @param date - Fecha a formatear
 * @returns String en formato militar completo
 */
export function formatearFechaCompletaMilitar(date: Date): string {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
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
    // 1. Validaciones básicas y limpieza
    if (!fecha || !hora) {
      throw new Error('Fecha y hora son requeridas');
    }
    
    // Limpiar espacios y caracteres extraños
    const fechaLimpia = fecha.trim().replace(/[,\s]+$/, '');
    const horaLimpia = hora.trim().replace(/[,\s]+$/, '');
    
    console.log('🧹 Limpiando entrada:', {
      fechaOriginal: fecha,
      fechaLimpia,
      horaOriginal: hora,
      horaLimpia
    });
    
    // 2. Normalizar el formato de fecha
    let fechaNormalizada = fechaLimpia;
    
    // Si la fecha viene en formato DD/MM/YYYY, convertirla a YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLimpia)) {
      const [day, month, year] = fechaLimpia.split('/');
      fechaNormalizada = `${year}-${month}-${day}`;
      console.log('🔄 Fecha convertida de DD/MM/YYYY a YYYY-MM-DD:', fechaNormalizada);
    }
    // Si la fecha viene en formato MM/DD/YYYY, convertirla a YYYY-MM-DD
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fechaLimpia)) {
      const parts = fechaLimpia.split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      fechaNormalizada = `${year}-${month}-${day}`;
      console.log('🔄 Fecha convertida de M/D/YYYY a YYYY-MM-DD:', fechaNormalizada);
    }
    // Si la fecha viene en formato ISO completo, extraer solo la parte de fecha
    else if (/^\d{4}-\d{2}-\d{2}T/.test(fechaLimpia)) {
      fechaNormalizada = fechaLimpia.split('T')[0];
      console.log('🔄 Fecha extraída de ISO:', fechaNormalizada);
    }
    
    // Validar formato final
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
      console.error('❌ Formato de fecha inválido:', {
        original: fecha,
        limpia: fechaLimpia,
        normalizada: fechaNormalizada,
        esperado: 'YYYY-MM-DD'
      });
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    // Normalizar formato de hora
    let horaNormalizada = horaLimpia;
    
    // Si la hora no tiene formato HH:MM, intentar normalizarla
    if (!/^\d{2}:\d{2}$/.test(horaLimpia)) {
      if (/^\d:\d{2}$/.test(horaLimpia)) {
        horaNormalizada = '0' + horaLimpia;
        console.log('🔄 Hora normalizada:', horaNormalizada);
      } else if (/^\d{2}:\d{2}:\d{2}$/.test(horaLimpia)) {
        horaNormalizada = horaLimpia.substring(0, 5);
        console.log('🔄 Hora simplificada:', horaNormalizada);
      } else {
        throw new Error('Formato de hora inválido. Use HH:MM');
      }
    }
    
    // 3. Parsear componentes
    const [year, month, day] = fechaNormalizada.split('-').map(Number);
    const [hours, minutes] = horaNormalizada.split(':').map(Number);
    
    // 4. Validar rangos
    if (month < 1 || month > 12) throw new Error('Mes inválido');
    if (day < 1 || day > 31) throw new Error('Día inválido');
    if (hours < 0 || hours > 23) throw new Error('Hora inválida');
    if (minutes < 0 || minutes > 59) throw new Error('Minutos inválidos');
    
    // 5. Crear objeto Date SIN ninguna conversión de timezone
    // SOLUCIÓN DEFINITIVA: Crear string ISO y parsearlo directamente
    // Esto evita TODAS las conversiones automáticas de timezone
    
    // Crear string ISO en formato: YYYY-MM-DDTHH:mm:ss.000Z
    // Pero usando los valores locales (sin aplicar offset)
    const isoString = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000Z`;
    
    const fechaCorrecta = new Date(isoString);
    
    // 6. Logging detallado
    console.log('✅ FECHA CREADA (SIN CONVERSIÓN - VALORES EXACTOS):', {
      entrada: {
        fecha,
        hora,
        fechaNormalizada,
        horaNormalizada
      },
      componentes: {
        year,
        month,
        day,
        hours,
        minutes
      },
      isoString,
      resultado: {
        date: fechaCorrecta,
        iso: fechaCorrecta.toISOString(),
        verificacion: `Día ${fechaCorrecta.getUTCDate()}, Mes ${fechaCorrecta.getUTCMonth() + 1}, Hora ${fechaCorrecta.getUTCHours()}:${fechaCorrecta.getUTCMinutes()}`
      }
    });
    
    return fechaCorrecta;
  } catch (error) {
    console.error('❌ ERROR CREANDO FECHA:', error);
    throw new Error(`Error al crear fecha de reserva: ${error instanceof Error ? error.message : String(error)}`);
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
      hour12: false
    })
  });
  
  return expiracion;
}

/**
 * Valida que una fecha de reserva esté en el futuro
 * @param fechaReserva - Fecha a validar (en formato UTC pero representando hora local)
 * @returns True si es válida
 */
function validarFechaReserva(fechaReserva: Date): boolean {
  try {
    // Obtener la fecha/hora actual
    const ahora = new Date();
    
    // Como las fechas se guardan en UTC representando hora local,
    // comparamos directamente los timestamps
    // Restamos 1 minuto de tolerancia para evitar problemas de sincronización
    const diferenciaMs = fechaReserva.getTime() - ahora.getTime();
    const minutosHastaReserva = diferenciaMs / (1000 * 60);
    
    // Ser más permisivo: permitir reservas que estén muy en el futuro
    // o que estén dentro de un rango razonable (último minuto)
    const esEnElFuturo = minutosHastaReserva >= -1; // Tolerancia de 1 minuto en el pasado
    
    // Logging detallado
    console.log('🕒 VALIDANDO FECHA DE RESERVA (COMPARACIÓN DIRECTA):', {
      fechaActual: ahora.toISOString(),
      fechaReserva: fechaReserva.toISOString(),
      diferencia: {
        milisegundos: diferenciaMs,
        minutos: minutosHastaReserva,
        horas: minutosHastaReserva / 60,
        dias: minutosHastaReserva / (60 * 24)
      },
      esValida: esEnElFuturo,
      nota: 'Tolerancia de -1 minuto para evitar problemas de sincronización'
    });
    
    if (!esEnElFuturo) {
      console.warn('⚠️ Reserva rechazada - está en el pasado (más de 1 minuto)');
    }
    
    return esEnElFuturo;
  } catch (error) {
    console.error('❌ Error validando fecha:', error);
    throw new Error('Error al validar la fecha de reserva');
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
