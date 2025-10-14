#!/usr/bin/env node

/**
 * 🔍 DEBUG: Flujo completo API → Frontend
 * Ya sabemos que BD tiene los datos, pero no llegan al cliente
 */

async function debugFlowAPItaFrontend() {
  console.log('🔍 DEBUG: FLUJO API → FRONTEND');
  console.log('='.repeat(50));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    // 1. TEST: API config-v2 directa
    console.log('\n📡 1. API config-v2 DIRECTA');
    console.log('-'.repeat(30));
    
    const configResponse = await fetch(`https://lealta.vercel.app/api/portal/config-v2?businessId=${businessId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`Status: ${configResponse.status}`);
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      
      console.log('✅ Config-v2 respuesta:');
      console.log(`   - Success: ${configData.success}`);
      console.log(`   - Has data: ${!!configData.data}`);
      
      if (configData.data) {
        console.log(`   - Banners: ${configData.data.banners?.length || 0}`);
        console.log(`   - Promociones: ${configData.data.promociones?.length || 0}`);
        console.log(`   - Favorito: ${!!configData.data.favoritoDelDia}`);
        console.log(`   - Source: ${configData.data.source}`);
        console.log(`   - Business ID: ${configData.data.businessId}`);
        
        // Mostrar estructura exacta
        if (configData.data.banners?.length > 0) {
          const banner = configData.data.banners[0];
          console.log('\n   📢 PRIMER BANNER:');
          console.log(`      - titulo: "${banner.titulo}"`);
          console.log(`      - activo: ${banner.activo}`);
          console.log(`      - imagenUrl: ${banner.imagenUrl ? 'SÍ' : 'NO'}`);
          console.log(`      - dia: ${banner.dia}`);
        }
        
        if (configData.data.promociones?.length > 0) {
          const promo = configData.data.promociones[0];
          console.log('\n   🎁 PRIMERA PROMOCIÓN:');
          console.log(`      - titulo: "${promo.titulo}"`);
          console.log(`      - activo: ${promo.activo}`);
          console.log(`      - imagenUrl: ${promo.imagenUrl || 'NO'}`);
          console.log(`      - dia: ${promo.dia}`);
        }
        
        if (configData.data.favoritoDelDia) {
          const fav = configData.data.favoritoDelDia;
          console.log('\n   ⭐ FAVORITO DEL DÍA:');
          console.log(`      - productName: "${fav.productName}"`);
          console.log(`      - activo: ${fav.activo}`);
          console.log(`      - imageUrl: ${fav.imageUrl ? 'SÍ' : 'NO'}`);
          console.log(`      - dia: ${fav.dia}`);
        }
      }
    } else {
      console.log('❌ Error en config-v2:', await configResponse.text());
    }
    
    // 2. TEST: APIs individuales
    console.log('\n📡 2. APIs INDIVIDUALES');
    console.log('-'.repeat(30));
    
    // Test banners API
    const bannersResponse = await fetch(`https://lealta.vercel.app/api/portal/banners?businessId=${businessId}`);
    if (bannersResponse.ok) {
      const bannersData = await bannersResponse.json();
      console.log(`📢 API Banners: ${bannersData.banners?.length || 0} banners`);
    } else {
      console.log(`❌ API Banners error: ${bannersResponse.status}`);
    }
    
    // Test promociones API
    const promocionesResponse = await fetch(`https://lealta.vercel.app/api/portal/promociones?businessId=${businessId}`);
    if (promocionesResponse.ok) {
      const promocionesData = await promocionesResponse.json();
      console.log(`🎁 API Promociones: ${promocionesData.promociones?.length || 0} promociones`);
    } else {
      console.log(`❌ API Promociones error: ${promocionesResponse.status}`);
    }
    
    // Test favorito API
    const favoritoResponse = await fetch(`https://lealta.vercel.app/api/portal/favorito-del-dia?businessId=${businessId}`);
    if (favoritoResponse.ok) {
      const favoritoData = await favoritoResponse.json();
      console.log(`⭐ API Favorito: ${favoritoData.favoritoDelDia ? 'SÍ' : 'NO'} favorito`);
    } else {
      console.log(`❌ API Favorito error: ${favoritoResponse.status}`);
    }
    
    // 3. ANÁLISIS DEL PROBLEMA
    console.log('\n🎯 3. ANÁLISIS DEL PROBLEMA');
    console.log('-'.repeat(30));
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      
      if (!configData.success) {
        console.log('❌ PROBLEMA: API config-v2 devuelve success=false');
      } else if (!configData.data) {
        console.log('❌ PROBLEMA: API config-v2 no tiene campo data');
      } else if (configData.data.banners?.length === 0 && configData.data.promociones?.length === 0 && !configData.data.favoritoDelDia) {
        console.log('❌ PROBLEMA: API config-v2 devuelve arrays vacíos');
        console.log('   💡 Posibles causas:');
        console.log('      - Filtros de día comercial muy restrictivos');
        console.log('      - Diferencia de zona horaria servidor vs cliente');
        console.log('      - Lógica de getCurrentBusinessDay incorrecta');
      } else {
        console.log('✅ API config-v2 devuelve datos correctos');
        console.log('❌ PROBLEMA: Debe estar en el frontend/hook useAutoRefreshPortalConfig');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error.message);
  }
}

debugFlowAPItaFrontend().catch(console.error);
