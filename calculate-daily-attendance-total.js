/**
 * Script para calcular CORRECTAMENTE el total de asistentes de octubre
 * Sumando día por día (como lo hace la tabla de reservas)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateDailyAttendanceTotal() {
  try {
    console.log('🔍 CALCULANDO ASISTENCIAS SUMANDO DÍA POR DÍA\n');

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
    // 2. CALCULAR ASISTENTES POR DÍA
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 ASISTENTES POR DÍA (Método de la Tabla)');
    console.log('═══════════════════════════════════════════════\n');

    // Agrupar reservas por fecha
    const reservasPorFecha = {};
    
    for (const reserva of reservasOctubre) {
      const fecha = reserva.reservedAt.toISOString().split('T')[0];
      
      if (!reservasPorFecha[fecha]) {
        reservasPorFecha[fecha] = [];
      }
      
      reservasPorFecha[fecha].push(reserva);
    }

    // Para cada día, calcular métricas como lo hace ReservationTable.tsx
    const metricasPorDia = {};
    let totalAsistentesOctubre = 0;
    let totalInvitadosOctubre = 0;
    let diasConReservas = 0;

    const fechasOrdenadas = Object.keys(reservasPorFecha).sort();

    console.log('Calculando métricas día por día:\n');

    for (const fecha of fechasOrdenadas) {
      const reservasDelDia = reservasPorFecha[fecha];
      
      // REPLICAR EXACTAMENTE el cálculo de ReservationTable.tsx líneas 605-606
      const totalInvitados = reservasDelDia.reduce((sum, reserva) => sum + (reserva.numeroPersonas || 0), 0);
      const totalAsistentes = reservasDelDia.reduce((sum, reserva) => sum + (reserva.asistenciaActual || 0), 0);
      
      metricasPorDia[fecha] = {
        totalReservas: reservasDelDia.length,
        totalInvitados,
        totalAsistentes,
        porcentaje: totalInvitados > 0 ? ((totalAsistentes / totalInvitados) * 100).toFixed(1) : 0
      };

      // Sumar al total del mes
      totalInvitadosOctubre += totalInvitados;
      totalAsistentesOctubre += totalAsistentes;
      diasConReservas++;

      console.log(`📅 ${fecha}:`);
      console.log(`   Reservas: ${metricasPorDia[fecha].totalReservas}`);
      console.log(`   Invitados: ${totalInvitados}`);
      console.log(`   Asistentes: ${totalAsistentes}`);
      if (totalAsistentes > 0) {
        console.log(`   % Asistencia: ${metricasPorDia[fecha].porcentaje}%`);
      }
      console.log('');
    }

    // ==========================================
    // 3. TOTAL DEL MES
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 TOTAL DE OCTUBRE 2025 (Sumando día por día)');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`📅 Días con reservas: ${diasConReservas}`);
    console.log(`📋 Total de invitados: ${totalInvitadosOctubre}`);
    console.log(`✅ TOTAL DE ASISTENTES: ${totalAsistentesOctubre}`);
    console.log(`📊 % Asistencia general: ${totalInvitadosOctubre > 0 ? ((totalAsistentesOctubre / totalInvitadosOctubre) * 100).toFixed(1) : 0}%\n`);

    // ==========================================
    // 4. VERIFICAR CONTRA asistenciaActual
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🔍 VERIFICACIÓN: ¿asistenciaActual está poblado?');
    console.log('═══════════════════════════════════════════════\n');

    // Verificar algunas reservas de ejemplo
    const muestras = reservasOctubre.slice(0, 10);
    
    console.log('Muestra de 10 reservas:\n');
    
    for (const reserva of muestras) {
      const fecha = reserva.reservedAt.toISOString().split('T')[0];
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      
      console.log(`${fecha} - ${reserva.Cliente?.nombre || 'Sin nombre'}`);
      console.log(`   numeroPersonas: ${reserva.numeroPersonas}`);
      console.log(`   asistenciaActual: ${reserva.asistenciaActual || 0}`);
      console.log(`   scanCount (QR): ${scanCount}`);
      
      if (reserva.asistenciaActual !== scanCount) {
        console.log(`   ⚠️  DISCREPANCIA: asistenciaActual (${reserva.asistenciaActual}) != scanCount (${scanCount})`);
      }
      console.log('');
    }

    // ==========================================
    // 5. VERIFICAR SI asistenciaActual ESTÁ SINCRONIZADO
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('🎯 DIAGNÓSTICO FINAL');
    console.log('═══════════════════════════════════════════════\n');

    let reservasConAsistenciaActual = 0;
    let reservasConScanCount = 0;
    let totalAsistenciaActual = 0;
    let totalScanCount = 0;

    for (const reserva of reservasOctubre) {
      const asistencia = reserva.asistenciaActual || 0;
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;

      if (asistencia > 0) {
        reservasConAsistenciaActual++;
        totalAsistenciaActual += asistencia;
      }

      if (scanCount > 0) {
        reservasConScanCount++;
        totalScanCount += scanCount;
      }
    }

    console.log(`Reservas con asistenciaActual > 0: ${reservasConAsistenciaActual}`);
    console.log(`Reservas con scanCount > 0: ${reservasConScanCount}`);
    console.log(`\nTotal asistenciaActual: ${totalAsistenciaActual}`);
    console.log(`Total scanCount: ${totalScanCount}\n`);

    if (totalAsistenciaActual === 0 && totalScanCount > 0) {
      console.log('❌ PROBLEMA ENCONTRADO:');
      console.log('   El campo asistenciaActual NO está poblado');
      console.log('   Pero scanCount SÍ tiene datos');
      console.log('   El sistema NO está sincronizando asistenciaActual\n');
      
      console.log('💡 SOLUCIÓN:');
      console.log('   El endpoint debe calcular asistenciaActual desde scanCount');
      console.log('   O actualizar asistenciaActual cuando se escanea un QR\n');
    } else if (totalAsistenciaActual === totalScanCount) {
      console.log('✅ asistenciaActual está sincronizado con scanCount');
      console.log(`   Total de asistentes: ${totalAsistenciaActual}\n`);
    } else {
      console.log('⚠️  HAY DISCREPANCIA:');
      console.log(`   asistenciaActual: ${totalAsistenciaActual}`);
      console.log(`   scanCount: ${totalScanCount}`);
      console.log(`   Diferencia: ${Math.abs(totalAsistenciaActual - totalScanCount)}\n`);
    }

    // ==========================================
    // 6. COMPARAR CON EL REPORTE
    // ==========================================
    console.log('═══════════════════════════════════════════════');
    console.log('📊 COMPARACIÓN CON EL REPORTE');
    console.log('═══════════════════════════════════════════════\n');

    console.log('El reporte dice:');
    console.log('   "Asistentes Reales: 215"\n');

    console.log('Nuestro cálculo (sumando día por día):');
    console.log(`   Total asistentes: ${totalAsistentesOctubre}\n`);

    if (totalAsistentesOctubre === 215) {
      console.log('✅ LOS NÚMEROS COINCIDEN');
      console.log('✅ El reporte está calculando correctamente (suma día por día)\n');
    } else {
      console.log('⚠️  LOS NÚMEROS NO COINCIDEN');
      console.log(`   Diferencia: ${Math.abs(totalAsistentesOctubre - 215)}`);
      console.log(`   Posibles causas:`);
      console.log(`   - asistenciaActual no está poblado correctamente`);
      console.log(`   - Hay reservas sin asistenciaActual pero con scanCount\n`);
    }

    console.log('🎉 Análisis completado!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateDailyAttendanceTotal();
