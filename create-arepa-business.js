/**
 * Script para crear datos de prueba para el business "arepa"
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createArepaBusinessData() {
  try {
    console.log('🫓 Creando datos para el business "arepa"...');

    // 1. Buscar o crear el business "arepa"
    let business = await prisma.business.findFirst({
      where: { 
        OR: [
          { slug: 'arepa' },
          { subdomain: 'arepa' }
        ]
      }
    });

    if (!business) {
      console.log('📋 Creando business "arepa"...');
      business = await prisma.business.create({
        data: {
          name: 'Arepa Deliciosa',
          slug: 'arepa',
          subdomain: 'arepa',
          isActive: true,
          subscriptionPlan: 'BASIC'
        }
      });
      console.log(`✅ Business "arepa" creado: ${business.name} (${business.id})`);
    } else {
      console.log(`✅ Business "arepa" encontrado: ${business.name} (${business.id})`);
    }

    // 2. Eliminar banners existentes para empezar limpio
    await prisma.portalBanner.deleteMany({
      where: { businessId: business.id }
    });

    // 3. Crear banners temáticos de arepas para el carrusel
    const arepaBanners = [
      {
        title: 'Arepas Artesanales',
        description: 'Banner carrusel 1',
        imageUrl: 'https://images.unsplash.com/photo-1582169296194-021d503a9e2a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 0
      },
      {
        title: 'Especialidad de la Casa',
        description: 'Banner carrusel 2', 
        imageUrl: 'https://images.unsplash.com/photo-1567459439049-9a4e53a40cb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 1
      },
      {
        title: 'Arepas Rellenas',
        description: 'Banner carrusel 3',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        orden: 2
      }
    ];

    for (const banner of arepaBanners) {
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

    console.log(`✅ ${arepaBanners.length} banners de arepa creados`);

    // 4. Crear configuración de tarjetas
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

    console.log('✅ Configuración de tarjetas creada para arepa');

    // 5. Crear algunas promociones también
    await prisma.portalPromocion.create({
      data: {
        businessId: business.id,
        title: '2x1 en Arepas',
        description: 'Promoción especial en arepas rellenas',
        discount: '50%',
        active: true,
        orden: 0
      }
    });

    console.log('✅ Promoción de prueba creada');

    console.log('\n🎉 DATOS PARA "AREPA" CREADOS EXITOSAMENTE');
    console.log(`📋 Business ID: ${business.id}`);
    console.log(`🔗 Subdomain: ${business.subdomain}`);
    console.log(`🎨 Nombre: ${business.name}`);

    return business;

  } catch (error) {
    console.error('❌ Error creando datos para arepa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createArepaBusinessData();
}

module.exports = { createArepaBusinessData };
