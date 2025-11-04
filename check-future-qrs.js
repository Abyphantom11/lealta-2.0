/**
 * Verificar QRs actuales y futuros (noviembre 3 en adelante)
 * Para asegurar que no eliminamos QRs que se van a usar
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFutureQRs() {
  console.log('═════════════════════════════════════════════════════');
  console.log('📅 ANÁLISIS DE QR CODES - 3 DE NOVIEMBRE EN ADELANTE');
  console.log('═════════════════════════════════════════════════════');
  console.log('');

  try {
    const hoy = new Date('2025-11-03T00:00:00.000Z');
    const tresDiasAtras = new Date('2025-10-31T00:00:00.000Z');
    
    console.log(`🗓️  Fecha de referencia: ${hoy.toISOString()}`);
    console.log(`🗓️  Límite de limpieza (3 días atrás): ${tresDiasAtras.toISOString()}`);
    console.log('');

    // 1. QRs con fecha de reserva futura o de hoy
    console.log('📊 ANÁLISIS POR FECHA DE RESERVA:');
    console.log('─────────────────────────────────────────────────────');
    
    const qrsConReservaFutura = await prisma.reservationQRCode.findMany({
      include: {
        Reservation: {
          select: {
            reservationNumber: true,
            reservedAt: true,
            status: true,
            customerName: true,
            businessId: true
          }
        }
      },
      orderBy: {
        Reservation: {
          reservedAt: 'asc'
        }
      }
    });

    // Agrupar por fechas
    const porHoy = qrsConReservaFutura.filter(qr => {
      const fechaReserva = new Date(qr.Reservation.reservedAt);
      return fechaReserva >= hoy && fechaReserva < new Date('2025-11-04T00:00:00.000Z');
    });

    const porEstaSemana = qrsConReservaFutura.filter(qr => {
      const fechaReserva = new Date(qr.Reservation.reservedAt);
      const finSemana = new Date('2025-11-10T00:00:00.000Z');
      return fechaReserva >= hoy && fechaReserva < finSemana;
    });

    const porFuturos = qrsConReservaFutura.filter(qr => {
      const fechaReserva = new Date(qr.Reservation.reservedAt);
      return fechaReserva >= new Date('2025-11-10T00:00:00.000Z');
    });

    const porPasados = qrsConReservaFutura.filter(qr => {
      const fechaReserva = new Date(qr.Reservation.reservedAt);
      return fechaReserva < hoy;
    });

    console.log(`📅 HOY (3 de noviembre): ${porHoy.length} QRs`);
    console.log(`📅 ESTA SEMANA (3-9 nov): ${porEstaSemana.length} QRs`);
    console.log(`📅 FUTURO (10 nov +): ${porFuturos.length} QRs`);
    console.log(`📅 PASADOS (antes del 3 nov): ${porPasados.length} QRs`);
    console.log('');

    // 2. Análisis detallado de QRs de hoy
    if (porHoy.length > 0) {
      console.log('🎯 DETALLE DE QRs PARA HOY (3 NOV):');
      console.log('─────────────────────────────────────────────────────');
      for (const [idx, qr] of porHoy.entries()) {
        const fechaCreacion = new Date(qr.createdAt);
        const diasDesdeCreacion = Math.floor((Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`${idx + 1}. Reserva: ${qr.Reservation.reservationNumber}`);
        console.log(`   Cliente: ${qr.Reservation.customerName}`);
        console.log(`   Hora reserva: ${new Date(qr.Reservation.reservedAt).toLocaleString('es-ES')}`);
        console.log(`   QR creado: ${fechaCreacion.toLocaleString('es-ES')} (hace ${diasDesdeCreacion} días)`);
        console.log(`   Status: ${qr.status}`);
        console.log(`   ¿Se eliminaría?: ${diasDesdeCreacion > 3 ? '⚠️ SÍ' : '✅ NO'}`);
        console.log('');
      }
    }

    // 3. Análisis detallado de QRs de esta semana
    if (porEstaSemana.length > 0) {
      console.log('📅 DETALLE DE QRs PARA ESTA SEMANA (3-9 NOV):');
      console.log('─────────────────────────────────────────────────────');
      const muestraLimit = Math.min(10, porEstaSemana.length);
      console.log(`Mostrando primeros ${muestraLimit} de ${porEstaSemana.length}:`);
      console.log('');
      
      for (const [idx, qr] of porEstaSemana.slice(0, muestraLimit).entries()) {
        const fechaCreacion = new Date(qr.createdAt);
        const diasDesdeCreacion = Math.floor((Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`${idx + 1}. Reserva: ${qr.Reservation.reservationNumber}`);
        console.log(`   Hora reserva: ${new Date(qr.Reservation.reservedAt).toLocaleString('es-ES')}`);
        console.log(`   QR creado: ${fechaCreacion.toLocaleString('es-ES')} (hace ${diasDesdeCreacion} días)`);
        console.log(`   Status: ${qr.status} | Scans: ${qr.scanCount}`);
        console.log(`   ¿Se eliminaría?: ${diasDesdeCreacion > 3 ? '⚠️ SÍ' : '✅ NO'}`);
        console.log('');
      }
    }

    // 4. VERIFICACIÓN CRÍTICA: QRs que se eliminarían pero tienen reserva futura
    console.log('⚠️  VERIFICACIÓN CRÍTICA:');
    console.log('─────────────────────────────────────────────────────');
    
    const qrsPeligrosos = qrsConReservaFutura.filter(qr => {
      const fechaCreacion = new Date(qr.createdAt);
      const fechaReserva = new Date(qr.Reservation.reservedAt);
      const diasDesdeCreacion = Math.floor((Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
      
      // QRs creados hace más de 3 días PERO con reserva futura
      return diasDesdeCreacion > 3 && fechaReserva >= hoy;
    });

    if (qrsPeligrosos.length > 0) {
      console.log(`🚨 ALERTA: ${qrsPeligrosos.length} QRs se eliminarían pero tienen reserva HOY o FUTURA:`);
      console.log('');
      for (const [idx, qr] of qrsPeligrosos.entries()) {
        const fechaCreacion = new Date(qr.createdAt);
        const fechaReserva = new Date(qr.Reservation.reservedAt);
        const diasDesdeCreacion = Math.floor((Date.now() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`${idx + 1}. 🚨 CRÍTICO:`);
        console.log(`   Reserva: ${qr.Reservation.reservationNumber}`);
        console.log(`   Cliente: ${qr.Reservation.customerName}`);
        console.log(`   Fecha reserva: ${fechaReserva.toLocaleString('es-ES')}`);
        console.log(`   QR creado: ${fechaCreacion.toLocaleString('es-ES')} (hace ${diasDesdeCreacion} días)`);
        console.log(`   Status reserva: ${qr.Reservation.status}`);
        console.log(`   Status QR: ${qr.status}`);
        console.log('');
      }
    } else {
      console.log('✅ PERFECTO: No hay QRs en riesgo de eliminación incorrecta');
      console.log('   Todos los QRs con reservas futuras fueron creados hace menos de 3 días');
    }
    console.log('─────────────────────────────────────────────────────');
    console.log('');

    // 5. Resumen de seguridad
    console.log('📋 RESUMEN DE SEGURIDAD:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Total de QRs en el sistema: ${qrsConReservaFutura.length}`);
    console.log(`├─ Con reservas pasadas: ${porPasados.length}`);
    console.log(`│  └─ De estos, creados hace >3 días: se eliminarán ✅`);
    console.log(`├─ Con reservas HOY: ${porHoy.length}`);
    console.log(`├─ Con reservas esta semana: ${porEstaSemana.length}`);
    console.log(`└─ Con reservas futuras (>1 semana): ${porFuturos.length}`);
    console.log('');
    
    if (qrsPeligrosos.length > 0) {
      console.log('⚠️  RECOMENDACIÓN:');
      console.log('   CAMBIAR la lógica de limpieza para basarse en FECHA DE RESERVA');
      console.log('   en lugar de fecha de creación del QR');
    } else {
      console.log('✅ RECOMENDACIÓN:');
      console.log('   La limpieza por fecha de creación (>3 días) es SEGURA');
      console.log('   No eliminará QRs de reservas actuales o futuras');
    }
    console.log('─────────────────────────────────────────────────────');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkFutureQRs();
