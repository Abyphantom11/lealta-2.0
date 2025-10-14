// Script para corregir los banners y promociones con datos undefined
const { PrismaClient } = require('@prisma/client');

async function fixBannersData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CORRIGIENDO DATOS DE BANNERS Y PROMOCIONES');
    console.log('='.repeat(50));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Los registros específicos que encontramos
    const bannerId = 'cmgpk9oes000zeyysycuxkcjp';
    const promocionId = 'cmgpk9ok00011eyysngvl4fyy';
    
    // Corregir banner específico
    const bannerResult = await prisma.portalBanner.update({
      where: { id: bannerId },
      data: {
        title: 'Banner Casa Sabor Demo',
        description: 'Promoción especial de Casa Sabor',
        active: true,
        dia: 'lunes',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      }
    });
    
    console.log(`✅ Banner actualizado: ${bannerResult.title}`);
    
    // 2. Corregir promoción específica
    const promocionResult = await prisma.portalPromocion.update({
      where: { id: promocionId },
      data: {
        title: 'Promoción Especial Casa Sabor',
        description: 'Disfruta de nuestras promociones especiales todos los días',
        active: true,
        dia: 'lunes',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      }
    });
    
    console.log(`✅ Promoción actualizada: ${promocionResult.title}`);
    
    // 3. Verificar los datos corregidos
    const bannersCorregidos = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    
    const promocionesCorregidas = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log('\n📊 DATOS CORREGIDOS:');
    console.log(`\nBANNERS (${bannersCorregidos.length}):`);
    bannersCorregidos.forEach((banner, idx) => {
      console.log(`  ${idx + 1}. "${banner.title}"`);
      console.log(`     Activo: ${banner.active}`);
      console.log(`     Día: ${banner.dia}`);
      console.log(`     Imagen: ${banner.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`\nPROMOCIONES (${promocionesCorregidas.length}):`);
    promocionesCorregidas.forEach((promo, idx) => {
      console.log(`  ${idx + 1}. "${promo.title}"`);
      console.log(`     Activo: ${promo.active}`);
      console.log(`     Día: ${promo.dia}`);
      console.log(`     Imagen: ${promo.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log('\n🎯 AHORA LA API DEBERÍA FUNCIONAR CORRECTAMENTE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBannersData().catch(console.error);
