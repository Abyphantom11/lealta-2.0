const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminDataLoad() {
  try {
    console.log('✅ Conectado a PostgreSQL con Prisma');

    // 1. Probar el businessId correcto que ahora usa el admin
    const correctBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    console.log(`\n🔍 Probando datos para businessId: ${correctBusinessId}`);
    
    // 2. Query para BrandingConfig (lo que usa /api/branding)
    const brandingConfig = await prisma.brandingConfig.findUnique({
      where: { businessId: correctBusinessId }
    });
    
    console.log('\n🎨 BRANDING CONFIG ENCONTRADO:');
    if (brandingConfig) {
      console.log(`  ✅ businessName: ${brandingConfig.businessName}`);
      console.log(`  ✅ primaryColor: ${brandingConfig.primaryColor}`);
      console.log(`  ✅ carouselImages: ${brandingConfig.carouselImages ? brandingConfig.carouselImages.length : 0} imágenes`);
      console.log(`  ✅ logoUrl: ${brandingConfig.logoUrl ? 'Configurado' : 'No configurado'}`);
    } else {
      console.log('  ❌ No se encontró BrandingConfig');
    }

    // 3. Query para PortalBanner (lo que usa /api/admin/portal-config)
    const banners = await prisma.portalBanner.findMany({
      where: { businessId: correctBusinessId }
    });
    
    console.log('\n🏷️ PORTAL BANNER:');
    if (banners.length > 0) {
      console.log(`  ✅ Encontrados ${banners.length} banners`);
      banners.forEach((banner, i) => {
        console.log(`    Banner ${i+1}: ${banner.titulo} (activo: ${banner.activo})`);
      });
    } else {
      console.log('  ❌ No se encontraron banners');
    }

    // 4. Query para PortalPromocion
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: correctBusinessId }
    });
    
    console.log('\n🎁 PORTAL PROMOCIONES:');
    if (promociones.length > 0) {
      console.log(`  ✅ Encontradas ${promociones.length} promociones`);
      promociones.forEach((promo, i) => {
        console.log(`    Promo ${i+1}: ${promo.titulo} (activa: ${promo.activa})`);
      });
    } else {
      console.log('  ❌ No se encontraron promociones');
    }

    console.log('\n🎯 RESUMEN:');
    console.log(`- BrandingConfig: ${brandingConfig ? '✅ EXISTE' : '❌ FALTA'}`);
    console.log(`- Portal Banners: ${banners.length} encontrados`);
    console.log(`- Portal Promociones: ${promociones.length} encontradas`);

    if (brandingConfig) {
      console.log('\n🚀 EL ADMIN AHORA DEBERÍA CARGAR:');
      console.log(`  - Nombre del negocio: "${brandingConfig.businessName}"`);
      console.log(`  - Color primario: ${brandingConfig.primaryColor}`);
      console.log(`  - ${brandingConfig.carouselImages?.length || 0} imágenes de carousel`);
    }

  } catch (error) {
    console.error('❌ Error en test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminDataLoad();
