const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function fixQRCodesSeptiembre() {
  try {
    console.log('🔧 Corrigiendo QR Codes de reservas de septiembre...\n');

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Obtener todas las reservas de septiembre 2025
    const reservasSeptiembre = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: new Date(2025, 8, 1), // Septiembre 1
          lt: new Date(2025, 9, 1),  // Octubre 1
        },
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`📊 Total reservas septiembre: ${reservasSeptiembre.length}`);

    // 2. Para cada reserva COMPLETED, crear/actualizar QR code con scanCount
    let qrCreados = 0;
    let qrActualizados = 0;

    for (const reserva of reservasSeptiembre) {
      // Solo procesar las COMPLETED (las que "asistieron")
      if (reserva.status !== 'COMPLETED') {
        continue;
      }

      // Verificar si ya tiene QR code
      const qrExistente = await prisma.reservationQRCode.findFirst({
        where: {
          reservationId: reserva.id,
        },
      });

      if (qrExistente) {
        // Actualizar scanCount al número de invitados (todos asistieron)
        await prisma.reservationQRCode.update({
          where: { id: qrExistente.id },
          data: {
            scanCount: reserva.guestCount,
            lastScannedAt: reserva.checkedInAt || reserva.completedAt || new Date(),
          },
        });
        qrActualizados++;
        console.log(`✅ QR actualizado: ${reserva.reservationNumber} - ${reserva.guestCount} escaneos`);
      } else {
        // Crear QR code con scanCount
        const slotTime = reserva.checkedInAt || reserva.completedAt || new Date();
        const expiresAt = new Date(slotTime);
        expiresAt.setHours(expiresAt.getHours() + 3); // Expira 3 horas después

        const qrData = {
          businessId: reserva.businessId,
          reservationId: reserva.id,
          qrToken: `QR-${reserva.reservationNumber}`,
          qrData: JSON.stringify({
            reservationNumber: reserva.reservationNumber,
            customerName: reserva.customerName,
            guestCount: reserva.guestCount,
          }),
          status: 'USED',
          expiresAt: expiresAt,
          usedAt: slotTime,
          usedBy: reserva.customerName,
          scanCount: reserva.guestCount, // ✅ Todos los invitados asistieron
          lastScannedAt: slotTime,
          createdAt: reserva.reservedAt,
        };

        await prisma.reservationQRCode.create({
          data: qrData,
        });
        qrCreados++;
        console.log(`✅ QR creado: ${reserva.reservationNumber} - ${reserva.guestCount} escaneos`);
      }
    }

    console.log('\n📊 RESUMEN:');
    console.log(`   Total reservas septiembre: ${reservasSeptiembre.length}`);
    console.log(`   Reservas COMPLETED: ${reservasSeptiembre.filter(r => r.status === 'COMPLETED').length}`);
    console.log(`   QR codes creados: ${qrCreados}`);
    console.log(`   QR codes actualizados: ${qrActualizados}`);
    console.log('\n✅ Corrección completada');

    // 3. Verificar totales
    const verificacion = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: new Date(2025, 8, 1),
          lt: new Date(2025, 9, 1),
        },
        status: 'COMPLETED',
      },
      include: {
        qrCodes: true,
      },
    });

    const totalAsistentesEsperados = verificacion.reduce((sum, r) => sum + r.guestCount, 0);
    const totalAsistentesReales = verificacion.reduce((sum, r) => {
      return sum + (r.qrCodes[0]?.scanCount || 0);
    }, 0);

    console.log('\n✅ VERIFICACIÓN FINAL:');
    console.log(`   Asistentes esperados: ${totalAsistentesEsperados}`);
    console.log(`   Asistentes reales (scanCount): ${totalAsistentesReales}`);
    console.log(`   Cumplimiento: ${totalAsistentesEsperados > 0 ? ((totalAsistentesReales / totalAsistentesEsperados) * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRCodesSeptiembre();
