// Test real del endpoint portal-config para ver qué devuelve
const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testPortalConfigEndpoint() {
  console.log('🔍 TESTING REAL PORTAL CONFIG ENDPOINT');
  console.log('=====================================');
  
  try {
    // Simular exactamente lo que hace useAutoRefreshPortalConfig
    const url = `/api/portal/config?businessId=${businessId}&timestamp=${Date.now()}`;
    console.log(`📡 Calling: ${url}`);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('\n📄 RESPONSE DATA:');
      console.log('Success:', result.success);
      
      const data = result.data;
      
      console.log('\n🎬 BANNERS RAW:');
      console.log('Total banners:', data.banners?.length || 0);
      data.banners?.forEach((banner, i) => {
        console.log(`  ${i + 1}. "${banner.titulo}" - Día: ${banner.dia} - Activo: ${banner.activo}`);
      });
      
      console.log('\n🎯 PROMOCIONES RAW:');
      console.log('Total promociones:', data.promociones?.length || 0);
      data.promociones?.forEach((promo, i) => {
        console.log(`  ${i + 1}. "${promo.titulo}" - Día: ${promo.dia} - Activo: ${promo.activo}`);
      });
      
      console.log('\n⭐ FAVORITO DEL DÍA RAW:');
      if (data.favoritoDelDia) {
        console.log('Tipo:', typeof data.favoritoDelDia);
        if (typeof data.favoritoDelDia === 'object') {
          const keys = Object.keys(data.favoritoDelDia);
          console.log('Keys disponibles:', keys);
          
          // Verificar domingo específicamente
          if (data.favoritoDelDia.domingo) {
            console.log('Favorito domingo:', data.favoritoDelDia.domingo);
          }
        }
      } else {
        console.log('❌ No hay favorito del día');
      }
      
      console.log('\n🔍 SIMULANDO FILTRADO (como lo haría el cliente):');
      
      // Simular día actual
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaHoy = diasSemana[new Date().getDay()];
      console.log(`📅 Día actual: ${diaHoy}`);
      
      // Filtrar banners para hoy
      const bannersHoy = data.banners?.filter(b => {
        if (b.dia) {
          return b.dia === diaHoy && b.activo !== false;
        }
        return true;
      }) || [];
      
      console.log(`🎬 Banners para ${diaHoy}:`, bannersHoy.length);
      bannersHoy.forEach(b => console.log(`  - ${b.titulo}`));
      
      // Filtrar promociones para hoy
      const promocionesHoy = data.promociones?.filter(p => {
        if (p.dia) {
          return p.dia === diaHoy && p.activo !== false;
        }
        return true;
      }) || [];
      
      console.log(`🎯 Promociones para ${diaHoy}:`, promocionesHoy.length);
      promocionesHoy.forEach(p => console.log(`  - ${p.titulo}`));
      
      // Obtener favorito para hoy
      const favoritoHoy = data.favoritoDelDia?.[diaHoy];
      console.log(`⭐ Favorito para ${diaHoy}:`, favoritoHoy ? favoritoHoy.titulo : 'No encontrado');
      
    } else {
      console.error('❌ Error:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
}

// Ejecutar test
testPortalConfigEndpoint();
