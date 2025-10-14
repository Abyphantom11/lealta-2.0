// Verificar TODOS los datos del businessId sin filtros
const { PrismaClient } = require('@prisma/client');

async function verifyAllBusinessData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICANDO TODOS LOS DATOS SIN FILTROS');
    console.log('='.repeat(50));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds';
    
    // Todos los banners (sin filtro de día)
    const allBanners = await prisma.portalBanner.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        dia: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 TODOS LOS BANNERS: ${allBanners.length}`);
    allBanners.forEach(banner => {
      console.log(`   - "${banner.title}" | Día: ${banner.dia} | Activo: ${banner.active} | Creado: ${banner.createdAt}`);
    });
    
    // Todas las promociones
    const allPromociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      select: {
        id: true,
        title: true,
        dia: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📊 TODAS LAS PROMOCIONES: ${allPromociones.length}`);
    allPromociones.forEach(promo => {
      console.log(`   - "${promo.title}" | Día: ${promo.dia} | Activo: ${promo.active} | Creado: ${promo.createdAt}`);
    });
    
    // Todos los favoritos
    const allFavoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      select: {
        id: true,
        productName: true,
        dia: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📊 TODOS LOS FAVORITOS: ${allFavoritos.length}`);
    allFavoritos.forEach(fav => {
      console.log(`   - "${fav.productName}" | Día: ${fav.dia} | Activo: ${fav.active} | Creado: ${fav.createdAt}`);
    });
    
    // Verificar si hay datos en otras tablas con diferentes nombres
    console.log('\n🔍 VERIFICANDO TABLAS ALTERNATIVAS...');
    
    try {
      const alternativeBanners = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "PortalBanner" WHERE "businessId" = ${businessId}
      `;
      console.log(`   PortalBanner (raw query): ${alternativeBanners[0]?.count || 0}`);
    } catch (e) {
      console.log('   PortalBanner raw query failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllBusinessData().catch(console.error);
