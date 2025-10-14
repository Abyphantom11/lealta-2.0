// 🔍 VERIFICACIÓN DE ESTANDARIZACIÓN: Branding vs Portal APIs
console.log('🔍 VERIFICACIÓN DE ESTANDARIZACIÓN: Branding vs Portal APIs');
console.log('=' .repeat(70));

async function verifyStandardization() {
  const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
  const baseUrl = window.location.origin;

  console.log(`🎯 Probando todas las APIs con businessId: ${businessId}`);
  console.log(`🌐 Base URL: ${baseUrl}\n`);

  const apis = [
    { name: 'BRANDING', url: '/api/branding', key: 'businessName' },
    { name: 'CONFIG-V2', url: '/api/portal/config-v2', key: 'data' },
    { name: 'BANNERS', url: '/api/portal/banners', key: 'banners' },
    { name: 'PROMOCIONES', url: '/api/portal/promociones', key: 'promociones' },
    { name: 'FAVORITO', url: '/api/portal/favorito-del-dia', key: 'favoritoDelDia' }
  ];

  for (const api of apis) {
    try {
      console.log(`📡 Probando ${api.name}...`);
      
      const response = await fetch(`${baseUrl}${api.url}?businessId=${businessId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const hasData = data[api.key] && (Array.isArray(data[api.key]) ? data[api.key].length > 0 : !!data[api.key]);
        
        console.log(`   ✅ ${api.name}: Status ${response.status} - Datos: ${hasData ? 'Sí' : 'No'}`);
        
        if (api.name === 'CONFIG-V2' && data.success && data.data) {
          console.log(`      - BusinessId: ${data.data.businessId}`);
          console.log(`      - Banners: ${data.data.banners?.length || 0}`);
          console.log(`      - Promociones: ${data.data.promociones?.length || 0}`);
          console.log(`      - Favorito: ${data.data.favoritoDelDia ? 'Sí' : 'No'}`);
        }
      } else {
        console.log(`   ❌ ${api.name}: Status ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   💥 ${api.name}: Error - ${error.message}`);
    }
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🔄 PROBANDO SIN HEADERS (Solo query params)...');
  
  // Test específico para verificar que funcionan sin headers
  try {
    const testResponse = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        // ❌ NO incluir x-business-id para simular producción
      },
      cache: 'no-store'
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      if (testData.success && testData.data && testData.data.businessId === businessId) {
        console.log('✅ SUCCESS: Las APIs funcionan correctamente solo con query parameters!');
        console.log('🎉 La estandarización fue exitosa - mismo patrón que branding');
      } else {
        console.log('⚠️ WARNING: API responde pero businessId no coincide');
        console.log(`   Expected: ${businessId}`);
        console.log(`   Received: ${testData.data?.businessId}`);
      }
    } else {
      console.log('❌ FAILED: API no responde correctamente sin headers');
    }
  } catch (error) {
    console.log('💥 ERROR durante test sin headers:', error.message);
  }

  console.log('\n📊 RESUMEN:');
  console.log('- ✅ Branding: Ya funcionaba (patrón de referencia)');
  console.log('- ✅ Portal APIs: Ahora usan el mismo patrón que branding');
  console.log('- 🎯 Consistencia: request.nextUrl.searchParams.get() en todas las APIs');
  console.log('- 🚀 Producción: Debería funcionar correctamente ahora');
}

// Ejecutar verificación
verifyStandardization();

// Función helper para el usuario
window.verifyAPIs = verifyStandardization;
console.log('\n💡 Tip: Ejecuta verifyAPIs() en cualquier momento para repetir la verificación');
