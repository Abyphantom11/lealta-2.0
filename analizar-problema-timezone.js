#!/usr/bin/env node

/**
 * 🌍 PROBLEMA DE TIMEZONE - SOLUCIÓN
 * 
 * Vercel corre en UTC. Cuando es 2:47 AM hora local (lunes),
 * en UTC podría ser 7:47 AM (martes).
 * 
 * Esto hace que el servidor calcule un día comercial diferente.
 */

console.log('🌍 ANÁLISIS DE TIMEZONE');
console.log('='.repeat(60));

const now = new Date();

// 1. Hora local
const horaLocal = now.getHours();
const minutoLocal = now.getMinutes();
const diaLocal = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];

console.log('\n📱 HORA LOCAL (Tu computadora):');
console.log(`   Hora: ${horaLocal}:${minutoLocal.toString().padStart(2, '0')}`);
console.log(`   Día: ${diaLocal}`);
console.log(`   Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

// Calcular día comercial local
let diaComercialLocal;
if (horaLocal < 4) {
  const ayer = new Date(now);
  ayer.setDate(ayer.getDate() - 1);
  diaComercialLocal = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ayer.getDay()];
  console.log(`   🏢 Día comercial LOCAL: ${diaComercialLocal} (antes de 4 AM = día anterior)`);
} else {
  diaComercialLocal = diaLocal;
  console.log(`   🏢 Día comercial LOCAL: ${diaComercialLocal} (después de 4 AM = día actual)`);
}

// 2. Hora UTC (como en Vercel)
const horaUTC = now.getUTCHours();
const minutoUTC = now.getUTCMinutes();
const diaUTC = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getUTCDay()];

console.log('\n🌐 HORA UTC (Servidores de Vercel):');
console.log(`   Hora: ${horaUTC}:${minutoUTC.toString().padStart(2, '0')}`);
console.log(`   Día: ${diaUTC}`);

// Calcular día comercial UTC (como lo hace Vercel)
let diaComercialUTC;
if (horaUTC < 4) {
  const ayerUTC = new Date(now);
  ayerUTC.setUTCDate(ayerUTC.getUTCDate() - 1);
  diaComercialUTC = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ayerUTC.getUTCDay()];
  console.log(`   🏢 Día comercial UTC: ${diaComercialUTC} (antes de 4 AM UTC = día anterior)`);
} else {
  diaComercialUTC = diaUTC;
  console.log(`   🏢 Día comercial UTC: ${diaComercialUTC} (después de 4 AM UTC = día actual)`);
}

// 3. Comparación
console.log('\n🔍 COMPARACIÓN:');
console.log('─'.repeat(60));
console.log(`LOCAL dice: "${diaComercialLocal}"`);
console.log(`VERCEL dice: "${diaComercialUTC}"`);

if (diaComercialLocal !== diaComercialUTC) {
  console.log('\n❌ ¡AQUÍ ESTÁ EL PROBLEMA!');
  console.log('─'.repeat(60));
  console.log('El cliente (tu navegador) y el servidor (Vercel) están');
  console.log('calculando días comerciales DIFERENTES debido al timezone.');
  console.log('');
  console.log('📊 Diferencia horaria:');
  const diff = horaLocal - horaUTC;
  console.log(`   ${Math.abs(diff)} horas (${diff > 0 ? 'adelantado' : 'atrasado'})`);
  console.log('');
  console.log('🎯 SOLUCIÓN:');
  console.log('   1. Configurar timezone en la función getCurrentBusinessDay');
  console.log('   2. O usar el timezone del negocio en lugar de UTC');
  console.log('   3. O crear elementos para AMBOS días cercanos');
} else {
  console.log('\n✅ Los días comerciales coinciden');
  console.log('El problema debe estar en otra parte');
}

// 4. Verificar datos en BD
console.log('\n📊 VERIFICAR DATOS EN BD:');
console.log('─'.repeat(60));
console.log(`Tienes elementos para día: "lunes"`);
console.log(`El servidor (Vercel) busca elementos para: "${diaComercialUTC}"`);

if (diaComercialUTC !== 'lunes') {
  console.log(`\n❌ ¡POR ESO NO APARECEN!`);
  console.log(`El servidor busca "${diaComercialUTC}" pero tú creaste para "lunes"`);
  console.log('');
  console.log('💡 SOLUCIÓN RÁPIDA:');
  console.log(`   1. Crea elementos para "${diaComercialUTC}" también`);
  console.log(`   2. O crea elementos SIN restricción de día (dia = null)`);
  console.log(`   3. O arregla el timezone en getCurrentBusinessDay`);
} else {
  console.log(`\n✅ El día coincide, el problema debe estar en otro lado`);
}
