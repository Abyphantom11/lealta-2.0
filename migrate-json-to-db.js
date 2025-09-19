const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateJsonToDatabase() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔄 Migrando datos del archivo JSON a la base de datos PostgreSQL...');
    
    // Leer el archivo JSON del admin
    const jsonPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    console.log('📄 Datos encontrados en JSON:');
    console.log(`  - Banners: ${jsonData.banners?.length || 0}`);
    console.log(`  - Promociones: ${jsonData.promociones?.length || 0}`);
    console.log(`  - Recompensas: ${jsonData.recompensas?.length || 0}`);
    console.log(`  - Favoritos del día: ${jsonData.favoritoDelDia?.length || 0}`);
    
    let migratedCount = 0;
    
    // Migrar BANNERS
    if (jsonData.banners && jsonData.banners.length > 0) {
      console.log('\n🎨 Migrando banners...');
      for (let i = 0; i < jsonData.banners.length; i++) {
        const banner = jsonData.banners[i];
        await prisma.portalBanner.create({
          data: {
            businessId,
            title: banner.titulo || banner.title || `Banner ${i + 1}`,
            description: banner.descripcion || banner.description || '',
            imageUrl: banner.imagenUrl || banner.imageUrl || null,
            active: banner.activo !== undefined ? banner.activo : (banner.isActive || true),
            orden: i
          }
        });
        console.log(`  ✅ ${banner.titulo || banner.title}`);
        migratedCount++;
      }
    }
    
    // Migrar PROMOCIONES
    if (jsonData.promociones && jsonData.promociones.length > 0) {
      console.log('\n🔥 Migrando promociones...');
      for (let i = 0; i < jsonData.promociones.length; i++) {
        const promo = jsonData.promociones[i];
        await prisma.portalPromocion.create({
          data: {
            businessId,
            title: promo.titulo || promo.title || `Promoción ${i + 1}`,
            description: promo.descripcion || promo.description || '',
            imageUrl: promo.imagenUrl || promo.imageUrl || null,
            discount: promo.descuento ? `${promo.descuento}%` : (promo.discount || null),
            active: promo.activo !== undefined ? promo.activo : (promo.isActive || true),
            orden: i
          }
        });
        console.log(`  ✅ ${promo.titulo || promo.title}`);
        migratedCount++;
      }
    }
    
    // Migrar RECOMPENSAS
    if (jsonData.recompensas && jsonData.recompensas.length > 0) {
      console.log('\n🎁 Migrando recompensas...');
      for (let i = 0; i < jsonData.recompensas.length; i++) {
        const reward = jsonData.recompensas[i];
        await prisma.portalRecompensa.create({
          data: {
            businessId,
            title: reward.nombre || reward.title || `Recompensa ${i + 1}`,
            description: reward.descripcion || reward.description || '',
            imageUrl: reward.imagenUrl || reward.imageUrl || null,
            pointsCost: reward.puntosRequeridos || reward.pointsCost || 100,
            active: reward.activo !== undefined ? reward.activo : (reward.isActive || true),
            orden: i
          }
        });
        console.log(`  ✅ ${reward.nombre || reward.title} (${reward.puntosRequeridos || reward.pointsCost} pts)`);
        migratedCount++;
      }
    }
    
    // Migrar FAVORITOS DEL DÍA
    if (jsonData.favoritoDelDia && jsonData.favoritoDelDia.length > 0) {
      console.log('\n⭐ Migrando favoritos del día...');
      for (let i = 0; i < jsonData.favoritoDelDia.length; i++) {
        const fav = jsonData.favoritoDelDia[i];
        await prisma.portalFavoritoDelDia.create({
          data: {
            businessId,
            productName: fav.nombre || fav.productName || `Favorito ${i + 1}`,
            description: fav.descripcion || fav.description || '',
            imageUrl: fav.imagenUrl || fav.imageUrl || null,
            active: fav.activo !== undefined ? fav.activo : (fav.isActive || true)
          }
        });
        console.log(`  ✅ ${fav.nombre || fav.productName}`);
        migratedCount++;
      }
    }
    
    console.log(`\n✨ Migración completada! ${migratedCount} elementos migrados.`);
    
    // Verificar resultado
    const finalCount = {
      banners: await prisma.portalBanner.count({ where: { businessId } }),
      promociones: await prisma.portalPromocion.count({ where: { businessId } }),
      recompensas: await prisma.portalRecompensa.count({ where: { businessId } }),
      favoritos: await prisma.portalFavoritoDelDia.count({ where: { businessId } })
    };
    
    console.log('\n📊 Estado final en base de datos:');
    console.log(`  - Banners: ${finalCount.banners}`);
    console.log(`  - Promociones: ${finalCount.promociones}`);
    console.log(`  - Recompensas: ${finalCount.recompensas}`);
    console.log(`  - Favoritos del día: ${finalCount.favoritos}`);
    
  } catch (error) {
    console.error('❌ Error migrando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateJsonToDatabase();
