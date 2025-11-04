/**
 * Script para verificar por qué numeroPersonas está undefined
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGuestCount() {
  try {
    console.log('🔍 Verificando campo guestCount en Reservations\n');

    const business = await prisma.business.findFirst({
      where: { slug: 'love-me-sky' }
    });

    const primerDiaOctubre = new Date(2025, 9, 1);
    const primerDiaNoviembre = new Date(2025, 10, 1);

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
      },
      take: 10
    });

    console.log('Muestra de 10 reservas de octubre:\n');

    for (const reserva of reservasOctubre) {
      const fecha = reserva.reservedAt.toISOString().split('T')[0];
      const scanCount = reserva.ReservationQRCode?.reduce((sum, qr) => sum + (qr.scanCount || 0), 0) || 0;
      
      console.log(`${fecha}:`);
      console.log(`   guestCount: ${reserva.guestCount}`);
      console.log(`   scanCount: ${scanCount}`);
      
      // Calcular asistenciaActual como lo hace el endpoint
      const asistenciaActual = reserva.ReservationQRCode?.[0]?.scanCount || 0;
      console.log(`   asistenciaActual (endpoint): ${asistenciaActual}`);
      console.log(`   numeroPersonas (endpoint): ${reserva.guestCount || 1}\n`);
    }

    // Contar cuántas tienen guestCount válido
    const totalReservas = await prisma.reservation.count({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        }
      }
    });

    const reservasConGuestCount = await prisma.reservation.count({
      where: {
        businessId: business.id,
        reservedAt: {
          gte: primerDiaOctubre,
          lt: primerDiaNoviembre
        },
        guestCount: {
          not: null
        }
      }
    });

    console.log(`Total reservas octubre: ${totalReservas}`);
    console.log(`Con guestCount: ${reservasConGuestCount}`);
    console.log(`Sin guestCount: ${totalReservas - reservasConGuestCount}\n`);

    // Verificar el modelo Reservation
    console.log('═══════════════════════════════════════════════');
    console.log('📋 DIAGNÓSTICO');
    console.log('═══════════════════════════════════════════════\n');

    if (reservasConGuestCount === 0) {
      console.log('❌ NINGUNA reserva tiene guestCount poblado');
      console.log('   El campo guestCount está vacío en la BD\n');
    } else if (reservasConGuestCount < totalReservas) {
      console.log(`⚠️  Solo ${reservasConGuestCount} de ${totalReservas} tienen guestCount`);
      console.log(`   ${totalReservas - reservasConGuestCount} reservas sin guestCount\n`);
    } else {
      console.log('✅ Todas las reservas tienen guestCount\n');
    }

    console.log('💡 CONCLUSIÓN:');
    console.log('   El endpoint calcula asistenciaActual desde scanCount');
    console.log('   Pero numeroPersonas (guestCount) puede estar vacío');
    console.log('   Por eso las métricas de la tabla muestran 0 invitados\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuestCount();
