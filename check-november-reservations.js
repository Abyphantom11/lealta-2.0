const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNovemberReservations() {
  const startNov = new Date('2025-11-01T00:00:00.000Z');
  const endNov = new Date('2025-12-01T00:00:00.000Z');

  // Buscar todas las reservas de noviembre de Love Me Sky
  const novReservations = await prisma.reservation.findMany({
    where: {
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
    orderBy: { reservedAt: 'asc' }
  });

  console.log('=== RESERVAS DE LOVE ME SKY - NOVIEMBRE 2025 ===');
  console.log('Total:', novReservations.length);
  console.log('');

  // Agrupar por status
  const byStatus = {};
  for (const r of novReservations) {
    if (!byStatus[r.status]) byStatus[r.status] = [];
    byStatus[r.status].push(r);
  }

  for (const [status, reservs] of Object.entries(byStatus)) {
    console.log(`📊 ${status}: ${reservs.length}`);
  }

  console.log('\n=== DETALLE ===');
  for (const r of novReservations) {
    console.log(`${r.reservedAt.toISOString().split('T')[0]} | ${r.status.padEnd(12)} | ${r.customerName} | ${r.guestCount} pax`);
  }

  await prisma.$disconnect();
}

checkNovemberReservations().catch(console.error);
