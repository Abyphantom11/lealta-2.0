// Diagnóstico específico para el problema de 8 horas de diferencia en producción
// El problema: cambiar hora tiene 8 horas de diferencia (no 5 como debería ser)

console.log('🚨 DIAGNÓSTICO: 8 HORAS DE DIFERENCIA EN PRODUCCIÓN');
console.log('===================================================');

console.log('\n📊 ANÁLISIS DEL PROBLEMA:');
console.log('Expected UTC offset (Colombia/Ecuador): -5 horas');
console.log('Observed difference in production: 8 horas');
console.log('Difference from expected: 8 - 5 = 3 horas extra');

console.log('\n🔍 POSIBLES CAUSAS:');
console.log('1. Servidor producción en timezone diferente (UTC+3, Asia/Dubai, etc.)');
console.log('2. Doble conversión: UTC-5 → UTC → UTC+3 = 8 horas total');
console.log('3. Node.js en producción con TZ environment variable incorrecta');
console.log('4. Diferencia entre new Date() local vs UTC en producción');

// Simulación del problema
function simularProblemaProduccion() {
  console.log('\n📱 SIMULANDO PROBLEMA DE 8 HORAS:');
  console.log('──────────────────────────────────');
  
  const horaInput = '15:30'; // Usuario quiere 3:30 PM
  console.log(`🎯 Usuario selecciona: ${horaInput}`);
  
  // Lo que debería pasar (desarrollo - correcto)
  const fechaBase = new Date('2024-10-27T20:30:00.000Z'); // 15:30 local = 20:30 UTC
  const [hours, minutes] = horaInput.split(':').map(Number);
  const fechaCorrecta = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), hours, minutes);
  
  console.log('\n✅ DESARROLLO (correcto):');
  console.log(`   Fecha creada: ${fechaCorrecta.toISOString()}`);
  console.log(`   Hora en UTC: ${fechaCorrecta.getUTCHours()}:${String(fechaCorrecta.getUTCMinutes()).padStart(2, '0')}`);
  console.log(`   Hora local: ${fechaCorrecta.getHours()}:${String(fechaCorrecta.getMinutes()).padStart(2, '0')}`);
  
  // Lo que probablemente pasa en producción (servidor UTC+3)
  console.log('\n❌ PRODUCCIÓN (servidor UTC+3):');
  
  // Si el servidor está en UTC+3, new Date() interpreta diferente
  const fechaProduccion = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), hours, minutes);
  // Pero al guardar en DB, se convierte considerando que está en UTC+3
  const fechaProduccionUTC = new Date(fechaProduccion.getTime() - (3 * 60 * 60 * 1000)); // Restar 3h para UTC
  
  console.log(`   Fecha en servidor UTC+3: ${fechaProduccion.toISOString()}`);
  console.log(`   Guardado en DB (UTC): ${fechaProduccionUTC.toISOString()}`);
  console.log(`   Diferencia total: ${(fechaProduccionUTC.getTime() - fechaCorrecta.getTime()) / (1000 * 60 * 60)} horas`);
  
  return { correcto: fechaCorrecta, problematico: fechaProduccionUTC };
}

const resultado = simularProblemaProduccion();

console.log('\n🎯 SOLUCIONES POSIBLES:');
console.log('─────────────────────');

console.log('\n1. 🔧 SOLUCIÓN INMEDIATA - Forzar UTC en el código:');
console.log('   Cambiar: new Date(year, month, day, hours, minutes)');
console.log('   Por: new Date(Date.UTC(year, month, day, hours - 5, minutes))');
console.log('   Esto fuerza que siempre use UTC-5 independiente del servidor');

console.log('\n2. 🌍 SOLUCIÓN CORRECTA - Environment variable:');
console.log('   Configurar en Vercel: TZ=America/Guayaquil');
console.log('   Esto hace que el servidor use el timezone correcto');

console.log('\n3. 🎯 SOLUCIÓN ROBUSTA - Usar biblioteca timezone:');
console.log('   npm install date-fns-tz');
console.log('   Usar zonedTimeToUtc() para conversiones precisas');

// Verificar si el problema está en formatearHoraMilitar
const { formatearHoraMilitar } = require('./src/lib/timezone-utils.js');

console.log('\n🧪 TESTING formatearHoraMilitar con fecha problemática:');
const fechaTest = new Date('2024-10-27T23:30:00.000Z'); // 8 horas adelante de lo esperado
const horaFormateada = formatearHoraMilitar(fechaTest);
console.log(`   Input: ${fechaTest.toISOString()}`);
console.log(`   Output: ${horaFormateada}`);
console.log(`   Expected local: 18:30 (23:30 UTC - 5)`);
console.log(`   Actual: ${horaFormateada}`);

console.log('\n🚀 RECOMENDACIÓN INMEDIATA:');
console.log('──────────────────────────');
console.log('1. Implementar solución #1 (forzar UTC-5 en el código)');
console.log('2. Configurar TZ=America/Guayaquil en Vercel');
console.log('3. Hacer deploy y testear');
console.log('4. Si funciona, considerar migrar a date-fns-tz para robustez');

console.log('\n📋 CÓDIGO PARA IMPLEMENTAR:');
console.log('───────────────────────────');
console.log('// En el endpoint PUT, cambiar:');
console.log('const newReservedAt = new Date(year, month, day, hours, minutes, 0, 0);');
console.log('// Por:');
console.log('const newReservedAt = new Date(Date.UTC(year, month, day, hours + 5, minutes, 0, 0));');
console.log('// Esto fuerza UTC-5 sin importar el timezone del servidor');
