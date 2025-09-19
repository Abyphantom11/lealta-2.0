/**
 * Script para crear datos de prueba para el carrusel/branding
 * Ejecutar después del reset de la base de datos
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBrandingData() {
  try {
    console.log('🎨 Creando datos de prueba para el branding/carrusel...');

    // 1. Buscar o crear un business de prueba
    let business = await prisma.business.findFirst({
      where: { slug: 'cafe-central' }
    });

    if (!business) {
      console.log('📋 Creando business de prueba...');
      business = await prisma.business.create({
        data: {
          name: 'Café Central',
          slug: 'cafe-central',
          subdomain: 'cafe-central',
          isActive: true,
          subscriptionPlan: 'BASIC'
        }
      });
      console.log(`✅ Business creado: ${business.name} (${business.id})`);
    } else {
      console.log(`✅ Business encontrado: ${business.name} (${business.id})`);
    }

    // 2. Eliminar banners existentes para empezar limpio
    await prisma.portalBanner.deleteMany({
      where: { businessId: business.id }
    });

    // 3. Crear banners de prueba para el carrusel
    const testBanners = [
      {
        title: 'Banner Principal',
        description: 'Banner carrusel 1',
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 0
      },
      {
        title: 'Promoción Especial',
        description: 'Banner carrusel 2', 
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 1
      },
      {
        title: 'Café del Día',
        description: 'Banner carrusel 3',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 2
      }
    ];

    for (const banner of testBanners) {
      await prisma.portalBanner.create({
        data: {
          businessId: business.id,
          title: banner.title,
          description: banner.description,
          imageUrl: banner.imageUrl,
          orden: banner.orden,
          active: true
        }
      });
    }

    console.log(`✅ ${testBanners.length} banners de prueba creados`);

    // 4. Verificar la API de branding
    console.log('\n🧪 Verificando API de branding...');
    
    const banners = await prisma.portalBanner.findMany({
      where: {
        businessId: business.id,
        active: true
      },
      orderBy: { orden: 'asc' }
    });

    const carouselImages = banners
      .filter(banner => banner.imageUrl)
      .map(banner => banner.imageUrl);

    console.log('📊 Resultado de la API:');
    console.log(`   - Business: ${business.name}`);
    console.log(`   - Banners activos: ${banners.length}`);
    console.log(`   - URLs del carrusel: ${carouselImages.length}`);
    
    carouselImages.forEach((url, index) => {
      console.log(`     ${index + 1}. ${url}`);
    });

    // 5. Crear configuración de tarjetas también
    await prisma.portalTarjetasConfig.upsert({
      where: { businessId: business.id },
      update: {},
      create: {
        businessId: business.id,
        showLevels: true,
        showProgress: true,
        showBenefits: true,
        showPointsInfo: true
      }
    });

    console.log('✅ Configuración de tarjetas creada');

    console.log('\n🎉 DATOS DE PRUEBA CREADOS EXITOSAMENTE');
    console.log(`\n🔗 Prueba el carrusel en: http://localhost:3001`);
    console.log(`📋 Business ID para pruebas: ${business.id}`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestBrandingData();
}

module.exports = { createTestBrandingData };
