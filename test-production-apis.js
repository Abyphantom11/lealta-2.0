#!/usr/bin/env node

/**
 * 🧪 PRUEBAS EN VIVO: APIs de Producción
 * 
 * Prueba las APIs en producción para ver exactamente qué responden
 */

const fetch = require('node-fetch');

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';
const PRODUCTION_URL = 'https://lealta-2-0-six.vercel.app';

async function testAPI(endpoint, headers = {}) {
  const url = `${PRODUCTION_URL}${endpoint}`;
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
    
    return data;
  } catch (error) {
    console.log(`❌ Network Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 PRUEBAS EN VIVO: APIs de Producción');
  console.log('=====================================\n');
  
  // Test 1: API banners sin headers
  console.log('📋 TEST 1: API Banners sin headers');
  console.log('─'.repeat(40));
  await testAPI(`/api/portal/banners?businessId=${BUSINESS_ID}`);
  
  // Test 2: API banners con header
  console.log('\n📋 TEST 2: API Banners con header x-business-id');
  console.log('─'.repeat(40));
  await testAPI(`/api/portal/banners?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Test 3: Config v2 sin headers
  console.log('\n📋 TEST 3: API Config-v2 sin headers');
  console.log('─'.repeat(40));
  await testAPI(`/api/portal/config-v2?businessId=${BUSINESS_ID}`);
  
  // Test 4: Config v2 con header
  console.log('\n📋 TEST 4: API Config-v2 con header x-business-id');
  console.log('─'.repeat(40));
  await testAPI(`/api/portal/config-v2?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  // Test 5: Branding (que sabemos que funciona)
  console.log('\n📋 TEST 5: API Branding (referencia que funciona)');
  console.log('─'.repeat(40));
  await testAPI(`/api/branding?businessId=${BUSINESS_ID}`, {
    'x-business-id': BUSINESS_ID
  });
  
  console.log('\n🎯 ANÁLISIS COMPARATIVO:');
  console.log('─'.repeat(40));
  console.log('Si branding funciona pero banners/config-v2 no,');
  console.log('entonces el problema está en la lógica específica');
  console.log('de filtrado o en la implementación de las APIs.');
}

main().catch(console.error);
