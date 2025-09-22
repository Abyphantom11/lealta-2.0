#!/usr/bin/env node

/**
 * Test final: Verificar que TODOS los elementos usan datos reales de BD en vista previa
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalPreviewTest() {
  console.log('🎯 TEST FINAL: VISTA PREVIA ADMIN USA DATOS REALES DE BD');
  console.log('='.repeat(60));
  
  try {
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true },
      take: 2
    });
    
    for (const business of businesses) {
      console.log(`\n🏢 ${business.name} (${business.id})`);
      console.log('-'.repeat(40));
      
      // Obtener datos de BD
      const [banners, promociones, recompensas, favoritos] = await Promise.all([
        prisma.portalBanner.findMany({
          where: { businessId: business.id, active: true }
        }),
        prisma.portalPromocion.findMany({
          where: { businessId: business.id, active: true }
        }),
        prisma.portalRecompensa.findMany({
          where: { businessId: business.id, active: true }
        }),
        prisma.portalFavoritoDelDia.findMany({
          where: { businessId: business.id, active: true }
        })
      ]);
      
      console.log(`📊 DATOS EN BASE DE DATOS:`);
      console.log(`   📑 Banners: ${banners.length}`);
      console.log(`   🔥 Promociones: ${promociones.length}`);
      console.log(`   🎁 Recompensas: ${recompensas.length}`);
      console.log(`   ⭐ Favoritos: ${favoritos.length}`);
      
      // Verificar API config-v2 (que usará la vista previa)
      try {
        const response = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${business.id}`);
        if (response.ok) {
          const apiData = await response.json();
          
          console.log(`📱 API CONFIG-V2 (Vista Previa):`);
          console.log(`   📑 Banners: ${apiData.banners?.length || 0}`);
          console.log(`   🔥 Promociones: ${apiData.promociones?.length || 0}`);
          console.log(`   🎁 Recompensas: ${apiData.recompensas?.length || 0}`);
          console.log(`   ⭐ Favoritos: ${apiData.favoritoDelDia?.length || 0}`);
          
          console.log(`🔄 SINCRONIZACIÓN BD ↔ VISTA PREVIA:`);
          console.log(`   📑 Banners: ${banners.length === (apiData.banners?.length || 0) ? '✅ SYNC' : '❌ DESYNC'}`);
          console.log(`   🔥 Promociones: ${promociones.length === (apiData.promociones?.length || 0) ? '✅ SYNC' : '❌ DESYNC'}`);
          console.log(`   🎁 Recompensas: ${recompensas.length === (apiData.recompensas?.length || 0) ? '✅ SYNC' : '❌ DESYNC'}`);
          console.log(`   ⭐ Favoritos: ${favoritos.length === (apiData.favoritoDelDia?.length || 0) ? '✅ SYNC' : '❌ DESYNC'}`);
          
        } else {
          console.log(`   ❌ Error API: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error consultando API`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESUMEN DE CAMBIOS IMPLEMENTADOS:');
    console.log('');
    console.log('1. 🔄 Vista previa admin ahora usa previewData desde BD para:');
    console.log('   - ✅ Banners (bannersReales = previewData?.banners || config.banners)');
    console.log('   - ✅ Promociones (promocionesReales = previewData?.promociones || config.promociones)');
    console.log('   - ✅ Recompensas (recompensasReales = previewData?.recompensas || config.recompensas)');
    console.log('   - ✅ Favoritos (favoritosReales = previewData?.favoritoDelDia || config.favoritoDelDia)');
    console.log('');
    console.log('2. 🔄 Auto-refresh cada 10 segundos en modo portal');
    console.log('3. 🔄 Recarga inmediata después de operaciones CRUD');
    console.log('4. 🔄 Fallback a estado local si BD no disponible');
    console.log('');
    console.log('🧪 PRÓXIMOS PASOS PARA PROBAR:');
    console.log('1. Abrir admin portal');
    console.log('2. Agregar/editar cualquier elemento (banner, promoción, etc.)');
    console.log('3. Verificar que aparezca INMEDIATAMENTE en vista previa');
    console.log('4. Cambiar día simulado y verificar filtros');
    console.log('5. Verificar que cliente también se actualice');
    
  } catch (error) {
    console.error('❌ Error en test final:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  finalPreviewTest();
}

module.exports = { finalPreviewTest };
