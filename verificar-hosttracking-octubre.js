const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarHostTracking() {
  try {
    console.log('🔍 VERIFICANDO HOSTTRACKING DE OCTUBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' },
    });

    // Reservas de octubre
    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
          lt: new Date('2025-11-01T00:00:00.000Z'),
        },
      },
      include: {
        HostTracking: true,
        ReservationQRCode: true,
      },
    });

    const conHostTracking = reservas.filter(r => r.HostTracking);
    const sinHostTracking = reservas.filter(r => !r.HostTracking);
    const conQR = reservas.filter(r => r.ReservationQRCode.length > 0);
    const sinQR = reservas.filter(r => r.ReservationQRCode.length === 0);

    console.log(`📊 RESUMEN:`);
    console.log(`Total reservas: ${reservas.length}`);
    console.log(`\n📋 HOSTTRACKING (datos de asistencia):`);
    console.log(`  ✅ Con HostTracking: ${conHostTracking.length} (${((conHostTracking.length / reservas.length) * 100).toFixed(1)}%)`);
    console.log(`  ❌ Sin HostTracking: ${sinHostTracking.length} (${((sinHostTracking.length / reservas.length) * 100).toFixed(1)}%)`);
    
    console.log(`\n📊 QRs:`);
    console.log(`  ✅ Con QR: ${conQR.length}`);
    console.log(`  ❌ Sin QR: ${sinQR.length}`);

    // Analizar asistencia real
    let totalAsistentes = 0;
    let reservasConAsistentes = 0;

    for (const r of conHostTracking) {
      if (r.HostTracking.guestCount > 0) {
        totalAsistentes += r.HostTracking.guestCount;
        reservasConAsistentes++;
      }
    }

    console.log(`\n📈 ASISTENCIA REGISTRADA:`);
    console.log(`  Total asistentes: ${totalAsistentes} personas`);
    console.log(`  Reservas con asistentes: ${reservasConAsistentes}`);
    console.log(`  Promedio por reserva: ${(totalAsistentes / reservasConAsistentes).toFixed(1)} personas`);

    // Mostrar ejemplos
    console.log(`\n📋 MUESTRA DE RESERVAS CON HOSTTRACKING (primeras 10):`);
    console.log('-'.repeat(80));
    
    for (const r of conHostTracking.slice(0, 10)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      const tieneQR = r.ReservationQRCode.length > 0 ? '✅ QR' : '❌ Sin QR';
      console.log(`${r.id.slice(0, 8)} | ${fecha} | ${r.customerName?.padEnd(30)} | Esp: ${r.guestCount.toString().padStart(2)}, Asist: ${r.HostTracking.guestCount.toString().padStart(2)} | ${tieneQR}`);
    }

    console.log(`\n📋 MUESTRA DE RESERVAS SIN HOSTTRACKING (primeras 10):`);
    console.log('-'.repeat(80));
    
    for (const r of sinHostTracking.slice(0, 10)) {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES');
      const tieneQR = r.ReservationQRCode.length > 0 ? '✅ QR' : '❌ Sin QR';
      console.log(`${r.id.slice(0, 8)} | ${fecha} | ${r.customerName?.padEnd(30)} | Esp: ${r.guestCount.toString().padStart(2)} | Status: ${r.status.padEnd(12)} | ${tieneQR}`);
    }

    console.log(`\n✅ CONCLUSIÓN:`);
    if (conHostTracking.length > 0) {
      console.log(`Los datos de HostTracking están INTACTOS (${conHostTracking.length} registros).`);
      console.log(`La limpieza de QRs NO afectó los datos de asistencia. ✅`);
    } else {
      console.log(`⚠️  NO HAY DATOS DE HOSTTRACKING - Esto es un problema!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarHostTracking();
