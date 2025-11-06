const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarTodasReservas() {
  console.log('🔍 Buscando TODAS las reservas (sin filtro)...\n');

  const count = await prisma.reservation.count();
  console.log(`📊 Total de reservas en BD: ${count}\n`);

  if (count === 0) {
    console.log('❌ No hay reservas en la base de datos');
    await prisma.$disconnect();
    return;
  }

  const reservas = await prisma.reservation.findMany({
    select: {
      id: true,
      businessId: true,
      customerName: true,
      reservedAt: true,
      Promotor: {
        select: {
          nombre: true,
        },
      },
      HostTracking: {
        select: {
          guestCount: true,
        },
      },
    },
    orderBy: {
      reservedAt: 'desc',
    },
    take: 10,
  });

  console.log('📋 Últimas 10 reservas:\n');
  reservas.forEach((r, idx) => {
    const fecha = new Date(r.reservedAt);
    console.log(`${idx + 1}. ${r.customerName}`);
    console.log(`   BusinessId: ${r.businessId}`);
    console.log(`   Fecha: ${fecha.toISOString()}`);
    console.log(`   Promotor: ${r.Promotor?.nombre || 'Sin promotor'}`);
    console.log(`   HostTracking: ${r.HostTracking ? `SÍ (${r.HostTracking.guestCount} personas)` : 'NO'}`);
    console.log('');
  });

  // Agrupar por businessId
  const porBusiness = {};
  const todasReservas = await prisma.reservation.findMany({
    select: {
      businessId: true,
    },
  });

  todasReservas.forEach(r => {
    porBusiness[r.businessId] = (porBusiness[r.businessId] || 0) + 1;
  });

  console.log('\n📊 Distribución por Business:');
  Object.entries(porBusiness).forEach(([id, count]) => {
    console.log(`   ${id}: ${count} reservas`);
  });

  await prisma.$disconnect();
}

buscarTodasReservas().catch(console.error);
