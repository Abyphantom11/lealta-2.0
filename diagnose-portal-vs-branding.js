// 🔍 DIAGNÓSTICO COMPLETO: Portal vs Branding
console.log('🔍 DIAGNÓSTICO COMPLETO: Portal vs Branding');
console.log('=' .repeat(60));

async function diagnoseBrandingVsPortal() {
  const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
  const baseUrl = window.location.origin;

  try {
    console.log('\n🎨 1. PROBANDO API BRANDING...');
    const brandingResponse = await fetch(`${baseUrl}/api/branding?businessId=${businessId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (brandingResponse.ok) {
      const brandingData = await brandingResponse.json();
      console.log('✅ BRANDING funcionó correctamente:');
      console.log(`   - Business Name: ${brandingData.businessName}`);
      console.log(`   - Primary Color: ${brandingData.primaryColor}`);
      console.log(`   - Carousel Images: ${brandingData.carouselImages?.length || 0}`);
    } else {
      console.log('❌ BRANDING falló:', brandingResponse.status, brandingResponse.statusText);
    }

    console.log('\n📢 2. PROBANDO API BANNERS...');
    const bannersResponse = await fetch(`${baseUrl}/api/portal/banners?businessId=${businessId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (bannersResponse.ok) {
      const bannersData = await bannersResponse.json();
      console.log('✅ BANNERS respondió correctamente:');
      console.log(`   - Total banners: ${bannersData.banners?.length || 0}`);
      if (bannersData.banners?.length > 0) {
        bannersData.banners.forEach((banner, idx) => {
          console.log(`      ${idx + 1}. "${banner.titulo || banner.title}" (${banner.activo || banner.active ? 'activo' : 'inactivo'})`);
        });
      }
    } else {
      console.log('❌ BANNERS falló:', bannersResponse.status, bannersResponse.statusText);
    }

    console.log('\n🎁 3. PROBANDO API PROMOCIONES...');
    const promocionesResponse = await fetch(`${baseUrl}/api/portal/promociones?businessId=${businessId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (promocionesResponse.ok) {
      const promocionesData = await promocionesResponse.json();
      console.log('✅ PROMOCIONES respondió correctamente:');
      console.log(`   - Total promociones: ${promocionesData.promociones?.length || 0}`);
      if (promocionesData.promociones?.length > 0) {
        promocionesData.promociones.forEach((promo, idx) => {
          console.log(`      ${idx + 1}. "${promo.titulo || promo.title}" (${promo.activo || promo.active ? 'activo' : 'inactivo'})`);
        });
      }
    } else {
      console.log('❌ PROMOCIONES falló:', promocionesResponse.status, promocionesResponse.statusText);
    }

    console.log('\n⭐ 4. PROBANDO API FAVORITO DEL DÍA...');
    const favoritoResponse = await fetch(`${baseUrl}/api/portal/favorito-del-dia?businessId=${businessId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (favoritoResponse.ok) {
      const favoritoData = await favoritoResponse.json();
      console.log('✅ FAVORITO DEL DÍA respondió correctamente:');
      console.log(`   - Favorito: ${favoritoData.favoritoDelDia ? 'Sí configurado' : 'No configurado'}`);
      if (favoritoData.favoritoDelDia) {
        console.log(`      - Nombre: ${favoritoData.favoritoDelDia.productName || favoritoData.favoritoDelDia.nombre}`);
        console.log(`      - Activo: ${favoritoData.favoritoDelDia.active || favoritoData.favoritoDelDia.activo ? 'Sí' : 'No'}`);
      }
    } else {
      console.log('❌ FAVORITO DEL DÍA falló:', favoritoResponse.status, favoritoResponse.statusText);
    }

    console.log('\n📊 5. PROBANDO API CONFIG-V2 (La principal)...');
    const configResponse = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('✅ CONFIG-V2 respondió correctamente:');
      if (configData.success && configData.data) {
        const data = configData.data;
        console.log(`   - Business ID: ${data.businessId}`);
        console.log(`   - Nombre Empresa: ${data.nombreEmpresa}`);
        console.log(`   - Banners: ${data.banners?.length || 0}`);
        console.log(`   - Promociones: ${data.promociones?.length || 0}`);
        console.log(`   - Favorito del día: ${data.favoritoDelDia ? 'Configurado' : 'No configurado'}`);
        console.log(`   - Recompensas: ${data.recompensas?.length || 0}`);
      }
    } else {
      console.log('❌ CONFIG-V2 falló:', configResponse.status, configResponse.statusText);
      const errorText = await configResponse.text();
      console.log('   Error details:', errorText);
    }

    console.log('\n🔍 6. VERIFICANDO HEADERS DE MIDDLEWARE...');
    console.log('Headers actuales del navegador:');
    const testResponse = await fetch(`${baseUrl}/api/portal/config-v2?businessId=${businessId}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-debug': 'true'
      },
      cache: 'no-store'
    });
    
    // Mostrar todos los headers de respuesta
    console.log('Response headers:');
    for (const [key, value] of testResponse.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseBrandingVsPortal();

// También crear función helper para verificar en consola
window.testPortalAPIs = diagnoseBrandingVsPortal;
console.log('\n💡 Tip: Puedes ejecutar testPortalAPIs() en cualquier momento para repetir el diagnóstico');
