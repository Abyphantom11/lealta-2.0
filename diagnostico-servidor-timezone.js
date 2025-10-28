// 🔍 DIAGNÓSTICO: Verificar timezone del servidor vs local
console.log('🌍 DIAGNÓSTICO DE TIMEZONE - SERVIDOR VS LOCAL');
console.log('='.repeat(50));

// 1. Timezone del sistema local
console.log('\n📍 TIMEZONE LOCAL:');
console.log('Timezone local:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset local:', new Date().getTimezoneOffset(), 'minutos');
console.log('Fecha local:', new Date().toString());

// 2. Simulación de lo que pasa en producción
console.log('\n🔧 SIMULACIÓN PRODUCCIÓN (UTC):');
const fechaUTC = new Date();
const fechaEnColombia = new Date(fechaUTC.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
const fechaEnUTC = new Date(fechaUTC.toLocaleString('en-US', { timeZone: 'UTC' }));

console.log('Hora UTC servidor:', fechaEnUTC.toISOString());
console.log('Hora en Colombia:', fechaEnColombia.toString());
console.log('Diferencia:', (fechaEnUTC.getTime() - fechaEnColombia.getTime()) / (1000 * 60 * 60), 'horas');

// 3. Probar nuestras funciones con diferentes timezones
const { calcularFechasReserva } = require('./src/lib/timezone-utils.js');

console.log('\n🧪 PRUEBA CON NUESTRAS FUNCIONES:');
console.log('──────────────────────────────────');

// Simular ambiente de servidor UTC
const originalTZ = process.env.TZ;
process.env.TZ = 'UTC';

try {
  const resultado = calcularFechasReserva("2024-01-15", "01:00");
  console.log('Resultado con TZ=UTC:', {
    fechaUTC: resultado.fechaReserva.toISOString(),
    fechaEnNegocio: resultado.debug.fechaReservaNegocio,
    esCorrect: resultado.debug.fechaReservaNegocio.includes('01:00') || resultado.debug.fechaReservaNegocio.includes('1:00')
  });
} catch (error) {
  console.log('Error:', error.message);
} finally {
  // Restaurar timezone original
  if (originalTZ) {
    process.env.TZ = originalTZ;
  } else {
    delete process.env.TZ;
  }
}

console.log('\n💡 DIAGNÓSTICO:');
console.log('───────────────');
console.log('Si el servidor está en UTC y nosotros hacemos cálculos');
console.log('basados en el timezone local del servidor, eso explicaría');
console.log('la diferencia de 5 horas que estás viendo.');
console.log('');
console.log('SOLUCIÓN: Forzar siempre America/Guayaquil sin depender');
console.log('del timezone del servidor.');
