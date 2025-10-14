// Script para debug y limpieza de caché en el navegador
// Ejecutar esto en la consola del navegador (F12)

console.log('🧹 LIMPIEZA COMPLETA DE CACHÉ - RESERVAS');
console.log('=========================================');

// 1. Limpiar localStorage
console.log('1️⃣ Limpiando localStorage...');
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('reserva') || key.includes('stats') || key.includes('query'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => {
  console.log(`   🗑️ Removiendo: ${key}`);
  localStorage.removeItem(key);
});

// 2. Limpiar sessionStorage
console.log('2️⃣ Limpiando sessionStorage...');
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('reserva') || key.includes('stats') || key.includes('query'))) {
    sessionKeysToRemove.push(key);
  }
}
sessionKeysToRemove.forEach(key => {
  console.log(`   🗑️ Removiendo: ${key}`);
  sessionStorage.removeItem(key);
});

// 3. Limpiar caché de React Query si existe
console.log('3️⃣ Intentando limpiar React Query cache...');
if (window.queryClient) {
  window.queryClient.clear();
  console.log('   ✅ React Query cache limpiado');
} else {
  console.log('   ℹ️ No se encontró queryClient global');
}

// 4. Verificar qué businessId está siendo usado
console.log('4️⃣ Verificando businessId actual...');
const currentPath = window.location.pathname;
const businessIdMatch = currentPath.match(/\/([^\/]+)\//);
if (businessIdMatch) {
  console.log(`   📍 BusinessId detectado: ${businessIdMatch[1]}`);
} else {
  console.log('   ⚠️ No se detectó businessId en la URL');
}

// 5. Forzar refetch de datos
console.log('5️⃣ Verificando llamadas a la API...');
console.log('   📡 Verifica en Network tab las siguientes URLs:');
console.log('   - /api/reservas?businessId=cmgf5px5f0000eyy0elci9yds&include=stats');
console.log('   - /api/reservas/stats?businessId=cmgf5px5f0000eyy0elci9yds');

// 6. Script de verificación en tiempo real
console.log('6️⃣ Script de verificación:');
console.log(`
// Ejecuta esto para verificar qué datos está recibiendo el frontend:
fetch('/api/reservas?businessId=cmgf5px5f0000eyy0elci9yds&include=stats')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Datos de la API:', data);
    console.log('📈 Stats:', data.stats);
    console.log('🎯 Reservas hoy:', data.stats?.reservasHoy || 'undefined');
  })
  .catch(err => console.error('❌ Error:', err));
`);

console.log('✅ Limpieza completada. Haz hard refresh (Ctrl+Shift+R)');
