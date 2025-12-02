const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePendingToDropped() {
  const startNov = new Date('2025-11-01T00:00:00.000Z');
  const endNov = new Date('2025-12-01T00:00:00.000Z');
  
  // Primero buscar las pendientes de Love Me Sky en noviembre
  const pending = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      reservedAt: {
        gte: startNov,
        lt: endNov
      },
      ReservationSlot: {
        ReservationService: {
          Business: {
            name: { contains: 'Love Me Sky', mode: 'insensitive' }
          }
        }
      }
    },
    include: {
      ReservationSlot: {
        include: {
          ReservationService: {
            include: {
              Business: { select: { name: true } }
            }
          }
        }
      }
    },
    orderBy: { reservedAt: 'asc' }
  });
  
  console.log('=== RESERVAS PENDIENTES - LOVE ME SKY - NOVIEMBRE 2025 ===');
  console.log('Total encontradas:', pending.length);
  console.log('');
  
  if (pending.length === 0) {
    console.log('No hay reservas pendientes de noviembre para actualizar.');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Detalle:');
  for (const r of pending) {
    const fecha = r.reservedAt.toISOString().split('T')[0];
    console.log(`- ${fecha} | ${r.customerName} | ${r.guestCount} pax | ID: ${r.id}`);
  }
  
  console.log('\n--- ACTUALIZANDO A DROPPED ---\n');
  
  // Actualizar todas a DROPPED usando los IDs encontrados
  const ids = pending.map(r => r.id);
  const result = await prisma.reservation.updateMany({
    where: {
      id: { in: ids }
    },
    data: {
      status: 'DROPPED'
    }
  });
  
  console.log(`✅ ${result.count} reservas actualizadas a DROPPED`);
  
  await prisma.$disconnect();
}

updatePendingToDropped().catch(console.error);
