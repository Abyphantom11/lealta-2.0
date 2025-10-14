#!/usr/bin/env node

/**
 * 🧪 PRUEBA: Timezone Ecuador está correcto
 */

console.log('🧪 VERIFICANDO TIMEZONE DE ECUADOR');
console.log('='.repeat(70));

const now = new Date();

// 1. Hora UTC (como en Vercel)
console.log('\n🌐 HORA EN VERCEL (UTC):');
console.log(`   ${now.toISOString()}`);
console.log(`   Hora: ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}`);

// 2. Hora en Ecuador (America/Guayaquil)
const ecuadorTime = now.toLocaleString('en-US', {
  timeZone: 'America/Guayaquil',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

console.log('\n🇪🇨 HORA EN ECUADOR (America/Guayaquil):');
console.log(`   ${ecuadorTime}`);

// Parsear para obtener la hora
const [datePart, timePart] = ecuadorTime.split(', ');
const [month, day, year] = datePart.split('/').map(Number);
const [hour, minute] = timePart.split(':').map(Number);

console.log(`   Hora: ${hour}:${minute.toString().padStart(2, '0')}`);
console.log(`   Día: ${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(year, month - 1, day).getDay()]}`);

// 3. Calcular día comercial
console.log('\n🏢 CÁLCULO DE DÍA COMERCIAL:');
console.log(`   Hora de reseteo: 4:00 AM`);
console.log(`   Hora actual Ecuador: ${hour}:${minute.toString().padStart(2, '0')}`);

let diaComercial;
const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

if (hour < 4) {
  // Antes de las 4 AM = día anterior
  const localDate = new Date(year, month - 1, day);
  localDate.setDate(localDate.getDate() - 1);
  diaComercial = diasSemana[localDate.getDay()];
  console.log(`   ✅ ANTES de las 4 AM → Día comercial: ${diaComercial.toUpperCase()} (día anterior)`);
} else {
  // Después de las 4 AM = día actual
  const localDate = new Date(year, month - 1, day);
  diaComercial = diasSemana[localDate.getDay()];
  console.log(`   ✅ DESPUÉS de las 4 AM → Día comercial: ${diaComercial.toUpperCase()} (día actual)`);
}

// 4. Comparación con lo que calculaba antes (mal)
console.log('\n⚠️  ANTES (INCORRECTO - usaba UTC):');
const hourUTC = now.getUTCHours();
let diaComercialMal;
if (hourUTC < 4) {
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  diaComercialMal = diasSemana[yesterday.getUTCDay()];
  console.log(`   Calculaba: ${diaComercialMal} (usando hora UTC ${hourUTC}:${now.getUTCMinutes()})`);
} else {
  diaComercialMal = diasSemana[now.getUTCDay()];
  console.log(`   Calculaba: ${diaComercialMal} (usando hora UTC ${hourUTC}:${now.getUTCMinutes()})`);
}

// 5. Resultado
console.log('\n' + '='.repeat(70));
if (diaComercial !== diaComercialMal) {
  console.log('❌ PROBLEMA ENCONTRADO Y CORREGIDO:');
  console.log(`   Antes calculaba: ${diaComercialMal} (INCORRECTO)`);
  console.log(`   Ahora calcula: ${diaComercial} (CORRECTO) ✅`);
} else {
  console.log('✅ En este momento ambos métodos calculan el mismo día');
  console.log(`   Día comercial: ${diaComercial}`);
}

console.log('\n💡 PRÓXIMO PASO:');
console.log('   1. Asegúrate de tener elementos para día: "' + diaComercial + '"');
console.log('   2. Despliega a producción: git push');
console.log('   3. Verifica que aparezcan todos los elementos');
console.log('='.repeat(70));
