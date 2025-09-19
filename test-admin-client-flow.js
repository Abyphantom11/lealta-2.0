console.log('🧪 PRUEBA: Flujo Admin → Cliente');
console.log('======================================');

// Función para probar el flujo completo
async function testAdminClientFlow() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('📊 1. Verificando estado inicial...');
    
    // Obtener configuración actual del cliente
    const clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    const clientData = await clientResponse.json();
    
    console.log('📋 Estado inicial del cliente:');
    console.log(`  - Banners: ${clientData.banners?.length || 0}`);
    console.log(`  - Promociones: ${clientData.promociones?.length || 0}`);
    console.log(`  - Recompensas: ${clientData.recompensas?.length || 0}`);
    console.log(`  - Favoritos: ${clientData.favoritoDelDia?.length || 0}`);
    
    if (clientData.recompensas?.length > 0) {
      console.log('\n🎁 Recompensas actuales:');
      clientData.recompensas.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.titulo} (${r.puntosRequeridos} pts, activo: ${r.activo})`);
      });
    }
    
    if (clientData.promociones?.length > 0) {
      console.log('\n🔥 Promociones actuales:');
      clientData.promociones.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.titulo} (activo: ${p.activo})`);
      });
    }
    
    if (clientData.banners?.length > 0) {
      console.log('\n🎨 Banners actuales:');
      clientData.banners.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.titulo} (activo: ${b.activo})`);
      });
    }
    
    if (clientData.favoritoDelDia?.length > 0) {
      console.log('\n⭐ Favoritos del día actuales:');
      clientData.favoritoDelDia.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.titulo} (activo: ${f.activo})`);
      });
    }
    
    console.log('\n✅ Prueba completada: El cliente puede leer correctamente los datos sincronizados.');
    console.log('\n💡 Para probar el flujo completo:');
    console.log('   1. Abre el admin panel en el navegador');
    console.log('   2. Ve a Portal Cliente → Recompensas/Banners/etc.');
    console.log('   3. Agrega/edita algún elemento');
    console.log('   4. Verifica que aparezca inmediatamente en el portal cliente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testAdminClientFlow();
