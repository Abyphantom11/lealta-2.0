/**
 * Verificar datos de NOVIEMBRE 2025 (mes actual)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarNoviembre() {
  try {
    console.log('📊 VERIFICANDO DATOS DE NOVIEMBRE 2025 (MES ACTUAL)\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    // Noviembre 2025
    const fechaInicio = new Date(Date.UTC(2025, 10, 1, 0, 0, 0)); // Noviembre = mes 10
    const fechaFin = new Date(Date.UTC(2025, 11, 1, 0, 0, 0)); // Diciembre

    console.log('📅 Período:', {
      inicio: fechaInicio.toISOString().split('T')[0],
      fin: fechaFin.toISOString().split('T')[0]
    });
    console.log('');

    // 1. RESERVAS DE NOVIEMBRE
    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    console.log('📋 RESERVAS DE NOVIEMBRE:');
    console.log(`   Total: ${reservas.length}`);
    if (reservas.length > 0) {
      const personasEsperadas = reservas.reduce((sum, r) => sum + r.guestCount, 0);
      console.log(`   Personas Esperadas: ${personasEsperadas}`);
    }
    console.log('');

    // 2. HOSTTRACKING DE NOVIEMBRE (Asistentes Reales)
    const hostTracking = await prisma.hostTracking.findMany({
      where: {
        businessId: business.id,
        reservationDate: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const hostTrackingNoviembre = hostTracking.filter(h => {
      const fecha = new Date(h.reservationDate);
      return fecha.getMonth() === 10; // Noviembre
    });

    console.log('👥 ASISTENTES REALES (HostTracking):');
    console.log(`   Total registros: ${hostTrackingNoviembre.length}`);
    const totalAsistentesReales = hostTrackingNoviembre.reduce((sum, h) => sum + h.guestCount, 0);
    console.log(`   Total Personas: ${totalAsistentesReales}`);
    console.log('');

    // 3. SIN RESERVA DE NOVIEMBRE
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
    const totalSinReserva = sinReserva.reduce((sum, r) => sum + r.numeroPersonas, 0);
    console.log(`   Total Personas: ${totalSinReserva}`);
    console.log('');

    // TOTALES
    const totalPersonasDelMes = totalAsistentesReales + totalSinReserva;

    console.log('═══════════════════════════════════════════════');
    console.log('📊 RESUMEN NOVIEMBRE 2025');
    console.log('═══════════════════════════════════════════════');
    console.log(`Total Reservas:          ${reservas.length.toString().padStart(6)}`);
    console.log(`Asistentes Reales:       ${totalAsistentesReales.toString().padStart(6)}`);
    console.log(`Sin Reserva:             ${totalSinReserva.toString().padStart(6)}`);
    console.log('───────────────────────────────────────────────');
    console.log(`TOTAL PERSONAS DEL MES:  ${totalPersonasDelMes.toString().padStart(6)}`);
    console.log('═══════════════════════════════════════════════\n');

    if (totalPersonasDelMes > 0) {
      const porcentajeSinReserva = ((totalSinReserva / totalPersonasDelMes) * 100).toFixed(1);
      console.log(`📈 % Sin Reserva: ${porcentajeSinReserva}%\n`);
    }

    console.log('✅ ESTOS SON LOS VALORES QUE DEBE MOSTRAR EL DASHBOARD:\n');
    console.log(`   Total Reservas:    ${reservas.length}`);
    console.log(`   Total Asistentes:  ${totalPersonasDelMes}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarNoviembre();
