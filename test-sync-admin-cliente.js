// 🧪 SCRIPT DE PRUEBA: Verificar sincronización admin→cliente
// Ejecutar desde browser console en http://localhost:3001/arepa/cliente

console.log('🧪 INICIANDO PRUEBAS DE SINCRONIZACIÓN...');

// Prueba 1: Verificar que cliente obtiene config del admin
async function testAdminToClientSync() {
  try {
    console.log('📞 Llamando API del cliente...');
    const response = await fetch('/api/portal/config-v2?businessId=arepa');
    const config = await response.json();
    
    console.log('📋 Config recibido del cliente:', {
      nombreEmpresa: config.nombreEmpresa,
      tarjetas: config.tarjetas?.length,
      dataSource: config.settings?.dataSource,
      firstTarjeta: config.tarjetas?.[0]
    });
    
    // Verificar que viene del admin JSON
    if (config.settings?.dataSource === 'admin-json-primary') {
      console.log('✅ ÉXITO: Cliente lee config del admin JSON');
    } else {
      console.log('⚠️ ADVERTENCIA: Cliente usa fallback de BD');
    }
    
    // Verificar tarjetas específicas
    const oroTarjeta = config.tarjetas?.find(t => t.nivel === 'Oro');
    if (oroTarjeta) {
      console.log('🏆 Tarjeta Oro encontrada:', {
        puntos: oroTarjeta.condiciones?.puntosMinimos,
        esperado: 500
      });
      
      if (oroTarjeta.condiciones?.puntosMinimos === 500) {
        console.log('✅ ÉXITO: Puntos de Oro corregidos (500)');
      } else {
        console.log('❌ FALLO: Puntos de Oro incorrectos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar prueba
testAdminToClientSync();

console.log('🎯 Para verificar manualmente:');
console.log('1. Ve al admin: http://localhost:3001/arepa/admin');
console.log('2. Cambia puntos de Oro a 600');
console.log('3. Recarga cliente y ejecuta este script de nuevo');
console.log('4. Debería mostrar 600 en lugar de 500');
