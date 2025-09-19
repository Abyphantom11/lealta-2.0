const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingPortalItems() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔄 Actualizando banners y favoritos existentes con campo dia...');
    
    // 1. Actualizar banners
    const banners = await prisma.portalBanner.findMany({
      where: { 
        businessId,
        dia: null
      }
    });
    
    console.log(`📊 Banners a actualizar: ${banners.length}`);
    
    for (const banner of banners) {
      console.log(`🎨 Actualizando banner: ${banner.title}`);
      
      await prisma.portalBanner.update({
        where: { id: banner.id },
        data: { 
          dia: 'viernes' // Asignar viernes como día por defecto
        }
      });
      
      console.log(`✅ Banner "${banner.title}" ahora está asignado a viernes`);
    }
    
    // 2. Actualizar favoritos del día
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { 
        businessId,
        dia: null
      }
    });
    
    console.log(`\n📊 Favoritos del día a actualizar: ${favoritos.length}`);
    
    for (const favorito of favoritos) {
      console.log(`⭐ Actualizando favorito: ${favorito.productName}`);
      
      await prisma.portalFavoritoDelDia.update({
        where: { id: favorito.id },
        data: { 
          dia: 'viernes' // Asignar viernes como día por defecto
        }
      });
      
      console.log(`✅ Favorito "${favorito.productName}" ahora está asignado a viernes`);
    }
    
    console.log('\n🎉 ¡Todos los elementos han sido actualizados!');
    
    // 3. Verificar el resultado final
    console.log('\n📋 Estado final:');
    
    const bannersFinales = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    console.log('\n🎨 Banners:');
    bannersFinales.forEach(b => {
      console.log(`  - ${b.title}: ${b.dia}`);
    });
    
    const favoritosFinales = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId }
    });
    console.log('\n⭐ Favoritos del día:');
    favoritosFinales.forEach(f => {
      console.log(`  - ${f.productName}: ${f.dia}`);
    });
    
    const promocionesFinales = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    console.log('\n🔥 Promociones:');
    promocionesFinales.forEach(p => {
      console.log(`  - ${p.title}: ${p.dia}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingPortalItems();
