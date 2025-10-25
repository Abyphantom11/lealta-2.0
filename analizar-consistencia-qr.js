const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarConsistenciaQR() {
  console.log('🔍 ANÁLISIS DE CONSISTENCIA DE CÓDIGOS QR\n');
  console.log('=' .repeat(80));

  try {
    // 1. Obtener todas las reservas con sus QRs
    const reservasConQR = await prisma.reservation.findMany({
      include: {
        ReservationQRCode: true,
        ReservationSlot: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Últimas 100 reservas
    });

    console.log(`\n📊 Total de reservas analizadas: ${reservasConQR.length}\n`);

    // 2. Analizar problemas potenciales
    const problemas = {
      sinQR: [],
      qrMultiples: [],
      qrExpirados: [],
      qrInvalidos: [],
      inconsistenciaFechas: []
    };

    const ahora = new Date();

    for (const reserva of reservasConQR) {
      const qrCodes = reserva.ReservationQRCode || [];
      
      // Problema 1: Reserva sin QR
      if (qrCodes.length === 0) {
        problemas.sinQR.push({
          id: reserva.id,
          cliente: reserva.customerName,
          fecha: reserva.ReservationSlot?.date,
          hora: reserva.ReservationSlot?.startTime,
          businessId: reserva.businessId
        });
        continue;
      }

      // Problema 2: Múltiples QRs (debe haber solo uno)
      if (qrCodes.length > 1) {
        problemas.qrMultiples.push({
          id: reserva.id,
          cliente: reserva.customerName,
          cantidadQRs: qrCodes.length,
          tokens: qrCodes.map(qr => qr.qrToken)
        });
      }

      const qrCode = qrCodes[0];
      const reservedAt = reserva.ReservationSlot?.startTime;

      if (!reservedAt) {
        problemas.qrInvalidos.push({
          id: reserva.id,
          cliente: reserva.customerName,
          problema: 'Sin fecha/hora de reserva'
        });
        continue;
      }

      const reservationDateTime = new Date(reservedAt);
      const qrValidFrom = new Date(reservationDateTime.getTime() - (24 * 60 * 60 * 1000)); // 24h antes
      const qrExpiresAt = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000)); // 12h después

      // Problema 3: QR expirado pero reserva reciente
      if (ahora > qrExpiresAt && ahora < new Date(reservationDateTime.getTime() + (48 * 60 * 60 * 1000))) {
        problemas.qrExpirados.push({
          id: reserva.id,
          cliente: reserva.customerName,
          fechaReserva: reservationDateTime.toISOString(),
          expiradoDesde: qrExpiresAt.toISOString(),
          horasDesdeExpiracion: ((ahora.getTime() - qrExpiresAt.getTime()) / (1000 * 60 * 60)).toFixed(2),
          businessId: reserva.businessId
        });
      }

      // Problema 4: Inconsistencia entre expiresAt del QR y cálculo esperado
      if (qrCode.expiresAt) {
        const expiresAtDB = new Date(qrCode.expiresAt);
        const diferenciaMinutos = Math.abs((expiresAtDB.getTime() - qrExpiresAt.getTime()) / (1000 * 60));
        
        if (diferenciaMinutos > 10) { // Más de 10 minutos de diferencia
          problemas.inconsistenciaFechas.push({
            id: reserva.id,
            cliente: reserva.customerName,
            fechaReserva: reservationDateTime.toISOString(),
            expiresAtDB: expiresAtDB.toISOString(),
            expiresAtEsperado: qrExpiresAt.toISOString(),
            diferenciaMinutos: diferenciaMinutos.toFixed(2),
            businessId: reserva.businessId
          });
        }
      }
    }

    // 3. Reportar problemas
    console.log('\n📋 RESULTADOS DEL ANÁLISIS\n');
    console.log('-'.repeat(80));

    console.log(`\n❌ RESERVAS SIN QR: ${problemas.sinQR.length}`);
    if (problemas.sinQR.length > 0) {
      console.log('\nDetalle:');
      problemas.sinQR.slice(0, 5).forEach(p => {
        console.log(`  • ${p.id.substring(0, 8)}... - ${p.cliente} - Business: ${p.businessId.substring(0, 8)}...`);
        console.log(`    Fecha: ${p.fecha}, Hora: ${p.hora}`);
      });
      if (problemas.sinQR.length > 5) {
        console.log(`  ... y ${problemas.sinQR.length - 5} más`);
      }
    }

    console.log(`\n⚠️  RESERVAS CON MÚLTIPLES QRs: ${problemas.qrMultiples.length}`);
    if (problemas.qrMultiples.length > 0) {
      console.log('\nDetalle:');
      problemas.qrMultiples.forEach(p => {
        console.log(`  • ${p.id.substring(0, 8)}... - ${p.cliente}`);
        console.log(`    Cantidad QRs: ${p.cantidadQRs}`);
      });
    }

    console.log(`\n⏰ QRs EXPIRADOS (últimas 48h): ${problemas.qrExpirados.length}`);
    if (problemas.qrExpirados.length > 0) {
      console.log('\nDetalle:');
      problemas.qrExpirados.slice(0, 10).forEach(p => {
        console.log(`  • ${p.id.substring(0, 8)}... - ${p.cliente} - Business: ${p.businessId.substring(0, 8)}...`);
        console.log(`    Reserva: ${new Date(p.fechaReserva).toLocaleString('es-ES')}`);
        console.log(`    Expiró: ${new Date(p.expiradoDesde).toLocaleString('es-ES')} (hace ${p.horasDesdeExpiracion}h)`);
      });
    }

    console.log(`\n🔧 INCONSISTENCIAS DE FECHA: ${problemas.inconsistenciaFechas.length}`);
    if (problemas.inconsistenciaFechas.length > 0) {
      console.log('\nDetalle (posible causa del problema):');
      problemas.inconsistenciaFechas.forEach(p => {
        console.log(`  • ${p.id.substring(0, 8)}... - ${p.cliente} - Business: ${p.businessId.substring(0, 8)}...`);
        console.log(`    Reserva: ${new Date(p.fechaReserva).toLocaleString('es-ES')}`);
        console.log(`    Expira en DB: ${new Date(p.expiresAtDB).toLocaleString('es-ES')}`);
        console.log(`    Debería expirar: ${new Date(p.expiresAtEsperado).toLocaleString('es-ES')}`);
        console.log(`    Diferencia: ${p.diferenciaMinutos} minutos ⚠️`);
      });
    }

    console.log(`\n❓ QRs INVÁLIDOS: ${problemas.qrInvalidos.length}`);
    if (problemas.qrInvalidos.length > 0) {
      problemas.qrInvalidos.forEach(p => {
        console.log(`  • ${p.id.substring(0, 8)}... - ${p.cliente} - ${p.problema}`);
      });
    }

    // 4. Análisis de la lógica de expiración
    console.log('\n\n🔍 ANÁLISIS DE LÓGICA DE EXPIRACIÓN\n');
    console.log('-'.repeat(80));
    console.log('\n📌 REGLA ACTUAL:');
    console.log('  • Válido desde: 24 horas ANTES de la hora de reserva');
    console.log('  • Expira: 12 horas DESPUÉS de la hora de reserva');
    console.log('  • Ventana total: 36 horas\n');

    // Verificar casos edge
    const reservasHoy = reservasConQR.filter(r => {
      if (!r.ReservationSlot?.startTime) return false;
      const fecha = new Date(r.ReservationSlot.startTime);
      const diff = Math.abs(ahora.getTime() - fecha.getTime());
      return diff < (24 * 60 * 60 * 1000); // Dentro de 24 horas
    });

    console.log(`\n📅 Reservas dentro de las próximas 24 horas: ${reservasHoy.length}`);
    
    if (reservasHoy.length > 0) {
      console.log('\nEstado de sus QRs:');
      for (const reserva of reservasHoy.slice(0, 10)) {
        const qrCode = reserva.ReservationQRCode?.[0];
        if (!qrCode || !reserva.ReservationSlot?.startTime) continue;

        const reservationDateTime = new Date(reserva.ReservationSlot.startTime);
        const qrValidFrom = new Date(reservationDateTime.getTime() - (24 * 60 * 60 * 1000));
        const qrExpiresAt = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000));

        const estado = ahora < qrValidFrom ? '⏳ AÚN NO VÁLIDO' :
                       ahora > qrExpiresAt ? '❌ EXPIRADO' :
                       '✅ VÁLIDO';

        const horasHastaReserva = ((reservationDateTime.getTime() - ahora.getTime()) / (1000 * 60 * 60)).toFixed(1);

        console.log(`  • ${reserva.customerName} - Business: ${reserva.businessId.substring(0, 8)}...`);
        console.log(`    Reserva en: ${horasHastaReserva}h - Estado QR: ${estado}`);
        console.log(`    Válido desde: ${qrValidFrom.toLocaleString('es-ES')}`);
        console.log(`    Expira: ${qrExpiresAt.toLocaleString('es-ES')}`);
      }
    }

    // 5. Recomendaciones
    console.log('\n\n💡 RECOMENDACIONES\n');
    console.log('-'.repeat(80));
    
    if (problemas.inconsistenciaFechas.length > 0) {
      console.log('\n⚠️  PROBLEMA CRÍTICO DETECTADO:');
      console.log('   Hay inconsistencias entre la fecha de expiración en DB y el cálculo esperado.');
      console.log('   Esto puede causar que QRs aparezcan como expirados prematuramente.\n');
      console.log('   Causa probable:');
      console.log('   - Zona horaria diferente entre servidor y DB');
      console.log('   - Actualización de fecha/hora de reserva sin regenerar QR');
      console.log('   - Bug en cálculo de expiración durante creación\n');
    }

    if (problemas.qrMultiples.length > 0) {
      console.log('\n⚠️  RESERVAS CON MÚLTIPLES QRs:');
      console.log('   Cada reserva debe tener solo un QR activo.');
      console.log('   Los QRs duplicados pueden causar inconsistencias.\n');
    }

    if (problemas.sinQR.length > 0) {
      console.log('\n⚠️  RESERVAS SIN QR:');
      console.log('   Estas reservas no pueden ser escaneadas.');
      console.log('   Verificar que el proceso de creación de QR funcione correctamente.\n');
    }

    console.log('\n✅ SUGERENCIAS DE MEJORA:');
    console.log('   1. Agregar logs detallados al crear/validar QR con timezone');
    console.log('   2. Validar que no existan QRs duplicados antes de crear uno nuevo');
    console.log('   3. Considerar regenerar QR al cambiar fecha/hora de reserva');
    console.log('   4. Usar UTC consistentemente para evitar problemas de zona horaria');
    console.log('   5. Agregar campo `validatedAt` para debugging de escaneos');

    console.log('\n' + '='.repeat(80));
    console.log('✅ Análisis completado\n');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarConsistenciaQR();
