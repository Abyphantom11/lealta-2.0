/**
 * 🧪 PRUEBA RÁPIDA DE LA CORRECCIÓN
 */

console.log('🧪 PRUEBA DE CORRECCIÓN DE TIMEZONE');
console.log('='.repeat(50));

// Simular la nueva lógica corregida
const fecha = '2025-10-27';
const hora = '14:30';

const [year, month, day] = fecha.split('-').map(Number);
const [hours, minutes] = hora.split(':').map(Number);

// Crear fecha UTC directamente con el offset correcto
const fechaUTCCorrecta = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0, 0));

// Verificar que al convertir de vuelta a Colombia dé la hora original
const fechaEnColombia = fechaUTCCorrecta.toLocaleString('es-CO', { 
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

console.log('📅 RESULTADO:');
console.log(`Input: ${fecha} ${hora} (Colombia)`);
console.log(`UTC: ${fechaUTCCorrecta.toISOString()}`);
console.log(`Back to Colombia: ${fechaEnColombia}`);

// Verificar precisión
const horaEsperada = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
const horaCalculada = fechaEnColombia.split(', ')[1];

if (horaCalculada === horaEsperada) {
  console.log('✅ CORRECCIÓN EXITOSA - La hora coincide exactamente');
} else {
  console.log(`❌ Error: Esperado ${horaEsperada}, obtenido ${horaCalculada}`);
}

// Calcular expiración QR
const fechaExpiracionQR = new Date(fechaUTCCorrecta.getTime() + (12 * 60 * 60 * 1000));
console.log(`QR expira: ${fechaExpiracionQR.toISOString()}`);
console.log(`QR expira Colombia: ${fechaExpiracionQR.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);

// Verificar validez actual
const ahora = new Date();
const horasParaExpirar = (fechaExpiracionQR.getTime() - ahora.getTime()) / (1000 * 60 * 60);
console.log(`Estado QR: ${horasParaExpirar > 0 ? `Válido por ${horasParaExpirar.toFixed(1)}h` : `Expirado hace ${Math.abs(horasParaExpirar).toFixed(1)}h`}`);
