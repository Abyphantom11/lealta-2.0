const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllTestData() {
  try {
    console.log('🗑️ Eliminando TODOS los datos de prueba...');
    
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    // Eliminar todas las recompensas de prueba (todas las actuales son de prueba)
    console.log('Eliminando todas las recompensas...');
    const deletedRecompensas = await prisma.portalRecompensa.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminadas ${deletedRecompensas.count} recompensas`);
    
    // Eliminar todas las promociones de prueba
    console.log('Eliminando todas las promociones...');
    const deletedPromociones = await prisma.portalPromocion.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminadas ${deletedPromociones.count} promociones`);
    
    // Eliminar todos los favoritos del día de prueba
    console.log('Eliminando todos los favoritos del día...');
    const deletedFavoritos = await prisma.portalFavoritoDelDia.deleteMany({
      where: { businessId }
    });
    console.log(`✅ Eliminados ${deletedFavoritos.count} favoritos del día`);
    
    // Eliminar banners duplicados, dejar solo uno
    console.log('Eliminando banners duplicados...');
    const banners = await prisma.portalBanner.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' }
    });
    
    if (banners.length > 1) {
      // Eliminar todos excepto el primero
      const bannersToDelete = banners.slice(1);
      for (const banner of bannersToDelete) {
        await prisma.portalBanner.delete({
          where: { id: banner.id }
        });
      }
      console.log(`✅ Eliminados ${bannersToDelete.length} banners duplicados`);
    }
    
    console.log('\n✨ Limpieza completada. Base de datos lista para configuraciones reales del usuario.');
    
    // Verificar estado final
    const finalRecompensas = await prisma.portalRecompensa.count({ where: { businessId } });
    const finalPromociones = await prisma.portalPromocion.count({ where: { businessId } });
    const finalFavoritos = await prisma.portalFavoritoDelDia.count({ where: { businessId } });
    const finalBanners = await prisma.portalBanner.count({ where: { businessId } });
    
    console.log('\n📊 Estado final:');
    console.log(`  - Recompensas: ${finalRecompensas}`);
    console.log(`  - Promociones: ${finalPromociones}`);
    console.log(`  - Favoritos del día: ${finalFavoritos}`);
    console.log(`  - Banners: ${finalBanners}`);
    
  } catch (error) {
    console.error('❌ Error eliminando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllTestData();
