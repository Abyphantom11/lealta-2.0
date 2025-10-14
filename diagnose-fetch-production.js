/**
 * 🔍 DIAGNÓSTICO ESPECÍFICO: Problema de Fetch en Producción
 * Identifica por qué los banners/promociones/favoritos no aparecen en el cliente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseFetchProduction() {
  console.log('🔍 DIAGNÓSTICO: PROBLEMA DE FETCH EN PRODUCCIÓN');
  console.log('='.repeat(55));
  
  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. VERIFICAR DATOS EN BD (que sabemos que existen)
    console.log('\n📊 1. DATOS EN BASE DE DATOS');
    console.log('-'.repeat(35));
    
    const banners = await prisma.portalBanner.findMany({
      where: { businessId, active: true }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId, active: true }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId, active: true }
    });
    
    console.log(`✅ Banners activos en BD: ${banners.length}`);
    console.log(`✅ Promociones activas en BD: ${promociones.length}`);
    console.log(`✅ Favoritos activos en BD: ${favoritos.length}`);
    
    // 2. SIMULAR LLAMADA API SIN HEADER (como en producción)
    console.log('\n🌐 2. SIMULANDO LLAMADA API SIN x-business-id HEADER');
    console.log('-'.repeat(60));
    
    try {
      const fetch = require('node-fetch');
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const apiUrl = `${baseUrl}/api/portal/config-v2?businessId=${businessId}`;
      
      console.log(`📞 Llamando: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
          // 🚨 SIN x-business-id header - como está pasando en producción
        }
      });
      
      const data = await response.json();
      
      console.log(`📋 Status: ${response.status}`);
      console.log(`📋 Success: ${data.success}`);
      
      if (data.success && data.data) {
        console.log(`📢 Banners en respuesta: ${data.data.banners?.length || 0}`);
        console.log(`🎁 Promociones en respuesta: ${data.data.promociones?.length || 0}`);
        console.log(`⭐ Favorito en respuesta: ${data.data.favoritoDelDia ? 'Sí' : 'No'}`);
        
        if (data.data.banners?.length > 0) {
          console.log('   📢 Banners encontrados:');
          data.data.banners.forEach((banner, idx) => {
            console.log(`      ${idx + 1}. "${banner.titulo}" (día: ${banner.dia})`);
          });
        }
        
        if (data.data.promociones?.length > 0) {
          console.log('   🎁 Promociones encontradas:');
          data.data.promociones.forEach((promo, idx) => {
            console.log(`      ${idx + 1}. "${promo.titulo}" (día: ${promo.dia})`);
          });
        }
        
        if (data.data.favoritoDelDia) {
          console.log(`   ⭐ Favorito: "${data.data.favoritoDelDia.productName}"`);
        }
      } else {
        console.log(`❌ Error en API: ${data.error || 'Sin datos'}`);
      }
      
    } catch (fetchError) {
      console.log(`❌ Error en fetch: ${fetchError.message}`);
    }
    
    // 3. VERIFICAR SI EL PROBLEMA ES EL MIDDLEWARE
    console.log('\n🔧 3. ANÁLISIS DEL PROBLEMA DE MIDDLEWARE');
    console.log('-'.repeat(50));
    
    console.log('🔍 El problema identificado:');
    console.log('   1. ❌ Middleware actual (emergency) NO configura x-business-id header');
    console.log('   2. ❌ API config-v2 depende de getBusinessIdFromRequest()');
    console.log('   3. ❌ getBusinessIdFromRequest() busca x-business-id header');
    console.log('   4. ❌ Sin header, businessId = null → usa "default"');
    console.log('   5. ❌ "default" no tiene datos → respuesta vacía');
    
    // 4. SOLUCIONES PROPUESTAS
    console.log('\n💡 4. SOLUCIONES PARA PRODUCCIÓN');
    console.log('-'.repeat(40));
    
    console.log('🔧 SOLUCIÓN 1: Arreglar middleware (RECOMENDADO)');
    console.log('   - Restaurar middleware.complex.ts que SÍ configura headers');
    console.log('   - O modificar middleware.ts actual para añadir headers');
    
    console.log('\n🔧 SOLUCIÓN 2: Arreglar API (RÁPIDO)');
    console.log('   - Modificar config-v2 para usar query param como fallback');
    console.log('   - Sin cambios en middleware');
    
    console.log('\n🔧 SOLUCIÓN 3: Arreglar cliente (TEMPORAL)');
    console.log('   - Cliente incluye businessId en todas las llamadas');
    console.log('   - Headers adicionales si es necesario');
    
    // 5. COMANDO DE VERIFICACIÓN
    console.log('\n🧪 5. VERIFICACIÓN EN NAVEGADOR');
    console.log('-'.repeat(40));
    
    console.log('Ejecuta esto en la consola del navegador en producción:');
    console.log('```javascript');
    console.log('// Verificar si la API responde correctamente');
    console.log(`fetch('/api/portal/config-v2?businessId=${businessId}')`);
    console.log('  .then(r => r.json())');
    console.log('  .then(data => {');
    console.log('    console.log("🔍 RESULTADO DEL FETCH:");');
    console.log('    console.log("Success:", data.success);');
    console.log('    console.log("Banners:", data.data?.banners?.length || 0);');
    console.log('    console.log("Promociones:", data.data?.promociones?.length || 0);');
    console.log('    console.log("Favorito:", data.data?.favoritoDelDia ? "Sí" : "No");');
    console.log('    console.log("BusinessId usado:", data.data?.businessId);');
    console.log('    if (data.data?.banners?.length === 0) {');
    console.log('      console.log("❌ PROBLEMA: Sin banners - revisar businessId");');
    console.log('    }');
    console.log('  })');
    console.log('  .catch(err => console.error("❌ Error:", err));');
    console.log('```');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseFetchProduction().catch(console.error);
