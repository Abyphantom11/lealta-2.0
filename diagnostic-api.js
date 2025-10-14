// Script para diagnosticar la respuesta de la API paso a paso
const fetch = require('node-fetch');

async function diagnosticAPI() {
  console.log('🔬 DIAGNÓSTICO DETALLADO DE LA API');
  console.log('='.repeat(50));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    const timestamp = Date.now();
    const response = await fetch(
      `http://localhost:3001/api/portal/config-v2?businessId=${businessId}&debug=true&t=${timestamp}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📊 RESPUESTA DE LA API:');
      console.log(JSON.stringify(data, null, 2));
      
      // Extraer datos reales (están dentro de data.data)
      const realData = data.data || data;
      
      console.log('\n🎯 ANÁLISIS DETALLADO:');
      console.log(`BusinessId: ${realData.businessId || 'NO DEFINIDO'}`);
      console.log(`Banners totales: ${realData.banners?.length || 0}`);
      console.log(`Promociones totales: ${(realData.promociones || realData.promotions)?.length || 0}`);
      
      if (realData.banners?.length > 0) {
        console.log('\n📊 BANNERS:');
        realData.banners.forEach((banner, idx) => {
          console.log(`  ${idx + 1}. ${banner.titulo || banner.title}`);
          console.log(`     Activo: ${banner.activo || banner.active}`);
          console.log(`     Día: ${banner.dia}`);
          console.log(`     Imagen: ${banner.imagenUrl || banner.imageUrl || 'NO TIENE'}`);
        });
      }
      
      if ((realData.promociones || realData.promotions)?.length > 0) {
        const promos = realData.promociones || realData.promotions;
        console.log('\n🎯 PROMOCIONES:');
        promos.forEach((promo, idx) => {
          console.log(`  ${idx + 1}. ${promo.titulo || promo.title}`);
          console.log(`     Activo: ${promo.activo || promo.active}`);
          console.log(`     Día: ${promo.dia}`);
          console.log(`     Imagen: ${promo.imagenUrl || promo.imageUrl || 'NO TIENE'}`);
        });
      }
      
    } else {
      console.log(`❌ Error HTTP: ${response.status}`);
      const errorText = await response.text();
      console.log(`Detalles: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticAPI().catch(console.error);
