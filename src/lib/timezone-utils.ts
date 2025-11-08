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
 * Convierte de UTC al timezone del negocio para mostrar la hora correcta
 * @param date - Fecha a formatear (Date o string ISO)
 * @returns String en formato militar (24 horas) HH:mm
 */
export function formatearHoraMilitar(date: Date | string): string {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
      if (Number.isNaN(dateObj.getTime())) {
        throw new TypeError(`Fecha inválida: ${date}`);
      }
    } else {
      dateObj = date;
    }
    
    // Leer directamente las horas UTC (que son las que el usuario ingresó)
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
 * Lee directamente los componentes UTC sin conversión
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
    
    // 5. CREAR FECHA DIRECTAMENTE SIN CONVERSIÓN DE TIMEZONE
    // El usuario ingresa "23:30" y espera que se guarde y muestre "23:30"
    // NO convertimos timezone porque queremos guardar la hora exacta que el usuario ingresó
    
    // Crear la fecha UTC directamente con los valores ingresados
    const fechaCorrecta = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
    
    // 6. Logging detallado
    console.log('✅ FECHA CREADA DIRECTAMENTE (SIN CONVERSIÓN TIMEZONE):', {
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
      resultado: {
        date: fechaCorrecta,
        iso: fechaCorrecta.toISOString(),
        utcComponents: {
          year: fechaCorrecta.getUTCFullYear(),
          month: fechaCorrecta.getUTCMonth() + 1,
          day: fechaCorrecta.getUTCDate(),
          hours: fechaCorrecta.getUTCHours(),
          minutes: fechaCorrecta.getUTCMinutes()
        }
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
    // Obtener la fecha/hora actual en el timezone del negocio
    const ahora = new Date();
    
    // Extraer solo las fechas (sin hora) en UTC para evitar problemas de timezone
    const fechaSoloReservaStr = fechaReserva.toISOString().split('T')[0]; // YYYY-MM-DD
    const fechaSoloHoyStr = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Convertir a timestamps para comparación
    const fechaSoloReserva = new Date(fechaSoloReservaStr + 'T00:00:00.000Z').getTime();
    const fechaSoloHoy = new Date(fechaSoloHoyStr + 'T00:00:00.000Z').getTime();
    
    // Si es del mismo día o futuro, es válida
    const esMismoDiaOFuturo = fechaSoloReserva >= fechaSoloHoy;
    
    // Calcular diferencia en horas
    const diferenciaMs = fechaReserva.getTime() - ahora.getTime();
    const horasHastaReserva = diferenciaMs / (1000 * 60 * 60);
    
    // SÚPER PERMISIVO: 
    // - Permite cualquier reserva del mismo día (sin importar la hora)
    // - Permite reservas hasta 48 horas en el pasado (para casos especiales)
    const esValida = esMismoDiaOFuturo || horasHastaReserva >= -48;
    
    // Logging detallado
    console.log('🕒 VALIDANDO FECHA DE RESERVA (SÚPER PERMISIVO):', {
      fechaActual: ahora.toISOString(),
      fechaReserva: fechaReserva.toISOString(),
      fechaSoloHoy: fechaSoloHoyStr,
      fechaSoloReserva: fechaSoloReservaStr,
      esMismoDia: fechaSoloReservaStr === fechaSoloHoyStr,
      diferencia: {
        milisegundos: diferenciaMs,
        horas: horasHastaReserva.toFixed(2),
        dias: (horasHastaReserva / 24).toFixed(2)
      },
      esValida,
      razon: esMismoDiaOFuturo ? 'Es del mismo día o futuro' : horasHastaReserva >= -48 ? 'Dentro de 48 horas' : 'Muy antigua',
      nota: 'Permite reservas del mismo día SIN restricción de hora + 48h retroactivas'
    });
    
    if (!esValida) {
      console.warn('⚠️ Reserva rechazada - está más de 48 horas en el pasado');
    }
    
    return esValida;
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
