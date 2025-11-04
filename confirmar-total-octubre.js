/**
 * Confirmación final del total de asistencias de octubre 2025
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function confirmarTotalOctubre() {
  try {
    console.log('🎯 CONFIRMACIÓN FINAL: Total de Asistencias de Octubre 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

    // 1. Personas con QR (scanCount)
    const reservasOctubre = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      },
      include: {
        ReservationQRCode: true
      }
    });

    let totalQR = 0;
    for (const reserva of reservasOctubre) {
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      totalQR += scanCount;
    }

    // 2. Personas sin reserva
    const sinReservas = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id,
        fecha: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    const totalSinReserva = sinReservas.reduce((sum, r) => sum + r.numeroPersonas, 0);

    // 3. TOTAL
    const totalOctubre = totalQR + totalSinReserva;

    console.log('═══════════════════════════════════════════════');
    console.log('📊 TOTAL DE ASISTENCIAS DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`👥 Personas con QR escaneado: ${totalQR}`);
    console.log(`   (scanCount de ReservationQRCode)\n`);

    console.log(`👥 Personas sin reserva (walk-ins): ${totalSinReserva}`);
    console.log(`   (numeroPersonas de SinReserva)\n`);

    console.log('─────────────────────────────────────────────────');
    console.log(`✨ TOTAL DE PERSONAS ATENDIDAS: ${totalOctubre}`);
    console.log('─────────────────────────────────────────────────\n');

    console.log('📅 Distribución:');
    console.log(`   - ${totalQR} personas usaron reserva (${((totalQR/totalOctubre)*100).toFixed(1)}%)`);
    console.log(`   - ${totalSinReserva} personas sin reserva (${((totalSinReserva/totalOctubre)*100).toFixed(1)}%)\n`);

    console.log('✅ CONFIRMADO: El negocio atendió ' + totalOctubre + ' personas en octubre 2025');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

confirmarTotalOctubre();
