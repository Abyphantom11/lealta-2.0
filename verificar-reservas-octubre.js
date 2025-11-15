const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarReservasOctubre() {
  // Buscar promotor Antonio Salvador
  const promotor = await prisma.promotor.findFirst({
    where: {
      nombre: {
        contains: 'Antonio',
        mode: 'insensitive'
      }
    }
  });

  console.log('Promotor encontrado:', promotor);

  if (promotor) {
    const reservas = await prisma.reservation.findMany({
      where: {
        promotorId: promotor.id,
        reservedAt: {
          gte: new Date('2025-10-17T00:00:00Z'),
          lte: new Date('2025-10-31T23:59:59Z')
        }
      },
      include: {
        Cliente: true
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });

    console.log(`\n📋 Encontradas ${reservas.length} reservas en octubre para ${promotor.nombre}:\n`);
    reservas.forEach(r => {
      console.log(`- ${r.customerName} | ${new Date(r.reservedAt).toLocaleString('es-EC')} | Personas: ${r.guestCount} | ID: ${r.id}`);
    });
  }

  await prisma.$disconnect();
}

verificarReservasOctubre();
