const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllPending() {
  const pending = await prisma.reservation.findMany({
    where: { status: 'PENDING' },
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
    orderBy: { reservedAt: 'desc' }
  });

  console.log('=== TODAS LAS RESERVAS PENDIENTES ===');
  console.log('Total:', pending.length);
  console.log('');

  // Agrupar por negocio
  const byBusiness = {};
  for (const r of pending) {
    const biz = r.ReservationSlot?.ReservationService?.Business?.name || 'Sin negocio';
    if (!byBusiness[biz]) byBusiness[biz] = [];
    byBusiness[biz].push(r);
  }

  for (const [biz, reservs] of Object.entries(byBusiness)) {
    console.log(`\n📍 ${biz}: ${reservs.length} pendientes`);
    for (const r of reservs.slice(0, 5)) {
      console.log(`   - ${r.reservedAt.toISOString().split('T')[0]} | ${r.customerName} | ${r.guestCount} pax`);
    }
    if (reservs.length > 5) {
      console.log(`   ... y ${reservs.length - 5} más`);
    }
  }

  await prisma.$disconnect();
}

checkAllPending().catch(console.error);
