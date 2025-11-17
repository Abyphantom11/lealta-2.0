const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function encontrarReserva68() {
  const now = new Date();
  const fechaInicio = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const fechaFin = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  
  console.log('🔍 Buscando reserva con 68 personas\n');
  
  const reservas = await prisma.reservation.findMany({
    where: { 
      reservedAt: { gte: fechaInicio, lt: fechaFin },
      status: 'CHECKED_IN'
    },
    include: { 
      Cliente: true, 
      HostTracking: true 
    },
    orderBy: { reservedAt: 'desc' }
  });
  
  // Buscar reserva con ~68 asistentes
  const con68 = reservas.filter(r => 
    r.HostTracking?.guestCount >= 65 && r.HostTracking?.guestCount <= 70
  );
  
  console.log('Reservas con 65-70 asistentes:');
  con68.forEach(r => {
    console.log(`\n- ${r.customerName}`);
    console.log(`  Asistentes: ${r.HostTracking?.guestCount}`);
    console.log(`  Cliente asociado: ${r.Cliente?.nombre || 'Sin cliente'}`);
    console.log(`  Número: ${r.reservationNumber}`);
    console.log(`  Fecha: ${r.reservedAt.toISOString().split('T')[0]}`);
  });
  
  // Ahora agrupar por customerName en lugar de Cliente.id
  console.log('\n' + '='.repeat(70));
  console.log('📊 TOP 10 POR customerName (nombre real de la reserva)\n');
  
  const porNombre = {};
  
  for (const r of reservas) {
    if (r.status === 'CHECKED_IN' && r.HostTracking?.guestCount > 0) {
      const nombre = r.customerName || 'Sin nombre';
      
      if (!porNombre[nombre]) {
        porNombre[nombre] = {
          nombre,
          totalAsistentes: 0,
          reservasConAsistencia: 0,
          totalReservas: 0
        };
      }
      
      porNombre[nombre].totalAsistentes += r.HostTracking.guestCount;
      porNombre[nombre].reservasConAsistencia++;
      porNombre[nombre].totalReservas++;
    }
  }
  
  const top10 = Object.values(porNombre)
    .sort((a, b) => b.totalAsistentes - a.totalAsistentes)
    .slice(0, 10);
  
  console.log('Top 10 por TOTAL ASISTENTES (agrupado por customerName):');
  top10.forEach((c, i) => {
    console.log(`${i+1}. ${c.nombre}: ${c.totalAsistentes} asistentes, ${c.reservasConAsistencia} reservas`);
  });
  
  const total = top10.reduce((sum, c) => sum + c.totalAsistentes, 0);
  console.log(`\nTotal Top 10: ${total} asistentes`);
  
  await prisma.$disconnect();
}

encontrarReserva68();
