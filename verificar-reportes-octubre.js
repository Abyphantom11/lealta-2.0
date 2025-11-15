const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarReportesOctubre() {
  console.log('🔍 Verificando reportes de octubre 2025...\n');
  
  const business = await prisma.business.findFirst({
    where: {
      name: {
        contains: 'Love Me',
        mode: 'insensitive'
      }
    }
  });

  if (!business) {
    console.log('❌ Negocio no encontrado');
    return;
  }

  console.log(`✅ Negocio: ${business.name}\n`);

  // Fechas en UTC (como las usa el reporte)
  const fechaInicioUTC = new Date(Date.UTC(2025, 9, 1, 0, 0, 0, 0)); // Oct 1, 2025
  const fechaFinUTC = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)); // Nov 1, 2025

  console.log(`📅 Rango UTC: ${fechaInicioUTC.toISOString()} - ${fechaFinUTC.toISOString()}`);

  // Buscar reservas
  const reservas = await prisma.reservation.findMany({
    where: {
      businessId: business.id,
      reservedAt: {
        gte: fechaInicioUTC,
        lt: fechaFinUTC
      }
    },
    orderBy: {
      reservedAt: 'asc'
    }
  });

  console.log(`\n📊 Total reservas en octubre (UTC): ${reservas.length}\n`);

  // Mostrar primera y última reserva
  if (reservas.length > 0) {
    const primera = reservas[0];
    const ultima = reservas[reservas.length - 1];

    console.log(`Primera reserva:`);
    console.log(`  - Fecha UTC: ${primera.reservedAt.toISOString()}`);
    console.log(`  - Fecha Local: ${primera.reservedAt.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`);
    console.log(`  - Cliente: ${primera.customerName}`);

    console.log(`\nÚltima reserva:`);
    console.log(`  - Fecha UTC: ${ultima.reservedAt.toISOString()}`);
    console.log(`  - Fecha Local: ${ultima.reservedAt.toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`);
    console.log(`  - Cliente: ${ultima.customerName}`);
  }

  // Buscar reservas que podrían estar fuera del rango por zona horaria
  console.log(`\n🔍 Buscando reservas del 31 de octubre (hora local)...`);
  
  const reservas31Oct = await prisma.reservation.findMany({
    where: {
      businessId: business.id,
      reservedAt: {
        gte: new Date('2025-10-31T00:00:00Z'),
        lt: new Date('2025-11-01T06:00:00Z') // Hasta 6 AM UTC del 1 nov (= 1 AM Ecuador)
      }
    },
    select: {
      id: true,
      customerName: true,
      reservedAt: true
    },
    orderBy: {
      reservedAt: 'asc'
    }
  });

  console.log(`\nReservas del 31/10 encontradas: ${reservas31Oct.length}`);
  
  if (reservas31Oct.length > 0) {
    console.log(`\nDetalle de reservas del 31/10:`);
    reservas31Oct.forEach(r => {
      const horaLocal = r.reservedAt.toLocaleString('es-EC', { 
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit'
      });
      const estaEnReporte = r.reservedAt >= fechaInicioUTC && r.reservedAt < fechaFinUTC;
      console.log(`  ${r.customerName}: ${horaLocal} - ${estaEnReporte ? '✅ En reporte' : '❌ FUERA de reporte'}`);
    });
  }

  await prisma.$disconnect();
}

verificarReportesOctubre();
