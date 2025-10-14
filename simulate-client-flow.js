// Script para simular el flujo completo del cliente React
const fetch = require('node-fetch');

async function simulateClientFlow() {
  console.log('🔄 SIMULANDO FLUJO COMPLETO DEL CLIENTE REACT');
  console.log('='.repeat(60));
  
  // PASO 1: Validar el business (como hace [businessId]/cliente/page.tsx)
  console.log('📍 PASO 1: Validar business por slug');
  const slug = 'casa-sabor-demo';
  
  const validateResponse = await fetch(`http://localhost:3001/api/businesses/${slug}/validate`);
  if (!validateResponse.ok) {
    console.log('❌ Error en validación del business');
    return;
  }
  
  const businessData = await validateResponse.json();
  console.log(`✅ Business ID obtenido: ${businessData.id}`);
  
  // PASO 2: Llamar a la API del portal (como hace useAutoRefreshPortalConfig)
  console.log('\n📍 PASO 2: Llamar API portal config');
  
  const timestamp = new Date().getTime();
  const currentDay = 'lunes'; // Simular día actual
  
  const portalResponse = await fetch(
    `http://localhost:3001/api/portal/config-v2?businessId=${businessData.id}&t=${timestamp}&dayKey=${currentDay}`,
    {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
  
  if (!portalResponse.ok) {
    console.log(`❌ Error en API portal: ${portalResponse.status}`);
    return;
  }
  
  const portalData = await portalResponse.json();
  console.log('✅ API portal respondió correctamente');
  
  // PASO 3: Procesar los datos como hace getBannersForBusinessDay
  console.log('\n📍 PASO 3: Procesar banners como React');
  
  const apiData = portalData.data || portalData;
  const banners = apiData.banners || [];
  
  console.log(`📊 Banners recibidos de la API: ${banners.length}`);
  
  // Simular el filtro por día (como hace isItemVisibleInBusinessDay)
  const bannersDelDia = banners.filter(banner => {
    const hasValidImage = banner.imagenUrl && banner.imagenUrl.trim() !== '';
    const isActiveToday = banner.activo === true;
    const isDayMatch = !banner.dia || banner.dia === currentDay;
    
    console.log(`   📋 Banner "${banner.titulo}":`, {
      hasValidImage,
      isActiveToday,
      isDayMatch,
      shouldShow: hasValidImage && isActiveToday && isDayMatch
    });
    
    return hasValidImage && isActiveToday && isDayMatch;
  });
  
  console.log(`\n🎯 RESULTADO FINAL:`);
  console.log(`   Banners que deberían mostrarse: ${bannersDelDia.length}`);
  
  if (bannersDelDia.length > 0) {
    console.log('\n   📊 BANNERS VISIBLES:');
    bannersDelDia.forEach((banner, idx) => {
      console.log(`      ${idx + 1}. "${banner.titulo}"`);
      console.log(`         Imagen: ${banner.imagenUrl}`);
      console.log(`         Día: ${banner.dia || 'cualquier día'}`);
    });
    console.log('\n✅ TODO CORRECTO: Los banners deberían aparecer en el cliente');
  } else {
    console.log('\n❌ PROBLEMA: No hay banners para mostrar');
  }
  
  // PASO 4: Verificar promociones también
  console.log('\n📍 PASO 4: Verificar promociones');
  const promociones = apiData.promociones || [];
  const promocionesDelDia = promociones.filter(promo => {
    const hasValidImage = promo.imagenUrl && promo.imagenUrl.trim() !== '';
    const isActiveToday = promo.activo === true;
    const isDayMatch = !promo.dia || promo.dia === currentDay;
    
    return hasValidImage && isActiveToday && isDayMatch;
  });
  
  console.log(`📊 Promociones que deberían mostrarse: ${promocionesDelDia.length}`);
  
  if (promocionesDelDia.length > 0) {
    console.log('\n   🎯 PROMOCIONES VISIBLES:');
    promocionesDelDia.forEach((promo, idx) => {
      console.log(`      ${idx + 1}. "${promo.titulo}"`);
      console.log(`         Imagen: ${promo.imagenUrl}`);
    });
  }
}

simulateClientFlow().catch(console.error);
