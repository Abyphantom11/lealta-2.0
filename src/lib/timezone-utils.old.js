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

/**
 * Función para formatear fechas/horas en formato militar consistente
 * VERSIÓN FIJA: No depende del timezone del navegador del usuario
 * @param {Date} date - Fecha a formatear
 * @returns {string} String en formato militar (24 horas) HH:mm
 */
function formatearHoraMilitar(date) {
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
 * @param {Date} date - Fecha a formatear
 * @returns {string} String en formato militar completo
 */
function formatearFechaCompletaMilitar(date) {
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

/**
 * Crea una fecha de reserva considerando el timezone del negocio
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} hora - Hora en formato HH:MM
 * @returns {Date} Fecha correcta en UTC
 */
function crearFechaReserva(fecha, hora) {
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
    
    // ✅ MÉTODO CORRECTO: Crear fecha directamente en UTC considerando que el usuario está en UTC-5
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    // El usuario ingresa hora LOCAL de Ecuador (UTC-5)
    // Para convertir a UTC, SUMAMOS 5 horas
    // Ejemplo: Usuario dice 09:00 Ecuador → 14:00 UTC
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0, 0));
    
    console.log('✅ FECHA CREADA CORRECTAMENTE:', {
      fechaOriginal: `${fecha} ${hora}`,
      fechaUTC: fechaUTC.toISOString(),
      horaIngresada: hora,
      horaFormateada: formatearHoraMilitar(fechaUTC),
      metodo: 'Date.UTC con offset +5 para Ecuador'
    });
    
    return fechaUTC;
    
  } catch (error) {
    console.error('❌ ERROR CREANDO FECHA:', error);
    // Fallback seguro
    return new Date();
  }
}

/**
 * Obtiene el offset de timezone para una zona específica
 * @param {string} timezone - Timezone (ej: 'America/Guayaquil')
 * @param {Date} fecha - Fecha de referencia
 * @returns {number} Offset en milisegundos
 */
function getTimezoneOffset(timezone, fecha) {
  try {
    // Usar Intl.DateTimeFormat para obtener el offset exacto
    const utc = fecha.getTime() + (fecha.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc);
    
    // Obtener la hora en el timezone objetivo
    const targetTimeString = targetTime.toLocaleString('en-US', { 
      timeZone: timezone,
      hour12: false 
    });
    
    const targetDate = new Date(targetTimeString);
    const offset = targetDate.getTime() - utc;
    
    return offset;
  } catch (error) {
    console.error('❌ Error calculando offset:', error);
    // Fallback para Colombia: -5 horas
    return -5 * 60 * 60 * 1000;
  }
}

/**
 * Crea fecha de expiración del QR (12 horas después de la reserva)
 * @param {Date} fechaReserva - Fecha de la reserva
 * @returns {Date} Fecha de expiración
 */
function crearFechaExpiracionQR(fechaReserva) {
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
 * @param {Date} fechaReserva - Fecha a validar
 * @returns {boolean} True si es válida
 */
function validarFechaReserva(fechaReserva) {
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
 * @param {string} fecha - Fecha YYYY-MM-DD
 * @param {string} hora - Hora HH:MM
 * @returns {Object} Objeto con fechas calculadas
 */
function calcularFechasReserva(fecha, hora) {
  console.log('🎯 CALCULANDO FECHAS DE RESERVA (MÉTODO DEFINITIVO)');
  console.log('='.repeat(70));
  
  // 1. Crear fecha de reserva
  const fechaReserva = crearFechaReserva(fecha, hora);
  
  // 2. Validar fecha
  const esValida = validarFechaReserva(fechaReserva);
  
  // 3. Crear fecha de expiración del QR
  const fechaExpiracionQR = crearFechaExpiracionQR(fechaReserva);
  
  // 4. Información de debug
  const resultado = {
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
      metodo: 'Intl.DateTimeFormat + validaciones'
    }
  };
  
  console.log('📊 RESULTADO FINAL:', resultado.debug);
  
  return resultado;
}

/**
 * Convierte una fecha a string en formato YYYY-MM-DD usando el timezone del negocio
 * @param {Date} fecha - Fecha a convertir
 * @returns {string} String de fecha en formato YYYY-MM-DD
 */
function convertirFechaAString(fecha) {
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

module.exports = {
  crearFechaReserva,
  crearFechaExpiracionQR,
  calcularFechasReserva,
  validarFechaReserva,
  convertirFechaAString,
  formatearHoraMilitar,
  formatearFechaCompletaMilitar,
  BUSINESS_TIMEZONE
};
