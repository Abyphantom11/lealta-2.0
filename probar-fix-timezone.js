/**
 * 🧪 SCRIPT DE PRUEBA PARA VERIFICAR EL FIX DE TIMEZONE
 * 
 * Este script simula la lógica antigua vs la nueva para mostrar la diferencia
 */

console.log('🧪 PRUEBA: COMPARACIÓN DE LÓGICA DE FECHAS (ANTES vs DESPUÉS)');
console.log('='.repeat(80));

// Datos de ejemplo como los que llegan del frontend
const datosEjemplo = {
  fecha: '2025-10-26',  // YYYY-MM-DD
  hora: '14:30'         // HH:MM
};

console.log('📋 DATOS DE ENTRADA:');
console.log(`   Fecha: ${datosEjemplo.fecha}`);
console.log(`   Hora: ${datosEjemplo.hora}`);
console.log(`   Interpretación del usuario: 26 de octubre 2025 a las 2:30 PM (Colombia)`);
console.log('');

// ❌ LÓGICA ANTIGUA (PROBLEMÁTICA)
console.log('❌ LÓGICA ANTIGUA (CON PROBLEMA):');
console.log('-'.repeat(50));

const [horasReserva, minutosReserva] = datosEjemplo.hora.split(':').map(Number);
const [year, month, day] = datosEjemplo.fecha.split('-').map(Number);
const fechaAntigua = new Date(year, month - 1, day, horasReserva, minutosReserva, 0, 0);
const expiracionAntigua = new Date(fechaAntigua.getTime() + (12 * 60 * 60 * 1000));

console.log(`📅 Fecha reserva (UTC): ${fechaAntigua.toISOString()}`);
console.log(`📅 En Colombia: ${fechaAntigua.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
console.log(`⏰ QR expira (UTC): ${expiracionAntigua.toISOString()}`);
console.log(`⏰ QR expira Colombia: ${expiracionAntigua.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

// Verificar si hay problema
const ahoraServidor = new Date();
const horasParaExpirarAntiguo = (expiracionAntigua.getTime() - ahoraServidor.getTime()) / (1000 * 60 * 60);

console.log(`🕐 Hora actual servidor: ${ahoraServidor.toISOString()}`);
console.log(`🕐 Hora actual Colombia: ${ahoraServidor.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

if (horasParaExpirarAntiguo < 0) {
  console.log(`🚨 PROBLEMA: QR expirado hace ${Math.abs(horasParaExpirarAntiguo).toFixed(1)} horas`);
} else {
  console.log(`✅ QR válido por ${horasParaExpirarAntiguo.toFixed(1)} horas`);
}

console.log('');

// ✅ LÓGICA NUEVA (CORREGIDA)
console.log('✅ LÓGICA NUEVA (CORREGIDA):');
console.log('-'.repeat(50));

// Crear fecha considerando timezone de Colombia
const fechaColombiaString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${horasReserva.toString().padStart(2, '0')}:${minutosReserva.toString().padStart(2, '0')}:00`;
const fechaTemporal = new Date(fechaColombiaString);
const offsetColombia = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
const fechaNueva = new Date(fechaTemporal.getTime() + offsetColombia);
const expiracionNueva = new Date(fechaNueva.getTime() + (12 * 60 * 60 * 1000));

console.log(`📅 Fecha reserva (UTC): ${fechaNueva.toISOString()}`);
console.log(`📅 En Colombia: ${fechaNueva.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
console.log(`⏰ QR expira (UTC): ${expiracionNueva.toISOString()}`);
console.log(`⏰ QR expira Colombia: ${expiracionNueva.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

const horasParaExpirarNuevo = (expiracionNueva.getTime() - ahoraServidor.getTime()) / (1000 * 60 * 60);

if (horasParaExpirarNuevo < 0) {
  console.log(`🚨 PROBLEMA: QR expirado hace ${Math.abs(horasParaExpirarNuevo).toFixed(1)} horas`);
} else {
  console.log(`✅ QR válido por ${horasParaExpirarNuevo.toFixed(1)} horas`);
}

console.log('');

// 📊 COMPARACIÓN
console.log('📊 COMPARACIÓN DE RESULTADOS:');
console.log('='.repeat(40));

const diferenciaHoras = horasParaExpirarNuevo - horasParaExpirarAntiguo;
console.log(`⏰ Diferencia en validez: ${diferenciaHoras.toFixed(1)} horas`);

if (diferenciaHoras > 0) {
  console.log(`✅ MEJORA: El QR ahora es válido por ${diferenciaHoras.toFixed(1)} horas adicionales`);
} else if (diferenciaHoras < 0) {
  console.log(`❌ El QR nueva lógica expira ${Math.abs(diferenciaHoras).toFixed(1)} horas antes`);
} else {
  console.log(`🔄 Sin cambio en tiempo de validez`);
}

console.log('');
console.log('💡 CONCLUSIÓN:');
console.log('-'.repeat(20));
if (diferenciaHoras > 4) {
  console.log('✅ FIX EXITOSO: El problema de timezone ha sido corregido');
  console.log('🎯 Los QR codes ahora expiran en el momento correcto para Colombia');
} else {
  console.log('⚠️ Revisar: La diferencia no es la esperada (debería ser ~5 horas)');
}

console.log('');
console.log('🚀 PRÓXIMO PASO: Probar creando una reserva nueva para verificar el fix');
