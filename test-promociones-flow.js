const fetch = require('node-fetch');

async function testPromocionesFlow() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🧪 PRUEBA ESPECÍFICA: Flujo de Promociones');
    console.log('=====================================');
    
    // 1. Probar el endpoint del cliente directamente
    console.log('\n📋 1. Probando endpoint del cliente...');
    const clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    const clientData = await clientResponse.json();
    
    if (clientData.error) {
      console.error('❌ Error en cliente:', clientData.error);
      return;
    }
    
    console.log(`✅ Cliente responde correctamente`);
    console.log(`📊 Promociones en respuesta: ${clientData.promotions?.length || 0}`);
    
    if (clientData.promotions && clientData.promotions.length > 0) {
      console.log('\n🎯 Promociones devueltas por el cliente:');
      clientData.promotions.forEach((promo, i) => {
        console.log(`  ${i + 1}. ${promo.title || promo.titulo}`);
        console.log(`     Descuento: ${promo.discount || promo.descuento}`);
        console.log(`     Activo: ${promo.isActive || promo.activo}`);
      });
    } else {
      console.log('❌ No hay promociones en la respuesta del cliente');
    }
    
    // 2. También verificar el campo 'promociones' (compatibilidad)
    console.log(`\n📊 Campo 'promociones': ${clientData.promociones?.length || 0}`);
    
    if (clientData.promociones && clientData.promociones.length > 0) {
      console.log('\n🎯 Campo promociones:');
      clientData.promociones.forEach((promo, i) => {
        console.log(`  ${i + 1}. ${promo.title || promo.titulo}`);
        console.log(`     Descuento: ${promo.discount || promo.descuento}`);
        console.log(`     Activo: ${promo.isActive || promo.activo}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testPromocionesFlow();
