const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarFechasReservas() {
  console.log('🔍 Verificando fechas de reservas...\n');

  const businessId = 'cmgq1gl390000eygooxitc3rw';

  // Traer TODAS las reservas sin filtro de fecha
  const todasReservas = await prisma.reservation.findMany({
    where: {
      businessId,
    },
    select: {
      id: true,
      reservationNumber: true,
      customerName: true,
      reservedAt: true,
      createdAt: true,
    },
    orderBy: {
      reservedAt: 'desc',
    },
    take: 20, // Las 20 más recientes
  });

  console.log(`📊 Total de reservas más recientes: ${todasReservas.length}\n`);

  console.log('📅 Fechas de las reservas:\n');
  todasReservas.forEach((r, idx) => {
    const fechaReserved = new Date(r.reservedAt);
    const fechaCreated = new Date(r.createdAt);
    
    console.log(`${idx + 1}. ${r.customerName}`);
    console.log(`   reservedAt: ${fechaReserved.toISOString()}`);
    console.log(`   reservedAt (local): ${fechaReserved.toLocaleString('es-ES', { timeZone: 'America/Guayaquil' })}`);
    console.log(`   createdAt: ${fechaCreated.toISOString()}`);
    console.log('');
  });

  // Contar por mes
  const porMes = {};
  todasReservas.forEach(r => {
    const fecha = new Date(r.reservedAt);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    porMes[mes] = (porMes[mes] || 0) + 1;
  });

  console.log('\n📊 Distribución por mes:');
  Object.entries(porMes).sort().forEach(([mes, count]) => {
    console.log(`   ${mes}: ${count} reservas`);
  });

  await prisma.$disconnect();
}

verificarFechasReservas().catch(console.error);
