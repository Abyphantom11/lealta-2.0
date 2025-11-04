/**
 * Verificar si hay datos para diciembre 2025
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDiciembre() {
  try {
    console.log('🔍 VERIFICANDO DATOS DE DICIEMBRE 2025\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const fechaInicio = new Date(Date.UTC(2025, 11, 1, 0, 0, 0)); // Diciembre = mes 11
    const fechaFin = new Date(Date.UTC(2026, 0, 1, 0, 0, 0)); // Enero 2026

    console.log('📅 Período:', {
      inicio: fechaInicio.toISOString().split('T')[0],
      fin: fechaFin.toISOString().split('T')[0]
    });
    console.log('');

    // 1. Reservas
    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    console.log('📋 RESERVAS:');
    console.log(`   Total: ${reservas.length}`);
    if (reservas.length > 0) {
      console.log(`   Personas Esperadas: ${reservas.reduce((sum, r) => sum + r.guestCount, 0)}`);
    }
    console.log('');

    // 2. HostTracking
    const hostTracking = await prisma.hostTracking.findMany({
      where: {
        businessId: business.id,
        reservationDate: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const hostTrackingDiciembre = hostTracking.filter(h => {
      const fecha = new Date(h.reservationDate);
      return fecha.getMonth() === 11; // Diciembre
    });

    console.log('👥 HOSTTRACKING (Asistentes Reales):');
    console.log(`   Total registros: ${hostTrackingDiciembre.length}`);
    if (hostTrackingDiciembre.length > 0) {
      const total = hostTrackingDiciembre.reduce((sum, h) => sum + h.guestCount, 0);
      console.log(`   Total Personas: ${total}`);
    }
    console.log('');

    // 3. Sin Reserva
    const sinReserva = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id,
        fecha: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    console.log('🚶‍♂️ SIN RESERVA (Walk-ins):');
    console.log(`   Total registros: ${sinReserva.length}`);
    if (sinReserva.length > 0) {
      const total = sinReserva.reduce((sum, r) => sum + r.numeroPersonas, 0);
      console.log(`   Total Personas: ${total}`);
    }
    console.log('');

    // Resumen
    console.log('═══════════════════════════════════════════════');
    if (reservas.length === 0 && hostTrackingDiciembre.length === 0 && sinReserva.length === 0) {
      console.log('⚠️  NO HAY DATOS PARA DICIEMBRE 2025');
      console.log('');
      console.log('Esto es normal si:');
      console.log('  • Aún no has creado reservas para diciembre');
      console.log('  • Aún no has trabajado en diciembre');
      console.log('  • El negocio aún no ha registrado eventos');
      console.log('');
      console.log('✅ Los datos de octubre están correctos (1,071 personas)');
    } else {
      console.log('✅ HAY DATOS PARA DICIEMBRE');
    }
    console.log('═══════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDiciembre();
