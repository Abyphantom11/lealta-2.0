// Script para encontrar TODOS los datos del portal en la base de datos
// Incluyendo datos que puedan estar en otras tablas o con diferentes estados

const { PrismaClient } = require('@prisma/client');

async function findAllPortalData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 BUSCANDO TODOS LOS DATOS DEL PORTAL EN LA BASE DE DATOS');
    console.log('='.repeat(70));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Buscar en PortalBanner (incluso inactivos o con diferentes businessId)
    console.log('📊 1. REVISANDO TABLA PortalBanner...');
    
    // Todos los banners de este business (activos e inactivos)
    const allBanners = await prisma.portalBanner.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Banners para businessId ${businessId}: ${allBanners.length}`);
    
    // Buscar si hay banners con businessId diferente (por error)
    const bannersOtherBusiness = await prisma.portalBanner.findMany({
      where: { 
        businessId: { not: businessId }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Banners con otros businessId: ${bannersOtherBusiness.length}`);
    if (bannersOtherBusiness.length > 0) {
      console.log('   📋 Ejemplos de otros businessId:');
      bannersOtherBusiness.forEach(banner => {
        console.log(`      - BusinessId: ${banner.businessId} | Title: "${banner.title}"`);
      });
    }
    
    // 2. Buscar en PortalPromocion
    console.log('\n📊 2. REVISANDO TABLA PortalPromocion...');
    
    const allPromociones = await prisma.portalPromocion.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Promociones para businessId ${businessId}: ${allPromociones.length}`);
    
    const promocionesOtherBusiness = await prisma.portalPromocion.findMany({
      where: { 
        businessId: { not: businessId }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Promociones con otros businessId: ${promocionesOtherBusiness.length}`);
    if (promocionesOtherBusiness.length > 0) {
      console.log('   📋 Ejemplos de otros businessId:');
      promocionesOtherBusiness.forEach(promo => {
        console.log(`      - BusinessId: ${promo.businessId} | Title: "${promo.title}"`);
      });
    }
    
    // 3. Buscar en PortalFavoritoDelDia
    console.log('\n📊 3. REVISANDO TABLA PortalFavoritoDelDia...');
    
    const allFavoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Favoritos del día para businessId ${businessId}: ${allFavoritos.length}`);
    
    // 4. Verificar si el businessId es correcto
    console.log('\n🔍 4. VERIFICANDO BUSINESS ID...');
    
    // Buscar el business en la tabla Business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, nombre: true, slug: true }
    });
    
    if (business) {
      console.log(`   ✅ Business encontrado: "${business.nombre}" (slug: ${business.slug})`);
    } else {
      console.log(`   ❌ Business NO encontrado con ID: ${businessId}`);
      
      // Buscar businesses similares
      const similarBusinesses = await prisma.business.findMany({
        where: {
          OR: [
            { nombre: { contains: 'Casa', mode: 'insensitive' } },
            { nombre: { contains: 'Sabor', mode: 'insensitive' } },
            { slug: { contains: 'casa', mode: 'insensitive' } }
          ]
        },
        select: { id: true, nombre: true, slug: true },
        take: 5
      });
      
      console.log('   📋 Businesses similares encontrados:');
      similarBusinesses.forEach(biz => {
        console.log(`      - ID: ${biz.id} | Nombre: "${biz.nombre}" | Slug: ${biz.slug}`);
      });
    }
    
    // 5. Buscar datos con el día actual
    console.log('\n📅 5. BUSCANDO DATOS PARA HOY (LUNES)...');
    
    const bannersHoy = await prisma.portalBanner.findMany({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      }
    });
    
    const promocionesHoy = await prisma.portalPromocion.findMany({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      }
    });
    
    console.log(`   Banners activos para lunes: ${bannersHoy.length}`);
    console.log(`   Promociones activas para lunes: ${promocionesHoy.length}`);
    
    if (bannersHoy.length > 0) {
      console.log('   📋 Banners de lunes:');
      bannersHoy.forEach(banner => {
        console.log(`      - "${banner.title}" (activo: ${banner.active})`);
      });
    }
    
    if (promocionesHoy.length > 0) {
      console.log('   📋 Promociones de lunes:');
      promocionesHoy.forEach(promo => {
        console.log(`      - "${promo.title}" (activo: ${promo.active})`);
      });
    }
    
    // 6. CONCLUSIÓN
    console.log('\n🎯 ANÁLISIS:');
    if (allBanners.length === 0 && allPromociones.length === 0 && allFavoritos.length === 0) {
      console.log('❌ NO hay datos configurados para este businessId');
      console.log('💡 Posibles causas:');
      console.log('   1. Los datos están en otro businessId');
      console.log('   2. Los datos no se guardaron correctamente desde el admin');
      console.log('   3. Hay un problema en el flujo de guardado del admin');
    } else {
      console.log('✅ HAY datos configurados pero no aparecen en la API');
      console.log('💡 Posibles causas:');
      console.log('   1. Problema en la consulta de la API');
      console.log('   2. Filtro de día incorrecto');
      console.log('   3. Estado "active" incorrecto');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllPortalData().catch(console.error);
