// Script para verificar banners específicamente para Casa Sabor Demo
const { PrismaClient } = require('@prisma/client');

async function checkBannersDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO BANNERS EN LA BASE DE DATOS');
    console.log('='.repeat(50));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Verificar business existe
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      console.log('❌ Business no encontrado');
      return;
    }
    
    console.log(`✅ Business encontrado: ${business.name} (${business.slug})`);
    
    // 2. Verificar banners
    const banners = await prisma.portalBanner.findMany({
      where: { businessId }
    });
    
    console.log(`\n📊 BANNERS TOTALES: ${banners.length}`);
    
    if (banners.length > 0) {
      banners.forEach((banner, idx) => {
        console.log(`\n${idx + 1}. Banner: "${banner.titulo}"`);
        console.log(`   ID: ${banner.id}`);
        console.log(`   BusinessId: ${banner.businessId}`);
        console.log(`   Activo: ${banner.activo}`);
        console.log(`   Días: ${banner.diasSemana}`);
        console.log(`   Imagen: ${banner.imagenUrl || 'NO TIENE'}`);
        console.log(`   Creado: ${banner.createdAt}`);
      });
    }
    
    // 3. Verificar promociones
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId }
    });
    
    console.log(`\n🎯 PROMOCIONES TOTALES: ${promociones.length}`);
    
    if (promociones.length > 0) {
      promociones.forEach((promo, idx) => {
        console.log(`\n${idx + 1}. Promoción: "${promo.titulo}"`);
        console.log(`   ID: ${promo.id}`);
        console.log(`   BusinessId: ${promo.businessId}`);
        console.log(`   Activo: ${promo.activo}`);
        console.log(`   Días: ${promo.diasSemana}`);
        console.log(`   Imagen: ${promo.imagenUrl || 'NO TIENE'}`);
        console.log(`   Creado: ${promo.createdAt}`);
      });
    }
    
    // 4. Día actual para comparar
    const now = new Date();
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const currentDay = dayNames[now.getDay()];
    
    console.log(`\n📅 DÍA ACTUAL: ${currentDay}`);
    
    // 5. Filtrar por día actual
    const bannersHoy = banners.filter(b => 
      b.activo && b.diasSemana && b.diasSemana.includes(currentDay)
    );
    
    const promocionesHoy = promociones.filter(p => 
      p.activo && p.diasSemana && p.diasSemana.includes(currentDay)
    );
    
    console.log(`\n🎯 ELEMENTOS PARA HOY (${currentDay}):`);
    console.log(`   Banners: ${bannersHoy.length}`);
    console.log(`   Promociones: ${promocionesHoy.length}`);
    
    if (bannersHoy.length > 0) {
      console.log('\n   📊 BANNERS ACTIVOS HOY:');
      bannersHoy.forEach((banner, idx) => {
        console.log(`      ${idx + 1}. "${banner.titulo}" - Imagen: ${banner.imagenUrl ? '✅' : '❌'}`);
      });
    }
    
    if (promocionesHoy.length > 0) {
      console.log('\n   🎯 PROMOCIONES ACTIVAS HOY:');
      promocionesHoy.forEach((promo, idx) => {
        console.log(`      ${idx + 1}. "${promo.titulo}" - Imagen: ${promo.imagenUrl ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBannersDatabase().catch(console.error);
