const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarSeptiembre() {
  const reservas = await prisma.reservation.findMany({
    where: {
      businessId: 'cmgf5px5f0000eyy0elci9yds',
      reservedAt: {
        gte: new Date(2025, 8, 1),
        lt: new Date(2025, 9, 1),
      },
    },
    include: {
      qrCodes: true,
    },
  });

  const totalPersonasEsperadas = reservas.reduce((s, r) => s + r.guestCount, 0);
  const totalAsistentes = reservas.reduce((s, r) => s + (r.qrCodes[0]?.scanCount || 0), 0);

  console.log('\n📊 SEPTIEMBRE 2025 - VERIFICACIÓN:');
  console.log('Total reservas:', reservas.length);
  console.log('\nEstados:');
  console.log('  COMPLETED:', reservas.filter(r => r.status === 'COMPLETED').length);
  console.log('  CANCELLED:', reservas.filter(r => r.status === 'CANCELLED').length);
  console.log('  NO_SHOW:', reservas.filter(r => r.status === 'NO_SHOW').length);
  console.log('\nPersonas:');
  console.log('  Esperadas (total invitados):', totalPersonasEsperadas);
  console.log('  Asistieron (scanCount):', totalAsistentes);
  console.log('  Cumplimiento:', totalPersonasEsperadas > 0 ? ((totalAsistentes / totalPersonasEsperadas) * 100).toFixed(1) + '%' : '0%');

  await prisma.$disconnect();
}

verificarSeptiembre();
