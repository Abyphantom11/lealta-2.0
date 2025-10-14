/**
 * Script para eliminar promociones y banners hardcodeados de prueba
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function eliminarElementosHardcodeados() {
  console.log('🗑️ ELIMINANDO ELEMENTOS HARDCODEADOS DE PRUEBA');
  console.log('==============================================');

  try {
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // casa-sabor-demo
    
    // Eliminar banners
    console.log('\n📢 ELIMINANDO BANNERS...');
    const bannersEliminados = await prisma.portalBanner.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminados ${bannersEliminados.count} banners`);

    // Eliminar promociones
    console.log('\n🎁 ELIMINANDO PROMOCIONES...');
    const promocionesEliminadas = await prisma.portalPromocion.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminadas ${promocionesEliminadas.count} promociones`);

    // Eliminar favoritos del día si existen
    console.log('\n⭐ ELIMINANDO FAVORITOS DEL DÍA...');
    const favoritosEliminados = await prisma.portalFavoritoDelDia.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminados ${favoritosEliminados.count} favoritos del día`);

    // Verificar que todo esté limpio
    console.log('\n🔍 VERIFICANDO LIMPIEZA...');
    const [banners, promociones, favoritos] = await Promise.all([
      prisma.portalBanner.count({ where: { businessId } }),
      prisma.portalPromocion.count({ where: { businessId } }),
      prisma.portalFavoritoDelDia.count({ where: { businessId } })
    ]);

    console.log(`📊 Estado final para ${businessId}:`);
    console.log(`   - Banners: ${banners}`);
    console.log(`   - Promociones: ${promociones}`);
    console.log(`   - Favoritos: ${favoritos}`);

    if (banners + promociones + favoritos === 0) {
      console.log('\n✅ LIMPIEZA COMPLETADA');
      console.log('🔧 Ahora puedes probar agregando elementos con imágenes desde el admin');
      console.log('🌐 URL admin: http://localhost:3001/casa-sabor-demo/admin');
    } else {
      console.log('\n⚠️ Aún quedan algunos elementos');
    }

  } catch (error) {
    console.error('❌ Error eliminando elementos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarElementosHardcodeados();
