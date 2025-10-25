const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function regenerarQRsIncorrectos() {
  console.log('🔧 REGENERANDO QRs CON FECHAS INCORRECTAS\n');
  console.log('=' .repeat(80));

  try {
    // 1. Obtener todas las reservas activas con sus QRs
    const reservasActivas = await prisma.reservation.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reservedAt: {
          gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // Últimos 7 días
        }
      },
      include: {
        ReservationQRCode: true,
        ReservationSlot: true
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });

    console.log(`\n📊 Total de reservas activas a verificar: ${reservasActivas.length}\n`);

    let qrsRegenerados = 0;
    let qrsCorrectos = 0;
    const errores = [];

    for (const reserva of reservasActivas) {
      const qrCodes = reserva.ReservationQRCode || [];
      
      if (qrCodes.length === 0) {
        console.log(`⚠️  Reserva sin QR: ${reserva.id.substring(0, 8)}... - ${reserva.customerName}`);
        continue;
      }

      const qrCode = qrCodes[0];
      const reservedAt = reserva.ReservationSlot?.startTime || reserva.reservedAt;

      if (!reservedAt) {
        console.log(`⚠️  Reserva sin fecha: ${reserva.id.substring(0, 8)}... - ${reserva.customerName}`);
        continue;
      }

      const reservationDateTime = new Date(reservedAt);
      const qrExpiresAtEsperado = new Date(reservationDateTime.getTime() + (12 * 60 * 60 * 1000)); // 12h después
      const qrExpiresAtDB = new Date(qrCode.expiresAt);

      // Verificar si hay diferencia significativa (más de 10 minutos)
      const diferenciaMinutos = Math.abs((qrExpiresAtDB.getTime() - qrExpiresAtEsperado.getTime()) / (1000 * 60));

      if (diferenciaMinutos > 10) {
        console.log(`\n🔄 REGENERANDO QR - Reserva: ${reserva.id.substring(0, 8)}...`);
        console.log(`   Cliente: ${reserva.customerName}`);
        console.log(`   Fecha reserva: ${reservationDateTime.toLocaleString('es-ES')}`);
        console.log(`   Expira en DB: ${qrExpiresAtDB.toLocaleString('es-ES')} ❌`);
        console.log(`   Debería expirar: ${qrExpiresAtEsperado.toLocaleString('es-ES')} ✅`);
        console.log(`   Diferencia: ${diferenciaMinutos.toFixed(0)} minutos`);

        try {
          // Actualizar qrData JSON
          let updatedQrData = qrCode.qrData;
          try {
            const qrDataJson = JSON.parse(qrCode.qrData);
            qrDataJson.fecha = reservationDateTime.toISOString().split('T')[0];
            qrDataJson.hora = reservationDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            qrDataJson.timestamp = Date.now();
            updatedQrData = JSON.stringify(qrDataJson);
          } catch (parseError) {
            console.warn('   ⚠️ No se pudo actualizar qrData JSON');
          }

          // Regenerar QR con fecha correcta
          await prisma.reservationQRCode.update({
            where: { id: qrCode.id },
            data: {
              expiresAt: qrExpiresAtEsperado,
              qrData: updatedQrData,
              updatedAt: new Date()
            }
          });

          console.log(`   ✅ QR regenerado exitosamente`);
          qrsRegenerados++;
        } catch (error) {
          console.error(`   ❌ Error regenerando QR:`, error.message);
          errores.push({
            reservaId: reserva.id,
            error: error.message
          });
        }
      } else {
        qrsCorrectos++;
      }
    }

    // Resumen
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE REGENERACIÓN\n');
    console.log(`✅ QRs correctos (sin cambios): ${qrsCorrectos}`);
    console.log(`🔄 QRs regenerados: ${qrsRegenerados}`);
    console.log(`❌ Errores: ${errores.length}`);

    if (errores.length > 0) {
      console.log('\n❌ Detalles de errores:');
      errores.forEach(e => {
        console.log(`   • ${e.reservaId.substring(0, 8)}... - ${e.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Proceso completado\n');

  } catch (error) {
    console.error('❌ Error durante la regeneración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Preguntar confirmación antes de ejecutar
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n⚠️  Este script regenerará los QRs con fechas incorrectas.\n¿Deseas continuar? (si/no): ', (answer) => {
  if (answer.toLowerCase() === 'si' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Iniciando regeneración...\n');
    regenerarQRsIncorrectos().finally(() => rl.close());
  } else {
    console.log('\n❌ Operación cancelada\n');
    rl.close();
    process.exit(0);
  }
});
