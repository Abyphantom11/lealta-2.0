// Script para verificar TODOS los banners y promociones en la base de datos
const { PrismaClient } = require('@prisma/client');

async function checkAllPortalData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO TODOS LOS DATOS DEL PORTAL');
    console.log('='.repeat(60));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Verificar TODOS los banners (incluso inactivos)
    const allBanners = await prisma.portalBanner.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 TODOS LOS BANNERS EN LA BD: ${allBanners.length}`);
    
    if (allBanners.length > 0) {
      allBanners.forEach((banner, idx) => {
        console.log(`\n${idx + 1}. Banner:`);
        console.log(`   ID: ${banner.id}`);
        console.log(`   Title: "${banner.title}"`);
        console.log(`   Description: "${banner.description || 'NO TIENE'}"`);
        console.log(`   ImageURL: ${banner.imageUrl || 'NO TIENE'}`);
        console.log(`   Día: ${banner.dia || 'NO ESPECIFICADO'}`);
        console.log(`   Activo: ${banner.active}`);
        console.log(`   Orden: ${banner.orden}`);
        console.log(`   Creado: ${banner.createdAt}`);
        console.log(`   Actualizado: ${banner.updatedAt}`);
      });
    }
    
    // 2. Verificar TODAS las promociones
    const allPromociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n🎯 TODAS LAS PROMOCIONES EN LA BD: ${allPromociones.length}`);
    
    if (allPromociones.length > 0) {
      allPromociones.forEach((promo, idx) => {
        console.log(`\n${idx + 1}. Promoción:`);
        console.log(`   ID: ${promo.id}`);
        console.log(`   Title: "${promo.title}"`);
        console.log(`   Description: "${promo.description || 'NO TIENE'}"`);
        console.log(`   ImageURL: ${promo.imageUrl || 'NO TIENE'}`);
        console.log(`   Discount: ${promo.discount || 'NO TIENE'}`);
        console.log(`   Día: ${promo.dia || 'NO ESPECIFICADO'}`);
        console.log(`   Activo: ${promo.active}`);
        console.log(`   Orden: ${promo.orden}`);
        console.log(`   Creado: ${promo.createdAt}`);
        console.log(`   Actualizado: ${promo.updatedAt}`);
      });
    }
    
    // 3. Verificar si hay datos en otras tablas relacionadas
    console.log('\n🔍 VERIFICANDO OTRAS TABLAS...');
    
    // Revisar si hay datos en tablas con nombres diferentes
    const tablesInfo = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%banner%' OR table_name LIKE '%promo%' OR table_name LIKE '%portal%'
      ORDER BY table_name;
    `;
    
    console.log('📋 Tablas relacionadas encontradas:');
    console.log(tablesInfo);
    
    console.log('\n🎯 ANÁLISIS:');
    console.log(`- Banners encontrados: ${allBanners.length}`);
    console.log(`- Promociones encontradas: ${allPromociones.length}`);
    console.log('- Si hay datos pero parecen hardcodeados, significa que se sobrescribieron los datos del admin');
    console.log('- Necesitamos verificar si hay backups o datos originales del admin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPortalData().catch(console.error);
