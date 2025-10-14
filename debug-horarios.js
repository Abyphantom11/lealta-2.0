// Explicar la lógica de horarios para promociones
console.log('🕐 ANÁLISIS DE HORARIOS DE PROMOCIONES');
console.log('=====================================');

const ahora = new Date();
const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

console.log(`📅 Fecha/hora actual: ${ahora.toLocaleString()}`);
console.log(`⏰ Hora actual en minutos: ${horaActual}`);
console.log(`🎯 Hora actual legible: ${Math.floor(horaActual / 60)}:${(horaActual % 60).toString().padStart(2, '0')}`);

// Simular diferentes horarios de término
const ejemplosHorarios = [
  '04:00', // Actual (problema)
  '23:59', // Hasta casi medianoche
  '06:00', // Madrugada
  '12:00', // Mediodía
  '18:00', // Tarde
  '20:30'  // Ahora + algo
];

console.log('\n🔍 ANÁLISIS DE HORARIOS:');
ejemplosHorarios.forEach(horaTermino => {
  const [horas, minutos] = horaTermino.split(':').map(Number);
  const horaTerminoMinutos = horas * 60 + minutos;
  const esValida = horaActual < horaTerminoMinutos;
  
  console.log(`  ${horaTermino} (${horaTerminoMinutos} min) → ${esValida ? '✅ VÁLIDA' : '❌ EXPIRADA'}`);
});

console.log('\n💡 SOLUCIONES:');
console.log('1. 🎯 RECOMENDADO: Cambiar hora de término a 23:59 en el admin');
console.log('2. 🗑️ ALTERNATIVA: Quitar el campo horaTermino para promociones de todo el día');
console.log('3. 🔄 AVANZADO: Implementar lógica de "día siguiente" para horarios < 6:00 AM');

console.log('\n🛠️ PARA SOLUCIONARLO:');
console.log('- Ve al admin panel');
console.log('- Edita la promoción "sf"');
console.log('- Cambia "Hora término" de 04:00 a 23:59');
console.log('- O deja el campo vacío para promoción de todo el día');
