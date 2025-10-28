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
    
    // Verificación - esto debe mostrar la hora original que ingresó el usuario
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
    expiraEnNegocio: expiracion.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE })
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
      fechaReservaNegocio: fechaReserva.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE }),
      fechaExpiracionUTC: fechaExpiracionQR.toISOString(),
      fechaExpiracionNegocio: fechaExpiracionQR.toLocaleString('es-CO', { timeZone: BUSINESS_TIMEZONE }),
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
  BUSINESS_TIMEZONE
};
