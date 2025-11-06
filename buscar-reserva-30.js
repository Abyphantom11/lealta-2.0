const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarReserva30Personas() {
  console.log('🔍 Buscando reserva de 30 personas de Antonio Salvador...\n');

  const businessId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky
  
  const reservas = await prisma.reservation.findMany({
    where: {
      businessId,
      reservedAt: {
        gte: new Date('2025-10-01T05:00:00Z'),
        lt: new Date('2025-11-01T05:00:00Z'),
      },
      Promotor: {
        nombre: 'Antonio Salvador'
      },
      guestCount: {
        gte: 28, // Entre 28 y 32 para capturar "30 o más"
        lte: 35,
      },
    },
    include: {
      Promotor: true,
      HostTracking: true,
      ReservationQRCode: true,
      Cliente: true,
    },
  });

  console.log(`📊 Reservas de 28-35 personas de Antonio Salvador: ${reservas.length}\n`);

  for (const r of reservas) {
    console.log(`════════════════════════════════════════`);
    console.log(`Cliente: ${r.customerName}`);
    console.log(`Email: ${r.customerEmail}`);
    console.log(`Fecha: ${new Date(r.reservedAt).toLocaleString('es-ES', { timeZone: 'America/Guayaquil' })}`);
    console.log(`Personas esperadas: ${r.guestCount}`);
    console.log(`Status: ${r.status}`);
    console.log(`Promotor: ${r.Promotor?.nombre}`);
    console.log(`HostTracking: ${r.HostTracking ? `SÍ (${r.HostTracking.guestCount} personas)` : 'NO'}`);
    console.log(`ReservationQRCode: ${r.ReservationQRCode.length} registros`);
    
    if (r.ReservationQRCode.length > 0) {
      console.log(`  - scanCount: ${r.ReservationQRCode[0].scanCount || 0}`);
    }
    
    console.log(`Metadata: ${r.metadata ? JSON.stringify(r.metadata, null, 2) : 'Sin metadata'}`);
    console.log('');
  }

  // Buscar también por cualquier reserva grande de Antonio Salvador
  console.log('\n📋 TODAS las reservas de Antonio Salvador (ordenadas por personas):\n');
  
  const todasAntonioSalvador = await prisma.reservation.findMany({
    where: {
      businessId,
      reservedAt: {
        gte: new Date('2025-10-01T05:00:00Z'),
        lt: new Date('2025-11-01T05:00:00Z'),
      },
      Promotor: {
        nombre: 'Antonio Salvador'
      },
    },
    include: {
      HostTracking: true,
    },
    orderBy: {
      guestCount: 'desc',
    },
  });

  console.log(`Total: ${todasAntonioSalvador.length} reservas\n`);

  for (const r of todasAntonioSalvador) {
    const asistieron = r.HostTracking?.guestCount || 0;
    const icon = r.HostTracking ? '✅' : '❌';
    console.log(`${icon} ${r.customerName} - Esperadas: ${r.guestCount}, Asistieron: ${asistieron}`);
  }

  await prisma.$disconnect();
}

buscarReserva30Personas().catch(console.error);
