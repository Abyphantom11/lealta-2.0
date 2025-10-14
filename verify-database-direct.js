// Verificar directamente en la base de datos los datos de lunes
const { PrismaClient } = require('@prisma/client');

async function verifyDatabaseDirectly() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICACIÓN DIRECTA DE LA BASE DE DATOS');
    console.log('='.repeat(50));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // Verificar banners de lunes
    const bannersLunes = await prisma.portalBanner.findMany({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        dia: true,
        active: true
      }
    });
    
    console.log(`📊 BANNERS DE LUNES: ${bannersLunes.length}`);
    bannersLunes.forEach(banner => {
      console.log(`   - "${banner.title}" (activo: ${banner.active})`);
    });
    
    // Verificar promociones de lunes
    const promocionesLunes = await prisma.portalPromocion.findMany({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        discount: true,
        dia: true,
        active: true
      }
    });
    
    console.log(`\n📊 PROMOCIONES DE LUNES: ${promocionesLunes.length}`);
    promocionesLunes.forEach(promo => {
      console.log(`   - "${promo.title}" - ${promo.discount}% (activo: ${promo.active})`);
    });
    
    // Verificar favoritos de lunes
    const favoritosLunes = await prisma.portalFavoritoDelDia.findMany({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      },
      select: {
        id: true,
        productName: true,
        dia: true,
        active: true
      }
    });
    
    console.log(`\n📊 FAVORITOS DE LUNES: ${favoritosLunes.length}`);
    favoritosLunes.forEach(fav => {
      console.log(`   - "${fav.productName}" (activo: ${fav.active})`);
    });
    
    // Verificar el día actual que debería devolver la función
    const now = new Date();
    const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    console.log(`\n📅 DÍA ACTUAL CALCULADO: ${currentDay}`);
    
    if (currentDay === 'lunes') {
      console.log('✅ El día coincide. Los datos deberían aparecer en la API');
    } else {
      console.log(`⚠️ El día no coincide. La API busca datos para: ${currentDay}`);
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log(`   BusinessId: ${businessId}`);
    console.log(`   Día de la semana: ${currentDay}`);
    console.log(`   Banners disponibles: ${bannersLunes.length}`);
    console.log(`   Promociones disponibles: ${promocionesLunes.length}`);
    console.log(`   Favoritos disponibles: ${favoritosLunes.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseDirectly().catch(console.error);
