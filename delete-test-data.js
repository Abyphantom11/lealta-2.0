const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTestData() {
  try {
    console.log('🗑️ Eliminando datos de prueba...');
    
    const businessId = 'cmfqhepmq0000ey4slyms4knv'; // arepa business
    
    // Eliminar datos de prueba específicos
    console.log('Eliminando recompensas de prueba...');
    const deletedRecompensas = await prisma.portalRecompensa.deleteMany({
      where: {
        businessId,
        OR: [
          { title: '🎁 Recompensa de Prueba' },
          { title: { contains: 'Prueba' } },
          { description: { contains: 'datos de prueba' } }
        ]
      }
    });
    console.log(`✅ Eliminadas ${deletedRecompensas.count} recompensas de prueba`);
    
    console.log('Eliminando promociones de prueba...');
    const deletedPromociones = await prisma.portalPromocion.deleteMany({
      where: {
        businessId,
        OR: [
          { title: '🔥 Promoción de Prueba' },
          { title: { contains: 'Prueba' } },
          { description: { contains: 'datos de prueba' } }
        ]
      }
    });
    console.log(`✅ Eliminadas ${deletedPromociones.count} promociones de prueba`);
    
    console.log('Eliminando favoritos del día de prueba...');
    const deletedFavoritos = await prisma.portalFavoritoDelDia.deleteMany({
      where: {
        businessId,
        OR: [
          { productName: '⭐ Favorito de Prueba' },
          { productName: { contains: 'Prueba' } },
          { description: { contains: 'datos de prueba' } }
        ]
      }
    });
    console.log(`✅ Eliminados ${deletedFavoritos.count} favoritos del día de prueba`);
    
    // Verificar datos reales existentes
    console.log('\n📊 Verificando datos reales del usuario...');
    
    const recompensasReales = await prisma.portalRecompensa.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        description: true,
        pointsCost: true,
        active: true,
        imageUrl: true
      }
    });
    
    const promocionesReales = await prisma.portalPromocion.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        description: true,
        active: true,
        imageUrl: true
      }
    });
    
    const favoritosReales = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      select: {
        id: true,
        productName: true,
        description: true,
        active: true,
        imageUrl: true
      }
    });
    
    console.log(`\n🎯 Recompensas reales encontradas: ${recompensasReales.length}`);
    recompensasReales.forEach(r => {
      console.log(`  - ${r.title} (${r.pointsCost} pts, activo: ${r.active})`);
    });
    
    console.log(`\n🔥 Promociones reales encontradas: ${promocionesReales.length}`);
    promocionesReales.forEach(p => {
      console.log(`  - ${p.title} (activo: ${p.active})`);
    });
    
    console.log(`\n⭐ Favoritos del día reales encontrados: ${favoritosReales.length}`);
    favoritosReales.forEach(f => {
      console.log(`  - ${f.productName} (activo: ${f.active})`);
    });
    
    console.log('\n✨ Limpieza completada. Solo quedan los datos reales del usuario.');
    
  } catch (error) {
    console.error('❌ Error eliminando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestData();
