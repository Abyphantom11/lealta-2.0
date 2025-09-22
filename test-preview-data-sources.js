#!/usr/bin/env node

/**
 * Test específico para comparar Banner vs Favorito del Día en vista previa
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPreviewDataSources() {
  console.log('🔬 TEST: BANNER vs FAVORITO DEL DÍA - FUENTES DE DATOS EN VISTA PREVIA');
  console.log('='.repeat(70));
  
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true },
      take: 2
    });
    
    for (const business of businesses) {
      console.log(`\n🏢 BUSINESS: ${business.name} (${business.id})`);
      console.log('-'.repeat(50));
      
      // 1. Verificar BANNERS en BD
      const banners = await prisma.portalBanner.findMany({
        where: { businessId: business.id, active: true }
      });
      console.log(`📑 BANNERS EN BD: ${banners.length}`);
      banners.forEach((banner, i) => {
        console.log(`   ${i+1}. "${banner.title}" - Día: ${banner.dia || 'todos'} - ${banner.active ? '🟢' : '🔴'}`);
      });
      
      // 2. Verificar FAVORITOS DEL DÍA en BD  
      const favoritos = await prisma.portalFavoritoDelDia.findMany({
        where: { businessId: business.id, active: true }
      });
      console.log(`⭐ FAVORITOS EN BD: ${favoritos.length}`);
      favoritos.forEach((fav, i) => {
        console.log(`   ${i+1}. "${fav.productName}" - Día: ${fav.dia || 'todos'} - ${fav.active ? '🟢' : '🔴'}`);
      });
      
      // 3. Verificar API config-v2 (lo que ve el cliente)
      try {
        const clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${business.id}`);
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          
          console.log(`📱 API CLIENTE (config-v2):`);
          console.log(`   Banners: ${clientData.banners?.length || 0}`);
          console.log(`   Favoritos: ${clientData.favoritoDelDia?.length || 0}`);
          
          // Comparar datos
          console.log(`🔄 COMPARACIÓN BD vs API CLIENTE:`);
          console.log(`   Banners: BD=${banners.length}, API=${clientData.banners?.length || 0} ${banners.length === (clientData.banners?.length || 0) ? '✅' : '❌'}`);
          console.log(`   Favoritos: BD=${favoritos.length}, API=${clientData.favoritoDelDia?.length || 0} ${favoritos.length === (clientData.favoritoDelDia?.length || 0) ? '✅' : '❌'}`);
          
        } else {
          console.log(`   ❌ Error API Cliente: ${clientResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error consultando API Cliente`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🔍 ANÁLISIS DEL PROBLEMA:');
    console.log('');
    console.log('1. 📊 FUENTE DE DATOS EN VISTA PREVIA ADMIN:');
    console.log('   - Banners: 🔄 AHORA usa previewData (BD) + fallback config');
    console.log('   - Favoritos: ❌ SOLO usa config (estado local)');
    console.log('');
    console.log('2. 🎯 PROBLEMA IDENTIFICADO:');
    console.log('   - Vista previa INCONSISTENTE entre elementos');
    console.log('   - Banners: BD real vs Favoritos: estado local');
    console.log('');
    console.log('3. ✅ SOLUCIÓN:');
    console.log('   - Aplicar misma lógica previewData a TODOS los elementos');
    console.log('   - O simplificar: recargar config completo desde BD');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testPreviewDataSources();
}

module.exports = { testPreviewDataSources };
