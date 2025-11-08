const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarPromociones() {
  try {
    // Buscar el negocio Demo
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo', mode: 'insensitive' } },
          { slug: 'demo-lealta' },
          { subdomain: 'demo-lealta.lealta.app' }
        ]
      }
    });

    if (!business) {
      console.log('❌ No se encontró el negocio Demo Lealta');
      return;
    }

    console.log('📊 Negocio encontrado:');
    console.log(`   Nombre: ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Subdomain: ${business.subdomain}`);

    // Buscar promociones
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: business.id },
      orderBy: { orden: 'asc' }
    });

    console.log(`\n🎁 Promociones encontradas: ${promociones.length}`);
    
    if (promociones.length === 0) {
      console.log('\n⚠️  NO HAY PROMOCIONES CREADAS para este negocio');
      console.log('   Necesitas crear promociones desde el panel de Admin > Portal Cliente');
    } else {
      console.log('\nDetalles:');
      promociones.forEach((promo, index) => {
        console.log(`\n${index + 1}. ${promo.title}`);
        console.log(`   - ID: ${promo.id}`);
        console.log(`   - Activo: ${promo.active ? '✅ Sí' : '❌ No'}`);
        console.log(`   - Día: ${promo.dia || 'todos'}`);
        console.log(`   - Descuento: ${promo.discount || 'N/A'}`);
        console.log(`   - Descripción: ${promo.description || 'Sin descripción'}`);
        console.log(`   - Orden: ${promo.orden}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPromociones();
