/**
 * Script para calcular CORRECTAMENTE los asistentes de octubre
 * Agrupados por DÍA para ver la distribución real
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateCorrectOctoberAttendance() {
  try {
    console.log('🔍 CALCULANDO ASISTENTES DE OCTUBRE POR DÍA\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

    // ==========================================
    // 1. OBTENER TODAS LAS RESERVAS DE OCTUBRE
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
        ReservationQRCode: true,
        Cliente: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { reservedAt: 'asc' }
    });

    console.log(`📋 Total de reservas en octubre: ${reservasOctubre.length}\n`);

    // ==========================================
    // 2. AGRUPAR ASISTENCIAS POR DÍA
    // ==========================================
    const asistenciasPorDia = {};
    const reservasPorDia = {};

    for (const reserva of reservasOctubre) {
      const fecha = reserva.reservedAt.toISOString().split('T')[0];
      
      if (!asistenciasPorDia[fecha]) {
        asistenciasPorDia[fecha] = {
          reservas: 0,
          personasEsperadas: 0,
          qrEscaneados: 0,
          personasAsistieron: 0,
          detalles: []
        };
      }

      asistenciasPorDia[fecha].reservas++;
      asistenciasPorDia[fecha].personasEsperadas += reserva.guestCount;

      // Calcular cuántas personas escanearon QR
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      
      if (scanCount > 0) {
        asistenciasPorDia[fecha].qrEscaneados++;
        asistenciasPorDia[fecha].personasAsistieron += scanCount;
        
        asistenciasPorDia[fecha].detalles.push({
          cliente: reserva.Cliente?.nombre || 'Sin nombre',
          esperados: reserva.guestCount,
          asistieron: scanCount,
          hora: reserva.reservedAt.toISOString().split('T')[1].substring(0, 5)
        });
      }
    }

    // ==========================================
    // 3. MOSTRAR RESUMEN POR DÍA
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 ASISTENCIAS CON QR POR DÍA DE OCTUBRE');
    console.log('═══════════════════════════════════════════════\n');

    const diasOrdenados = Object.keys(asistenciasPorDia).sort();
    let totalMesReservas = 0;
    let totalMesEsperadas = 0;
    let totalMesQREscaneados = 0;
    let totalMesAsistieron = 0;

    for (const fecha of diasOrdenados) {
      const data = asistenciasPorDia[fecha];
      
      console.log(`📅 ${fecha}:`);
      console.log(`   Reservas: ${data.reservas}`);
      console.log(`   Esperadas: ${data.personasEsperadas} personas`);
      console.log(`   QR escaneados: ${data.qrEscaneados}`);
      console.log(`   👥 Asistieron: ${data.personasAsistieron} personas`);
      
      if (data.personasAsistieron > 0) {
        const porcentaje = ((data.personasAsistieron / data.personasEsperadas) * 100).toFixed(1);
        console.log(`   Cumplimiento: ${porcentaje}%`);
        
        // Mostrar algunas reservas de ejemplo
        if (data.detalles.length <= 3) {
          console.log(`   Detalles:`);
          for (const detalle of data.detalles) {
            console.log(`      - ${detalle.cliente}: ${detalle.asistieron}/${detalle.esperados} personas`);
          }
        } else {
          console.log(`   Detalles: ${data.detalles.length} reservas escaneadas`);
        }
      }
      console.log('');

      totalMesReservas += data.reservas;
      totalMesEsperadas += data.personasEsperadas;
      totalMesQREscaneados += data.qrEscaneados;
      totalMesAsistieron += data.personasAsistieron;
    }

    // ==========================================
    // 4. TOTAL DEL MES
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 TOTAL DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`📋 Total de reservas: ${totalMesReservas}`);
    console.log(`👥 Personas esperadas: ${totalMesEsperadas}`);
    console.log(`🎫 QR codes escaneados: ${totalMesQREscaneados}`);
    console.log(`✅ PERSONAS QUE ASISTIERON: ${totalMesAsistieron}`);
    console.log(`📊 Cumplimiento: ${((totalMesAsistieron / totalMesEsperadas) * 100).toFixed(1)}%\n`);

    // ==========================================
    // 5. AGREGAR SIN RESERVA
    // ==========================================
    const sinReservasPorDia = {};
    const sinReservasOctubre = await prisma.sinReserva.findMany({
      where: {
        businessId: business.id,
        fecha: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      },
      orderBy: { fecha: 'asc' }
    });

    for (const registro of sinReservasOctubre) {
      const fecha = registro.fecha.toISOString().split('T')[0];
      if (!sinReservasPorDia[fecha]) {
        sinReservasPorDia[fecha] = 0;
      }
      sinReservasPorDia[fecha] += registro.numeroPersonas;
    }

    const totalSinReserva = sinReservasOctubre.reduce((sum, r) => sum + r.numeroPersonas, 0);

    console.log('═══════════════════════════════════════════════');
    console.log('🚶 PERSONAS SIN RESERVA POR DÍA');
    console.log('═══════════════════════════════════════════════\n');

    const diasSinReserva = Object.keys(sinReservasPorDia).sort();
    for (const fecha of diasSinReserva) {
      const cantidad = sinReservasPorDia[fecha];
      console.log(`📅 ${fecha}: ${cantidad} personas`);
    }

    console.log(`\n✅ TOTAL SIN RESERVA: ${totalSinReserva} personas\n`);

    // ==========================================
    // 6. TOTAL COMBINADO
    // ==========================================
    const totalPersonasAtendidas = totalMesAsistieron + totalSinReserva;

    console.log('═══════════════════════════════════════════════');
    console.log('🎯 TOTAL FINAL DE OCTUBRE 2025');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`👥 PERSONAS CON QR: ${totalMesAsistieron}`);
    console.log(`👥 PERSONAS SIN RESERVA: ${totalSinReserva}`);
    console.log(`\n✨ TOTAL PERSONAS ATENDIDAS: ${totalPersonasAtendidas}\n`);

    // ==========================================
    // 7. VERIFICAR EL BUG DEL REPORTE
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🐛 VERIFICACIÓN DEL CÁLCULO DEL REPORTE');
    console.log('═══════════════════════════════════════════════\n');

    const dia31 = '2025-10-31';
    if (asistenciasPorDia[dia31]) {
      console.log(`🎃 Halloween (31 de octubre):`);
      console.log(`   Reservas: ${asistenciasPorDia[dia31].reservas}`);
      console.log(`   Personas que asistieron: ${asistenciasPorDia[dia31].personasAsistieron}`);
      console.log('');
    }

    console.log('❓ El reporte dice que "Asistentes Reales: 215"\n');
    
    if (totalMesAsistieron === 215) {
      console.log('✅ CORRECTO: Son las 215 personas que escanearon QR en TODO octubre');
      console.log(`   Distribuidas en ${Object.keys(asistenciasPorDia).filter(f => asistenciasPorDia[f].personasAsistieron > 0).length} días diferentes\n`);
    } else {
      console.log(`⚠️  DISCREPANCIA: El total calculado es ${totalMesAsistieron}, no 215\n`);
    }

    console.log('💡 ACLARACIÓN:');
    console.log('   El número "215" es el TOTAL de todo octubre');
    console.log('   NO es solo del 31 de octubre');
    console.log(`   El reporte está filtrando por mes: "Mostrando: 31/10/2025"\n`);

    // ==========================================
    // 8. DÍAS CON MÁS ASISTENCIA
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🔝 TOP 5 DÍAS CON MÁS ASISTENCIA (Con QR)');
    console.log('═══════════════════════════════════════════════\n');

    const diasTop = Object.entries(asistenciasPorDia)
      .filter(([_, data]) => data.personasAsistieron > 0)
      .sort((a, b) => b[1].personasAsistieron - a[1].personasAsistieron)
      .slice(0, 5);

    diasTop.forEach(([fecha, data], index) => {
      console.log(`${index + 1}. ${fecha}: ${data.personasAsistieron} personas (${data.qrEscaneados} QR)`);
    });

    console.log('\n🎉 Análisis completado!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateCorrectOctoberAttendance();
