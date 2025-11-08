const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminarHappyHour() {
  try {
    // Buscar el negocio Demo
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { name: { contains: 'Demo', mode: 'insensitive' } },
          { slug: 'demo-lealta' }
        ]
      }
    });

    if (!business) {
      console.log('❌ No se encontró el negocio Demo Lealta');
      return;
    }

    console.log('📊 Negocio encontrado:', business.name);

    // Buscar la promoción Happy Hour
    const happyHour = await prisma.portalPromocion.findFirst({
      where: {
        businessId: business.id,
        title: 'Happy Hour'
      }
    });

    if (!happyHour) {
      console.log('⚠️  No se encontró la promoción "Happy Hour"');
      return;
    }

    console.log('\n🎯 Promoción encontrada:');
    console.log(`   Título: ${happyHour.title}`);
    console.log(`   Descripción: ${happyHour.description}`);
    console.log(`   Día: ${happyHour.dia}`);
    console.log(`   ID: ${happyHour.id}`);

    // Eliminar la promoción
    await prisma.portalPromocion.delete({
      where: { id: happyHour.id }
    });

    console.log('\n✅ Promoción "Happy Hour" eliminada exitosamente');

    // Verificar promociones restantes
    const promocionesRestantes = await prisma.portalPromocion.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { orden: 'asc' }
    });

    console.log(`\n📋 Promociones restantes: ${promocionesRestantes.length}`);
    promocionesRestantes.forEach((promo, index) => {
      console.log(`${index + 1}. ${promo.title} (día: ${promo.dia || 'todos'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarHappyHour();
