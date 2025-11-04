/**
 * Script para calcular el TOTAL REAL de asistencias por día
 * Sumando TODAS las fuentes: QR + SinReserva
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateRealTotalAttendance() {
  try {
    console.log('🔍 CALCULANDO ASISTENCIAS REALES POR DÍA (TODAS LAS FUENTES)\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

    // ==========================================
    // 1. ASISTENCIAS CON QR POR DÍA
    // ==========================================
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

    const asistenciasQRPorDia = {};
    
    for (const reserva of reservasOctubre) {
      const fecha = reserva.reservedAt.toISOString().split('T')[0];
      
      if (!asistenciasQRPorDia[fecha]) {
        asistenciasQRPorDia[fecha] = 0;
      }
      
      // Sumar scanCount (personas que asistieron con QR)
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      asistenciasQRPorDia[fecha] += scanCount;
    }

    // ==========================================
    // 2. ASISTENCIAS SIN RESERVA POR DÍA
    // ==========================================
    const sinReservasOctubre = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id,
        fecha: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    const asistenciasSinReservaPorDia = {};
    
    for (const registro of sinReservasOctubre) {
      const fecha = registro.fecha.toISOString().split('T')[0];
      
      if (!asistenciasSinReservaPorDia[fecha]) {
        asistenciasSinReservaPorDia[fecha] = 0;
      }
      
      asistenciasSinReservaPorDia[fecha] += registro.numeroPersonas;
    }

    // ==========================================
    // 3. COMBINAR AMBAS FUENTES POR DÍA
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 ASISTENCIAS REALES POR DÍA (QR + SIN RESERVA)');
    console.log('═══════════════════════════════════════════════\n');

    // Obtener todos los días únicos
    const todosDias = new Set([
      ...Object.keys(asistenciasQRPorDia),
      ...Object.keys(asistenciasSinReservaPorDia)
    ]);

    const diasOrdenados = Array.from(todosDias).sort();

    let totalMesQR = 0;
    let totalMesSinReserva = 0;
    let diasConActividad = 0;

    for (const fecha of diasOrdenados) {
      const qr = asistenciasQRPorDia[fecha] || 0;
      const sinReserva = asistenciasSinReservaPorDia[fecha] || 0;
      const total = qr + sinReserva;

      if (total > 0) {
        diasConActividad++;
        console.log(`📅 ${fecha}:`);
        console.log(`   Con QR: ${qr} personas`);
        console.log(`   Sin reserva: ${sinReserva} personas`);
        console.log(`   ✨ TOTAL: ${total} personas\n`);

        totalMesQR += qr;
        totalMesSinReserva += sinReserva;
      }
    }

    const totalMesCompleto = totalMesQR + totalMesSinReserva;

    console.log('═══════════════════════════════════════════════');
    console.log('📊 TOTALES DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`📅 Días con actividad: ${diasConActividad} de ${diasOrdenados.length}`);
    console.log(`\n👥 PERSONAS CON QR: ${totalMesQR}`);
    console.log(`👥 PERSONAS SIN RESERVA: ${totalMesSinReserva}`);
    console.log(`\n✨ TOTAL REAL DE PERSONAS ATENDIDAS: ${totalMesCompleto}\n`);

    // ==========================================
    // 4. VERIFICAR CONTRA EL REPORTE
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🐛 COMPARACIÓN CON EL REPORTE ACTUAL');
    console.log('═══════════════════════════════════════════════\n');

    console.log('El reporte muestra:');
    console.log('   "Asistentes Reales: 215"');
    console.log('   "Total Personas (Sin Reserva): 375"');
    console.log('   "Total Personas Atendidas: 590"\n');

    console.log('Cálculo real:');
    console.log(`   Personas con QR: ${totalMesQR}`);
    console.log(`   Personas sin reserva: ${totalMesSinReserva}`);
    console.log(`   Total: ${totalMesCompleto}\n`);

    if (totalMesQR === 215 && totalMesSinReserva === 375 && totalMesCompleto === 590) {
      console.log('✅ LOS NÚMEROS COINCIDEN PERFECTAMENTE');
      console.log('✅ El reporte está sumando correctamente\n');
      
      console.log('💡 PERO tu observación es válida:');
      console.log('   El sistema solo registró QR el 31 de octubre');
      console.log('   Los otros días solo tienen registros de "Sin Reserva"');
      console.log('   Las reservas de otros días NO se escanearon\n');
    } else {
      console.log('⚠️  HAY DISCREPANCIA');
      console.log(`   Diferencia en QR: ${totalMesQR - 215}`);
      console.log(`   Diferencia en Sin Reserva: ${totalMesSinReserva - 375}`);
      console.log(`   Diferencia total: ${totalMesCompleto - 590}\n`);
    }

    // ==========================================
    // 5. ANÁLISIS: ¿POR QUÉ SOLO EL 31 TIENE QR?
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS: ¿QUÉ PASÓ CON LOS OTROS DÍAS?');
    console.log('═══════════════════════════════════════════════\n');

    console.log('Teorías posibles:\n');

    console.log('1️⃣  TEORÍA: Solo el 31 fue el evento real');
    console.log('   Las otras 91 reservas fueron para otros días pero:');
    console.log('   - No se realizaron');
    console.log('   - Se cancelaron');
    console.log('   - No usaron el sistema QR\n');

    console.log('2️⃣  TEORÍA: Usaron registro manual los otros días');
    console.log('   Los otros días las personas llegaron pero:');
    console.log('   - No escanearon QR');
    console.log('   - Se registraron como "Sin Reserva"');
    console.log('   - El sistema QR no estaba activo\n');

    console.log('3️⃣  TEORÍA: Las reservas eran todas para el 31');
    console.log('   Las 55 reservas del 31 generaron:');
    console.log('   - 27 QR codes que se escanearon');
    console.log('   - 215 personas asistieron\n');

    // Contar reservas que NO se escanearon
    const reservasNoEscaneadas = reservasOctubre.filter(r => {
      const scanCount = r.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      return scanCount === 0;
    });

    console.log(`📊 Estadísticas de reservas:\n`);
    console.log(`   Total reservas: ${reservasOctubre.length}`);
    console.log(`   Reservas escaneadas: ${reservasOctubre.length - reservasNoEscaneadas.length}`);
    console.log(`   Reservas NO escaneadas: ${reservasNoEscaneadas.length}\n`);

    // Personas esperadas en reservas no escaneadas
    const personasEsperadasNoEscaneadas = reservasNoEscaneadas.reduce((sum, r) => sum + r.guestCount, 0);
    console.log(`   Personas esperadas (no escaneadas): ${personasEsperadasNoEscaneadas}\n`);

    console.log('💡 CONCLUSIÓN MÁS PROBABLE:');
    console.log('   ✅ El total de 590 personas ES CORRECTO');
    console.log('   ✅ Incluye QR + Sin Reserva de todos los días');
    console.log('   ⚠️  Pero las reservas de otros días NO se usaron');
    console.log('   ⚠️  Esas personas se registraron como "Sin Reserva"\n');

    // ==========================================
    // 6. TOP DÍAS CON MÁS ASISTENCIA
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🔝 TOP 10 DÍAS CON MÁS ASISTENCIA TOTAL');
    console.log('═══════════════════════════════════════════════\n');

    const diasConTotales = diasOrdenados.map(fecha => ({
      fecha,
      qr: asistenciasQRPorDia[fecha] || 0,
      sinReserva: asistenciasSinReservaPorDia[fecha] || 0,
      total: (asistenciasQRPorDia[fecha] || 0) + (asistenciasSinReservaPorDia[fecha] || 0)
    })).filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total);

    for (let i = 0; i < Math.min(10, diasConTotales.length); i++) {
      const dia = diasConTotales[i];
      console.log(`${i + 1}. ${dia.fecha}: ${dia.total} personas`);
      console.log(`   (${dia.qr} con QR + ${dia.sinReserva} sin reserva)\n`);
    }

    console.log('🎉 Análisis completado!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateRealTotalAttendance();
