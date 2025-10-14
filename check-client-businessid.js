// Script para verificar qué businessId está enviando el cliente al portal
const fetch = require('node-fetch');

async function checkClientBusinessId() {
  console.log('🔍 VERIFICANDO BUSINESSID DEL CLIENTE');
  console.log('='.repeat(50));
  
  // 1. Simular la llamada tal como la hace el cliente
  const clientBusinessId1 = 'cmfr2y0ia0000eyvw7ef3k20u'; // El fallback del AuthHandler
  const clientBusinessId2 = 'cmgf5px5f0000eyy0elci9yds'; // El correcto para Casa Sabor Demo
  const clientBusinessId3 = 'default'; // El que podría estar usando
  
  const testBusinessIds = [
    { id: clientBusinessId1, description: 'FALLBACK del AuthHandler (cmfr2y0ia...)' },
    { id: clientBusinessId2, description: 'CORRECTO Casa Sabor Demo (cmgf5px...)' },
    { id: clientBusinessId3, description: 'DEFAULT genérico' }
  ];
  
  for (const { id, description } of testBusinessIds) {
    console.log(`\n🧪 PROBANDO: ${description}`);
    console.log(`   BusinessId: ${id}`);
    
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `http://localhost:3001/api/portal/config-v2?businessId=${id}&t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ RESPUESTA EXITOSA:');
        console.log(`      Banners: ${data.banners?.length || 0}`);
        console.log(`      Promociones: ${(data.promociones || data.promotions)?.length || 0}`);
        console.log(`      BusinessId retornado: ${data.businessId || 'NO DEFINIDO'}`);
        
        // Mostrar detalles de banners si existen
        if (data.banners?.length > 0) {
          console.log('      📊 BANNERS ENCONTRADOS:');
          data.banners.forEach((banner, idx) => {
            console.log(`         ${idx + 1}. "${banner.titulo}" (días: ${banner.diasSemana}) - Imagen: ${banner.imagenUrl ? '✅' : '❌'}`);
          });
        }
        
        // Mostrar detalles de promociones si existen
        if ((data.promociones || data.promotions)?.length > 0) {
          const promos = data.promociones || data.promotions;
          console.log('      🎯 PROMOCIONES ENCONTRADAS:');
          promos.forEach((promo, idx) => {
            console.log(`         ${idx + 1}. "${promo.titulo}" (días: ${promo.diasSemana}) - Imagen: ${promo.imagenUrl ? '✅' : '❌'}`);
          });
        }
        
      } else {
        console.log(`   ❌ ERROR: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR DE CONEXIÓN: ${error.message}`);
    }
  }
  
  console.log('\n🔍 ANÁLISIS COMPLETO:');
  console.log('Si el cliente está usando el fallback "cmfr2y0ia0000eyvw7ef3k20u",');
  console.log('NO va a encontrar los banners/promociones de Casa Sabor Demo.');
  console.log('Debe usar "cmgf5px5f0000eyy0elci9yds" para obtener los datos correctos.');
}

checkClientBusinessId().catch(console.error);
