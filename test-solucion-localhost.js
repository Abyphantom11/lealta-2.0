#!/usr/bin/env node

/**
 * 🧪 PRUEBA RÁPIDA: VERIFICAR QUE TODO FUNCIONA EN LOCALHOST
 * 
 * Script para confirmar que la solución funciona antes de deploy
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function testLocalhost() {
  console.log('🧪 PRUEBA RÁPIDA EN LOCALHOST');
  console.log('='.repeat(45));
  
  try {
    // 1. PROBAR API CONFIG-V2
    console.log('\n📋 1. PROBANDO API CONFIG-V2');
    console.log('-'.repeat(35));
    
    const configUrl = `${BASE_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}`;
    console.log(`URL: ${configUrl}`);
    
    const response = await fetch(configUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'x-business-id': BUSINESS_ID
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Success: ${data.success}`);
    
    if (data.success && data.data) {
      console.log(`\n📊 CONTENIDO DEVUELTO:`);
      console.log(`   📢 Banners: ${data.data.banners?.length || 0}`);
      console.log(`   🎁 Promociones: ${data.data.promociones?.length || 0}`);
      console.log(`   ⭐ Favorito del día: ${data.data.favoritoDelDia ? 'SÍ' : 'NO'}`);
      
      if (data.data.banners?.length > 0) {
        console.log('\n   📢 BANNERS ENCONTRADOS:');
        data.data.banners.forEach((banner, idx) => {
          console.log(`      ${idx + 1}. "${banner.titulo}" | IMG: ${banner.imagenUrl ? '✅' : '❌'}`);
        });
      }
      
      if (data.data.promociones?.length > 0) {
        console.log('\n   🎁 PROMOCIONES ENCONTRADAS:');
        data.data.promociones.forEach((promo, idx) => {
          console.log(`      ${idx + 1}. "${promo.titulo}" | IMG: ${promo.imagenUrl ? '✅' : '❌'}`);
        });
      }
      
      if (data.data.favoritoDelDia) {
        console.log(`\n   ⭐ FAVORITO ENCONTRADO:`);
        console.log(`      "${data.data.favoritoDelDia.productName}" | IMG: ${data.data.favoritoDelDia.imageUrl ? '✅' : '❌'}`);
      }
      
      // 2. VERIFICAR QUE TODOS TIENEN IMÁGENES
      console.log('\n🔍 2. VERIFICACIÓN DE IMÁGENES');
      console.log('-'.repeat(35));
      
      const bannersConImagen = data.data.banners?.filter(b => b.imagenUrl) || [];
      const promocionesConImagen = data.data.promociones?.filter(p => p.imagenUrl) || [];
      const favoritoConImagen = data.data.favoritoDelDia?.imageUrl ? 1 : 0;
      
      console.log(`📢 Banners con imagen: ${bannersConImagen.length}/${data.data.banners?.length || 0}`);
      console.log(`🎁 Promociones con imagen: ${promocionesConImagen.length}/${data.data.promociones?.length || 0}`);
      console.log(`⭐ Favorito con imagen: ${favoritoConImagen}/1`);
      
      // 3. RESULTADO FINAL
      console.log('\n🎯 3. RESULTADO FINAL');
      console.log('-'.repeat(25));
      
      const todoTieneImagenes = 
        bannersConImagen.length === (data.data.banners?.length || 0) &&
        promocionesConImagen.length === (data.data.promociones?.length || 0) &&
        (!data.data.favoritoDelDia || data.data.favoritoDelDia.imageUrl);
      
      if (todoTieneImagenes && bannersConImagen.length > 0 && promocionesConImagen.length > 0) {
        console.log('🎉 ¡ÉXITO TOTAL!');
        console.log('✅ Todos los elementos tienen imágenes válidas');
        console.log('✅ La API devuelve todo correctamente');
        console.log('✅ El portal cliente debería mostrar todo');
        
        console.log('\n📱 PRÓXIMOS PASOS:');
        console.log('   1. Verificar en producción');
        console.log('   2. Si no aparece, revisar cache del navegador');
        console.log('   3. Verificar consola del navegador (F12)');
      } else {
        console.log('⚠️ AÚN HAY PROBLEMAS:');
        if (bannersConImagen.length === 0) console.log('   ❌ Faltan banners con imagen');
        if (promocionesConImagen.length === 0) console.log('   ❌ Faltan promociones con imagen');
        if (data.data.favoritoDelDia && !data.data.favoritoDelDia.imageUrl) console.log('   ❌ Favorito sin imagen');
      }
      
    } else {
      console.log('❌ API no devolvió datos válidos');
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Asegúrate de que el servidor local esté ejecutándose');
      console.log('   2. Ejecuta: npm run dev');
      console.log('   3. Espera a que esté listo en http://localhost:3001');
    }
  }
}

testLocalhost().catch(console.error);
