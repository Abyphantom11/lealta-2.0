#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS LOCAL VS PRODUCCIÓN
 * 
 * Compara qué devuelven las APIs en localhost vs producción
 */

const fetch = require('node-fetch');

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function testEndpoint(baseUrl, endpoint, name) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`\n📋 ${name}`);
  console.log(`URL: ${url}`);
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (test script)',
        'Cache-Control': 'no-cache',
        'x-business-id': BUSINESS_ID
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText.substring(0, 200)}`);
      return null;
    }
    
    const data = await response.json();
    
    // Análisis específico
    if (endpoint.includes('banners')) {
      const banners = data.banners || [];
      console.log(`📊 Banners: ${banners.length} encontrados`);
      banners.forEach((banner, idx) => {
        console.log(`   ${idx + 1}. "${banner.titulo || banner.title}" (día: ${banner.dia || 'sin día'})`);
      });
    }
    
    if (endpoint.includes('promociones')) {
      const promociones = data.promociones || [];
      console.log(`📊 Promociones: ${promociones.length} encontradas`);
      promociones.forEach((promo, idx) => {
        console.log(`   ${idx + 1}. "${promo.title}" (día: ${promo.dia || 'sin día'})`);
      });
    }
    
    if (endpoint.includes('favorito-del-dia')) {
      const favorito = data.favoritoDelDia;
      console.log(`📊 Favorito del día: ${favorito ? favorito.productName : 'NINGUNO'}`);
      if (favorito) {
        console.log(`   Día: ${favorito.dia || 'sin día'}`);
      }
    }
    
    if (endpoint.includes('config-v2')) {
      const configData = data.data || data;
      console.log(`📊 Config-v2:`);
      console.log(`   Banners: ${configData.banners?.length || 0}`);
      console.log(`   Promociones: ${configData.promociones?.length || 0}`);
      console.log(`   Favorito: ${configData.favoritoDelDia ? 'SÍ' : 'NO'}`);
      console.log(`   Recompensas: ${configData.recompensas?.length || 0}`);
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Servidor local no ejecutándose`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
    return null;
  }
}

async function main() {
  console.log('🔍 ANÁLISIS: LOCALHOST vs PRODUCCIÓN');
  console.log('====================================\n');
  
  // URLs a probar - agregando más posibles URLs de producción
  const testUrls = [
    { name: 'LOCALHOST', url: 'http://localhost:3000' },
    { name: 'PRODUCCIÓN 1', url: 'https://lealta.vercel.app' },
    { name: 'PRODUCCIÓN 2', url: 'https://lealta-mvp.vercel.app' }, 
    { name: 'PRODUCCIÓN 3', url: 'https://lealta-2-0.vercel.app' },
    { name: 'PRODUCCIÓN 4', url: 'https://lealta-2-0-six.vercel.app' },
    { name: 'CLOUDFLARE', url: 'https://beijing-restructuring-covering-easily.trycloudflare.com' }
  ];
  
  for (const testUrl of testUrls) {
    console.log(`\n🌐 PROBANDO: ${testUrl.name} (${testUrl.url})`);
    console.log('='.repeat(80));
    
    // Probar cada endpoint
    await testEndpoint(testUrl.url, `/api/portal/banners?businessId=${BUSINESS_ID}`, 'API Banners');
    await testEndpoint(testUrl.url, `/api/portal/promociones?businessId=${BUSINESS_ID}`, 'API Promociones');
    await testEndpoint(testUrl.url, `/api/portal/favorito-del-dia?businessId=${BUSINESS_ID}`, 'API Favorito del Día');
    await testEndpoint(testUrl.url, `/api/portal/config-v2?businessId=${BUSINESS_ID}`, 'API Config-v2');
  }
  
  console.log('\n🎯 INSTRUCCIONES:');
  console.log('─'.repeat(50));
  console.log('1. Si localhost funciona, el problema es de deployment');
  console.log('2. Si ninguna URL de producción funciona, necesitamos encontrar la URL correcta');
  console.log('3. Si los arrays están vacíos pero la API responde, es problema de filtrado');
  console.log('4. Cloudflare puede ser la URL actual de producción del screenshot');
}

main().catch(console.error);
