/**
 * Script para ver todos los elementos existentes y eliminar los hardcodeados
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listarYEliminarTodos() {
  console.log('🔍 LISTANDO TODOS LOS ELEMENTOS EXISTENTES');
  console.log('=========================================');

  try {
    // Listar todos los banners
    console.log('\n📢 TODOS LOS BANNERS:');
    const banners = await prisma.portalBanner.findMany({
      select: {
        id: true,
        title: true,
        businessId: true,
        active: true,
        imageUrl: true,
        dia: true
      }
    });
    
    banners.forEach(b => {
      console.log(`  - "${b.title}" | Business: ${b.businessId} | Activo: ${b.active} | Día: ${b.dia} | Imagen: ${b.imageUrl ? '✅' : '❌'}`);
    });

    // Listar todas las promociones
    console.log('\n🎁 TODAS LAS PROMOCIONES:');
    const promociones = await prisma.portalPromocion.findMany({
      select: {
        id: true,
        title: true,
        businessId: true,
        active: true,
        imageUrl: true,
        dia: true
      }
    });
    
    promociones.forEach(p => {
      console.log(`  - "${p.title}" | Business: ${p.businessId} | Activo: ${p.active} | Día: ${p.dia} | Imagen: ${p.imageUrl ? '✅' : '❌'}`);
    });

    // Listar todos los favoritos
    console.log('\n⭐ TODOS LOS FAVORITOS:');
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      select: {
        id: true,
        productName: true,
        businessId: true,
        active: true,
        imageUrl: true,
        dia: true
      }
    });
    
    favoritos.forEach(f => {
      console.log(`  - "${f.productName}" | Business: ${f.businessId} | Activo: ${f.active} | Día: ${f.dia} | Imagen: ${f.imageUrl ? '✅' : '❌'}`);
    });

    // Eliminar todos los elementos de prueba (sin imágenes)
    console.log('\n🗑️ ELIMINANDO ELEMENTOS SIN IMÁGENES...');
    
    const bannersEliminados = await prisma.portalBanner.deleteMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });
    
    const promocionesEliminadas = await prisma.portalPromocion.deleteMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });
    
    const favoritosEliminados = await prisma.portalFavoritoDelDia.deleteMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });

    console.log(`✅ Eliminados ${bannersEliminados.count} banners sin imagen`);
    console.log(`✅ Eliminadas ${promocionesEliminadas.count} promociones sin imagen`);
    console.log(`✅ Eliminados ${favoritosEliminados.count} favoritos sin imagen`);

    // Verificar estado final
    console.log('\n📊 ESTADO FINAL:');
    const [totalBanners, totalPromociones, totalFavoritos] = await Promise.all([
      prisma.portalBanner.count(),
      prisma.portalPromocion.count(),
      prisma.portalFavoritoDelDia.count()
    ]);

    console.log(`   - Banners restantes: ${totalBanners}`);
    console.log(`   - Promociones restantes: ${totalPromociones}`);
    console.log(`   - Favoritos restantes: ${totalFavoritos}`);

    if (totalBanners + totalPromociones + totalFavoritos === 0) {
      console.log('\n✅ BASE DE DATOS LIMPIA');
      console.log('🎯 Ahora la nueva lógica unificada está lista para pruebas');
      console.log('🔧 Agrega elementos con imágenes desde el admin para probar');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listarYEliminarTodos();
