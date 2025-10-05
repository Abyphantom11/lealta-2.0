const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReservation() {
  try {
    const reserva = await prisma.reservation.findFirst({
      where: {
        businessId: 'cmgb818x70000eyeov4f8lriu'
      },
      include: {
        qrCodes: true
      }
    });

    console.log('Estructura de la reserva:');
    console.log(JSON.stringify(reserva, null, 2));

    // Verificar fechas
    console.log('\n📅 Fechas importantes:');
    console.log('reservedAt:', reserva?.reservedAt);
    console.log('createdAt:', reserva?.createdAt);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservation();
