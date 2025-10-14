// Debug del cliente portal - verificar si está recibiendo los datos
import { promises as fs } from 'fs';
import path from 'path';

async function debugClientPortal() {
  console.log('🔍 DEBUG CLIENTE PORTAL - AUTO REFRESH');
  console.log('=======================================');
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  
  try {
    // 1. Verificar que el archivo JSON existe y tiene datos
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('📄 Archivo JSON existe y es válido ✅');
    
    // 2. Simular el día actual (domingo según el contexto)
    const today = 'domingo';
    console.log(`📅 Día actual simulado: ${today}`);
    
    // 3. Verificar banners para hoy
    console.log('\n🎬 BANNERS:');
    const bannersHoy = config.banners?.filter(banner => {
      const dias = banner.dias || [banner.dia];
      return dias.includes(today) && banner.activo;
    }) || [];
    
    console.log(`Banners para ${today}:`, bannersHoy.length);
    bannersHoy.forEach(banner => {
      console.log(`  - ${banner.titulo}: ${banner.descripcion}`);
    });
    
    // 4. Verificar promociones para hoy  
    console.log('\n🎯 PROMOCIONES:');
    const promocionesHoy = config.promociones?.filter(promo => {
      const dias = promo.dias || [promo.dia];
      return dias.includes(today) && promo.activo;
    }) || [];
    
    console.log(`Promociones para ${today}:`, promocionesHoy.length);
    promocionesHoy.forEach(promo => {
      console.log(`  - ${promo.titulo}: ${promo.descripcion}`);
    });
    
    // 5. Verificar favorito del día
    console.log('\n⭐ FAVORITO DEL DÍA:');
    const favoritoDelDia = config.favoritoDelDia?.[today];
    
    if (favoritoDelDia && favoritoDelDia.activo) {
      console.log(`Favorito para ${today}:`, favoritoDelDia.titulo);
      console.log(`  Descripción: ${favoritoDelDia.descripcion}`);
    } else {
      console.log(`❌ No hay favorito activo para ${today}`);
    }
    
    // 6. Simular el endpoint que usa useAutoRefreshPortalConfig
    console.log('\n🔌 SIMULANDO ENDPOINT:');
    console.log('URL: /api/portal-config?businessId=' + businessId);
    
    const responseSimulado = {
      banners: bannersHoy,
      promociones: promocionesHoy, 
      favoritoDelDia: favoritoDelDia,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Response simulado:', JSON.stringify(responseSimulado, null, 2));
    
    // 7. Verificar si hay datos para mostrar
    const hayDatos = bannersHoy.length > 0 || promocionesHoy.length > 0 || (favoritoDelDia && favoritoDelDia.activo);
    
    console.log('\n📊 RESUMEN:');
    console.log(`¿Hay datos para mostrar en ${today}?`, hayDatos ? '✅ SÍ' : '❌ NO');
    console.log(`Banners: ${bannersHoy.length}`);
    console.log(`Promociones: ${promocionesHoy.length}`);
    console.log(`Favorito del día: ${favoritoDelDia && favoritoDelDia.activo ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugClientPortal()
  .then(() => {
    console.log('\n🏁 Debug completado');
    process.exit(0);
  })
  .catch(console.error);
