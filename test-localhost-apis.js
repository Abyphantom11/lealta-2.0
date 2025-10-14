#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBAS LOCALHOST
 * 
 * Prueba las APIs en desarrollo local para verificar
 * que los cambios de centralización funcionan
 */

const fetch = require('node-fetch');

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';
const LOCAL_URL = 'http://localhost:3000';

async function testLocalAPI(endpoint, headers = {}) {
  const url = `${LOCAL_URL}${endpoint}`;
  console.log(`\n🌐 Testing: ${url}`);
  console.log(`📋 Headers:`, headers);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (diagnostic script)',
        'Cache-Control': 'no-cache',
        ...headers
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log(`❌ Error Response`);
      const errorText = await response.text();
      console.log(`Error body:`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Response:`, JSON.stringify(data, null, 2));
    
    // Análisis específico para banners
    if (endpoint.includes('banners') && data.banners) {
      console.log(`🎯 Análisis de banners:`);
      console.log(`   Total banners: ${data.banners.length}`);
      data.banners.forEach((banner, idx) => {
        console.log(`   ${idx + 1}. "${banner.titulo || banner.title}" (día: ${banner.dia})`);
      });
    }
    
    // Análisis específico para config-v2
    if (endpoint.includes('config-v2') && data.data) {
      console.log(`🎯 Análisis de config-v2:`);
      const configData = data.data;
      console.log(`   Banners: ${configData.banners?.length || 0}`);
      console.log(`   Promociones: ${configData.promociones?.length || 0}`);
      console.log(`   Favorito del día: ${configData.favoritoDelDia ? 'SÍ' : 'NO'}`);
      console.log(`   Recompensas: ${configData.recompensas?.length || 0}`);
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Conexión rechazada: El servidor local no está ejecutándose`);
      console.log(`💡 Ejecuta: npm run dev`);
    } else {
      console.log(`❌ Network Error:`, error.message);
    }
    return null;
  }
}

async function main() {
  console.log('🧪 PRUEBAS EN LOCALHOST');
  console.log('========================\n');
  
  console.log('⚠️  IMPORTANTE: Asegúrate de que el servidor esté ejecutándose con "npm run dev"\n');
  
  // Test 1: API banners individual
  console.log('📋 TEST 1: API Banners individual');
  console.log('─'.repeat(40));
  const bannersResult = await testLocalAPI(`/api/portal/banners?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Test 2: API config-v2 (debería incluir banners filtrados)
  console.log('\n📋 TEST 2: API Config-v2 (banners incluidos)');
  console.log('─'.repeat(40));
  const configResult = await testLocalAPI(`/api/portal/config-v2?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Test 3: API promociones
  console.log('\n📋 TEST 3: API Promociones');
  console.log('─'.repeat(40));
  const promocionesResult = await testLocalAPI(`/api/portal/promociones?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Test 4: API favorito del día
  console.log('\n📋 TEST 4: API Favorito del día');
  console.log('─'.repeat(40));
  const favoritoResult = await testLocalAPI(`/api/portal/favorito-del-dia?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Análisis comparativo
  console.log('\n🎯 ANÁLISIS COMPARATIVO:');
  console.log('─'.repeat(40));
  
  if (bannersResult && configResult) {
    const bannersFromAPI = bannersResult.banners?.length || 0;
    const bannersFromConfig = configResult.data?.banners?.length || 0;
    
    console.log(`Banners desde API individual: ${bannersFromAPI}`);
    console.log(`Banners desde Config-v2: ${bannersFromConfig}`);
    
    if (bannersFromAPI === bannersFromConfig && bannersFromAPI > 0) {
      console.log(`✅ ÉXITO: Ambas APIs devuelven la misma cantidad de banners`);
    } else if (bannersFromAPI === 0 && bannersFromConfig === 0) {
      console.log(`⚠️  ADVERTENCIA: Ninguna API devuelve banners (problema de filtrado por día)`);
    } else {
      console.log(`❌ INCONSISTENCIA: Las APIs devuelven diferentes cantidades`);
    }
  }
  
  // Instrucciones finales
  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('─'.repeat(40));
  
  if (!bannersResult && !configResult) {
    console.log('1. Ejecutar: npm run dev');
    console.log('2. Volver a ejecutar este script: node test-localhost-apis.js');
  } else if (bannersResult?.banners?.length > 0) {
    console.log('✅ Las APIs funcionan correctamente en localhost');
    console.log('📤 Siguiente paso: Deployar a producción');
    console.log('   git checkout main');
    console.log('   git merge optimization/edge-requests-reduce-90-percent');
    console.log('   git push origin main');
  } else {
    console.log('🔧 Los banners no aparecen, necesitamos debug adicional');
    console.log('💡 Verificar lógica de día comercial y filtrado');
  }
  
  console.log('\n🌐 URLS PARA PROBAR MANUALMENTE:');
  console.log('─'.repeat(40));
  console.log(`Portal cliente: ${LOCAL_URL}/${BUSINESS_ID}/cliente`);
  console.log(`API banners: ${LOCAL_URL}/api/portal/banners?businessId=${BUSINESS_ID}`);
  console.log(`API config-v2: ${LOCAL_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}`);
}

main().catch(console.error);
