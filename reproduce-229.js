/**
 * Reproducir el cálculo exacto del reporte de asistencias de noviembre
 * Para encontrar de dónde sale el número 229
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function reproduce229Calculation() {
  console.log('═════════════════════════════════════════════════════');
  console.log('🔍 REPRODUCIENDO CÁLCULO DE ASISTENCIAS (229)');
  console.log('═════════════════════════════════════════════════════');
  console.log('');

  try {
    // Fechas como en el reporte
    const fechaInicio = new Date('2025-11-01T00:00:00.000Z');
    const fechaFin = new Date('2025-12-01T00:00:00.000Z');

    console.log(`📅 Rango: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);
    console.log('');

    // 1. RESERVAS (igual que en el reporte)
    const reservations = await prisma.reservation.findMany({
      where: {
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin,
        }
      },
      include: {
        ReservationQRCode: true
      }
    });

    const totalReservas = reservations.length;
    const totalPersonasEsperadas = reservations.reduce((sum, r) => sum + r.guestCount, 0);
    
    const totalAsistentesReales = reservations.reduce((sum, r) => {
      const scanCount = r.ReservationQRCode[0]?.scanCount || 0;
      return sum + scanCount;
    }, 0);

    console.log('👥 PARTE 1: RESERVAS');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Total reservas: ${totalReservas}`);
    console.log(`Personas esperadas (guestCount): ${totalPersonasEsperadas}`);
    console.log(`Asistentes reales (scans): ${totalAsistentesReales}`);
    console.log('');

    // 2. SIN RESERVA (igual que en el reporte)
    const sinReservas = await prisma.sinReserva.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
    });

    const totalRegistrosSinReserva = sinReservas.length;
    const totalPersonasSinReserva = sinReservas.reduce((sum, r) => sum + r.numeroPersonas, 0);

    console.log('🚶 PARTE 2: SIN RESERVA');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Total registros: ${totalRegistrosSinReserva}`);
    console.log(`Total personas: ${totalPersonasSinReserva}`);
    console.log('');

    if (sinReservas.length > 0) {
      console.log('Detalles de registros sin reserva:');
      for (const sr of sinReservas.slice(0, 5)) {
        console.log(`  ${new Date(sr.fecha).toLocaleString('es-ES')} - ${sr.numeroPersonas} personas`);
      }
      if (sinReservas.length > 5) {
        console.log(`  ... y ${sinReservas.length - 5} más`);
      }
      console.log('');
    }

    // 3. CÁLCULO TOTAL (igual que en el reporte)
    const totalPersonasAtendidas = totalAsistentesReales + totalPersonasSinReserva;
    const totalEventosAtendidos = totalReservas + totalRegistrosSinReserva;

    console.log('═════════════════════════════════════════════════════');
    console.log('🎯 RESULTADO FINAL (igual que en el reporte)');
    console.log('═════════════════════════════════════════════════════');
    console.log(`Total Personas Atendidas: ${totalPersonasAtendidas} 🎉`);
    console.log('');
    console.log('Desglose:');
    console.log(`  Asistentes reales (scans):    ${totalAsistentesReales}`);
    console.log(`  Personas sin reserva:         ${totalPersonasSinReserva}`);
    console.log(`  ───────────────────────────────────────────`);
    console.log(`  TOTAL:                        ${totalPersonasAtendidas}`);
    console.log('');

    if (totalPersonasAtendidas === 229) {
      console.log('✅ ¡CONFIRMADO! Este es el cálculo que da 229');
    } else {
      console.log(`⚠️  No coincide con 229. Diferencia: ${229 - totalPersonasAtendidas}`);
    }
    console.log('');

    console.log('📝 EXPLICACIÓN:');
    console.log('─────────────────────────────────────────────────────');
    console.log('El número 229 se compone de:');
    console.log(`  1. ${totalAsistentesReales} scans de QR (personas que escanearon al entrar)`);
    console.log(`  2. ${totalPersonasSinReserva} personas sin reserva (walk-ins registrados)`);
    console.log('');
    console.log('NO incluye:');
    console.log(`  - ${totalPersonasEsperadas} personas esperadas (guestCount) que no asistieron`);
    console.log(`  - Personas que asistieron pero no escanearon`);
    console.log('');

    // 4. Análisis conservador (desde 4am)
    console.log('═════════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS CONSERVADOR (desde 4am)');
    console.log('═════════════════════════════════════════════════════');

    const fechaInicio4am = new Date('2025-11-01T04:00:00.000Z');

    const reservations4am = await prisma.reservation.findMany({
      where: {
        reservedAt: {
          gte: fechaInicio4am,
          lt: fechaFin,
        }
      },
      include: {
        ReservationQRCode: true
      }
    });

    const totalAsistentes4am = reservations4am.reduce((sum, r) => {
      const scanCount = r.ReservationQRCode[0]?.scanCount || 0;
      return sum + scanCount;
    }, 0);

    const sinReservas4am = await prisma.sinReserva.findMany({
      where: {
        fecha: {
          gte: fechaInicio4am,
          lt: fechaFin,
        },
      },
    });

    const totalPersonasSinReserva4am = sinReservas4am.reduce((sum, r) => sum + r.numeroPersonas, 0);
    const totalConservador = totalAsistentes4am + totalPersonasSinReserva4am;

    console.log(`Desde medianoche (00:00): ${totalPersonasAtendidas} personas`);
    console.log(`Desde 4am conservador:    ${totalConservador} personas`);
    console.log(`Diferencia:               ${totalPersonasAtendidas - totalConservador} personas (00:00-04:00)`);
    console.log('');

    console.log('═════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reproduce229Calculation();
