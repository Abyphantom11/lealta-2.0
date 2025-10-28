const { calcularFechasReserva } = require('./src/lib/timezone-utils.js');

console.log('🔍 DIAGNÓSTICO ESPECÍFICO DEL PROBLEMA PERSISTENTE');
console.log('==================================================');

console.log('\n📋 Probando exactamente lo que usa el API...');
console.log('calcularFechasReserva("2024-01-15", "01:00")');

try {
  const resultado = calcularFechasReserva("2024-01-15", "01:00");
  
  console.log('\n📊 RESULTADO COMPLETO:');
  console.log('─────────────────────');
  console.log('fechaReserva (UTC):', resultado.fechaReserva.toISOString());
  console.log('fechaReservaNegocio:', resultado.debug.fechaReservaNegocio);
  
  // Extraer solo la hora para análisis
  const horaEnNegocio = resultado.debug.fechaReservaNegocio.split(' ')[1];
  
  console.log('\n🎯 ANÁLISIS CRÍTICO:');
  console.log('─────────────────────');
  console.log(`Input hora: 01:00`);
  console.log(`Output hora: ${horaEnNegocio}`);
  console.log(`¿Son iguales?: ${horaEnNegocio === '01:00' ? 'SÍ ✅' : 'NO ❌'}`);
  
  if (horaEnNegocio !== '01:00') {
    console.log('\n❌ CONFIRMADO: EL PROBLEMA PERSISTE');
    console.log('La función calcularFechasReserva NO está funcionando correctamente');
    console.log('Necesitamos revisar la lógica interna paso a paso');
  } else {
    console.log('\n✅ FUNCIONA: La función está devolviendo la hora correcta');
    console.log('El problema debe estar en otra parte del flujo');
  }
  
} catch (error) {
  console.log('\n❌ ERROR AL EJECUTAR:');
  console.log(error.message);
}

console.log('\n🔍 Información adicional del módulo:');
console.log('──────────────────────────────────');
const fs = require('fs');
const timezoneContent = fs.readFileSync('./src/lib/timezone-utils.js', 'utf8');
const lines = timezoneContent.split('\n');
const crearFechaLines = lines.filter((line, i) => {
  return line.includes('crearFechaReserva') || 
         line.includes('offset') || 
         line.includes('Colombia') ||
         line.includes('UTC');
}).slice(0, 10);

console.log('Líneas relevantes en el archivo:');
crearFechaLines.forEach((line, i) => {
  console.log(`${i + 1}: ${line.trim()}`);
});
