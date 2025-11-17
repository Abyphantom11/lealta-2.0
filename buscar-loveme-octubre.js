const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarLoveMeSky() {
  // Buscar el negocio Love Me Sky
  const business = await prisma.business.findFirst({
    where: {
      name: {
        contains: 'Love Me',
        mode: 'insensitive'
      }
    }
  });

  console.log('Negocio encontrado:', business);

  if (business) {
    // Buscar promotores de este negocio
    const promotores = await prisma.promotor.findMany({
      where: {
        businessId: business.id
      }
    });

    console.log(`\n📋 Promotores de ${business.name}:`);
    for (const promotor of promotores) {
      console.log(`  - ${promotor.nombre} (ID: ${promotor.id})`);
    }

    // Buscar reservas de octubre
    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: new Date('2025-10-01T00:00:00Z'),
          lte: new Date('2025-10-31T23:59:59Z')
        }
      },
      include: {
        Promotor: true,
        Cliente: true
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });

    console.log(`\n📅 Reservas de octubre (${reservas.length} total):\n`);
    for (const r of reservas) {
      console.log(`${new Date(r.reservedAt).toLocaleString('es-EC')} | ${r.customerName} | Promotor: ${r.Promotor?.nombre || 'N/A'} | Personas: ${r.guestCount} | ID: ${r.id}`);
    }
  }

  await prisma.$disconnect();
}

buscarLoveMeSky();
