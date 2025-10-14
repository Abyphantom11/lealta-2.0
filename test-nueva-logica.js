// Test de la nueva lógica de horarios mejorada
console.log('🔄 TESTING NUEVA LÓGICA DE HORARIOS');
console.log('===================================');

const ahora = new Date();
const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

console.log(`⏰ Hora actual: ${Math.floor(horaActual / 60)}:${(horaActual % 60).toString().padStart(2, '0')} (${horaActual} minutos)`);

// Simular promoción con horaTermino 04:00
const promocion = {
  titulo: 'sf',
  horaTermino: '04:00',
  activo: true
};

console.log(`\n🎯 Promoción: "${promocion.titulo}"`);
console.log(`📅 Hora término original: ${promocion.horaTermino}`);

// Aplicar nueva lógica
const [horas, minutos] = promocion.horaTermino.split(':').map(Number);
let horaTermino = horas * 60 + minutos;

console.log(`🕐 Hora término en minutos (original): ${horaTermino}`);

// 🔄 MEJORA: Si la hora de término es muy temprano (antes de 6 AM), 
// interpretarla como del día siguiente (horario extendido)
if (horas < 6) {
  horaTermino += 24 * 60; // Agregar 24 horas
  console.log(`🌅 Hora < 6 AM detectada, interpretando como día siguiente`);
}

console.log(`✨ Hora término ajustada: ${horaTermino} minutos`);
console.log(`📊 Equivalente a: ${Math.floor(horaTermino / 60)}:${(horaTermino % 60).toString().padStart(2, '0')} ${horaTermino >= 1440 ? '(día siguiente)' : ''}`);

const esValida = horaActual < horaTermino;

console.log(`\n🏆 RESULTADO:`);
console.log(`¿Promoción válida? ${esValida ? '✅ SÍ' : '❌ NO'}`);
console.log(`Tiempo restante: ${Math.floor((horaTermino - horaActual) / 60)}h ${(horaTermino - horaActual) % 60}m`);

console.log(`\n💡 EXPLICACIÓN:`);
console.log(`- La promoción termina a las 04:00 pero se interpreta como 04:00 del día siguiente`);
console.log(`- Esto permite promociones nocturnas que terminan en la madrugada`);
console.log(`- Horarios < 6:00 AM se consideran "horario extendido"`);
