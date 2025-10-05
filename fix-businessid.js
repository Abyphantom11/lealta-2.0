// Script para actualizar el businessId en localStorage
// Ejecuta esto en la consola del navegador (F12)

const correctBusinessId = 'cmgau76qc0000ey1gooftzlqr';

// Limpiar cualquier sessionId viejo
localStorage.removeItem('lealta_reservas_session_backup');

console.log('✅ BusinessId correcto:', correctBusinessId);
console.log('');
console.log('📋 Ahora recarga la página usando:');
console.log(`http://localhost:3000/reservas?businessId=${correctBusinessId}`);
