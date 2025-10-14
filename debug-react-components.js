// Script para revisar el estado actual de los componentes React
// Simular exactamente lo que hace el hook useAutoRefreshPortalConfig

const fetch = require('node-fetch');

async function debugReactComponents() {
  console.log('🔍 DEBUGGING COMPONENTES REACT');
  console.log('='.repeat(50));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    // 1. Simular la llamada exacta que hace useAutoRefreshPortalConfig
    const timestamp = new Date().getTime();
    const currentDay = new Date().toDateString(); // Como hace getCurrentBusinessDayKey
    
    console.log(`📅 Día comercial calculado: ${currentDay}`);
    console.log(`🕐 Timestamp: ${timestamp}`);
    
    const response = await fetch(
      `http://localhost:3001/api/portal/config-v2?businessId=${businessId}&t=${timestamp}&dayKey=${encodeURIComponent(currentDay)}`,
      {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
    
    if (!response.ok) {
      console.log(`❌ Error en API: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    console.log('\n📊 RESPUESTA DE LA API:');
    console.log('Success:', data.success);
    console.log('Data keys:', Object.keys(data.data || data));
    
    const apiData = data.data || data;
    
    // 2. Simular getBannersForBusinessDay exactamente
    console.log('\n🔍 SIMULANDO getBannersForBusinessDay():');
    
    const banners = apiData.banners || [];
    console.log(`Banners raw de la API: ${banners.length}`);
    
    if (banners.length > 0) {
      console.log('\n📋 ANÁLISIS DETALLADO DE CADA BANNER:');
      
      banners.forEach((banner, idx) => {
        console.log(`\n${idx + 1}. Banner: "${banner.titulo}"`);
        console.log(`   ID: ${banner.id}`);
        console.log(`   Activo: ${banner.activo}`);
        console.log(`   Día: ${banner.dia}`);
        console.log(`   ImagenUrl: ${banner.imagenUrl || 'NO TIENE'}`);
        
        // Aplicar el mismo filtro que isItemVisibleInBusinessDay
        const hasValidImage = banner.imagenUrl && banner.imagenUrl.trim() !== '';
        const isActive = banner.activo === true;
        const dayMatches = !banner.dia || banner.dia === 'lunes'; // Hoy es lunes
        
        console.log(`   ✅ Validaciones:`);
        console.log(`      Has valid image: ${hasValidImage}`);
        console.log(`      Is active: ${isActive}`);
        console.log(`      Day matches (lunes): ${dayMatches}`);
        console.log(`      SHOULD SHOW: ${hasValidImage && isActive && dayMatches}`);
      });
      
      // Filtrar como lo hace el hook
      const bannersVisibles = banners.filter(banner => {
        const hasValidImage = banner.imagenUrl && banner.imagenUrl.trim() !== '';
        const isActive = banner.activo === true;
        const dayMatches = !banner.dia || banner.dia === 'lunes';
        return hasValidImage && isActive && dayMatches;
      });
      
      console.log(`\n🎯 RESULTADO FINAL:`);
      console.log(`Banners que deberían renderizarse: ${bannersVisibles.length}`);
      
      if (bannersVisibles.length > 0) {
        console.log('\n✅ BANNERS FINALES PARA RENDERIZAR:');
        bannersVisibles.forEach((banner, idx) => {
          console.log(`   ${idx + 1}. "${banner.titulo}" con imagen: ${banner.imagenUrl}`);
        });
      } else {
        console.log('\n❌ NO HAY BANNERS PARA RENDERIZAR');
      }
    } else {
      console.log('❌ No se recibieron banners de la API');
    }
    
    // 3. Verificar promociones también
    console.log('\n🎯 VERIFICANDO PROMOCIONES:');
    const promociones = apiData.promociones || [];
    console.log(`Promociones raw: ${promociones.length}`);
    
    if (promociones.length > 0) {
      const promocionesVisibles = promociones.filter(promo => {
        const hasValidImage = promo.imagenUrl && promo.imagenUrl.trim() !== '';
        const isActive = promo.activo === true;
        const dayMatches = !promo.dia || promo.dia === 'lunes';
        return hasValidImage && isActive && dayMatches;
      });
      
      console.log(`Promociones que deberían renderizarse: ${promocionesVisibles.length}`);
    }
    
    console.log('\n🔍 POSIBLES PROBLEMAS:');
    console.log('1. ¿El componente BannersSection está montado?');
    console.log('2. ¿El hook useAutoRefreshPortalConfig se está ejecutando?');
    console.log('3. ¿Hay errores en la consola del navegador?');
    console.log('4. ¿El estado de React se está actualizando correctamente?');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugReactComponents().catch(console.error);
