// Buscar datos con el businessId incorrecto que se usaba antes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findMisplacedPortalData() {
  try {
    console.log('🔍 Buscando datos con businessId incorrecto...');
    
    const wrongBusinessId = 'cmfqhepmq0000ey4slyms4knv'; // El ID incorrecto que se usaba
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u'; // El ID correcto
    
    console.log(`\n❌ Buscando con ID incorrecto: ${wrongBusinessId}`);
    console.log(`✅ ID correcto debería ser: ${correctBusinessId}`);
    
    // 1. BANNERS con ID incorrecto
    const bannersWrong = await prisma.portalBanner.findMany({
      where: { businessId: wrongBusinessId }
    });
    console.log(`\n🏷️ BANNERS con ID incorrecto: ${bannersWrong.length}`);
    if (bannersWrong.length > 0) {
      bannersWrong.forEach((banner, i) => {
        console.log(`    ${i+1}. "${banner.titulo}" (${banner.dia})`);
      });
    }

    // 2. PROMOCIONES con ID incorrecto
    const promocionesWrong = await prisma.portalPromocion.findMany({
      where: { businessId: wrongBusinessId }
    });
    console.log(`\n🎁 PROMOCIONES con ID incorrecto: ${promocionesWrong.length}`);
    if (promocionesWrong.length > 0) {
      promocionesWrong.forEach((promo, i) => {
        console.log(`    ${i+1}. "${promo.titulo}" (${promo.dia})`);
      });
    }

    // 3. RECOMPENSAS con ID incorrecto
    const recompensasWrong = await prisma.portalRecompensa.findMany({
      where: { businessId: wrongBusinessId }
    });
    console.log(`\n🎁 RECOMPENSAS con ID incorrecto: ${recompensasWrong.length}`);
    if (recompensasWrong.length > 0) {
      recompensasWrong.forEach((recompensa, i) => {
        console.log(`    ${i+1}. "${recompensa.title}" - ${recompensa.pointsCost} puntos`);
      });
    }

    // 4. FAVORITOS DEL DÍA con ID incorrecto
    const favoritosWrong = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: wrongBusinessId }
    });
    console.log(`\n⭐ FAVORITOS DEL DÍA con ID incorrecto: ${favoritosWrong.length}`);
    if (favoritosWrong.length > 0) {
      favoritosWrong.forEach((fav, i) => {
        console.log(`    ${i+1}. "${fav.productName}" (${fav.dia})`);
      });
    }

    // 5. También buscar datos con slug 'arepa' como businessId
    console.log(`\n🔍 Buscando con slug 'arepa' como businessId...`);
    
    const bannersSlug = await prisma.portalBanner.findMany({
      where: { businessId: 'arepa' }
    });
    const promocionesSlug = await prisma.portalPromocion.findMany({
      where: { businessId: 'arepa' }
    });
    const recompensasSlug = await prisma.portalRecompensa.findMany({
      where: { businessId: 'arepa' }
    });
    const favoritosSlug = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: 'arepa' }
    });

    console.log(`🏷️ BANNERS con 'arepa': ${bannersSlug.length}`);
    console.log(`🎁 PROMOCIONES con 'arepa': ${promocionesSlug.length}`);
    console.log(`🎁 RECOMPENSAS con 'arepa': ${recompensasSlug.length}`);
    console.log(`⭐ FAVORITOS con 'arepa': ${favoritosSlug.length}`);

    // RESUMEN
    const totalWrongId = bannersWrong.length + promocionesWrong.length + recompensasWrong.length + favoritosWrong.length;
    const totalSlug = bannersSlug.length + promocionesSlug.length + recompensasSlug.length + favoritosSlug.length;

    console.log('\n📊 RESUMEN BÚSQUEDA:');
    console.log(`  - Datos con ID incorrecto (${wrongBusinessId}): ${totalWrongId}`);
    console.log(`  - Datos con slug 'arepa': ${totalSlug}`);

    if (totalWrongId > 0) {
      console.log('\n🔧 SOLUCIÓN: Migrar datos del businessId incorrecto al correcto');
    } else if (totalSlug > 0) {
      console.log('\n🔧 SOLUCIÓN: Migrar datos del slug al businessId correcto');
    } else {
      console.log('\n🎯 CONCLUSIÓN: NO HAY DATOS PERDIDOS - Las configuraciones del portal están vacías');
      console.log('   Probablemente nunca se configuraron, o el admin las está creando vacías');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findMisplacedPortalData();
