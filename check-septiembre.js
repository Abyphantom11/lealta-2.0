const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSeptiembreReservations() {
  try {
    // Buscar reservas de septiembre 2025
    const fechaInicio = new Date(2025, 8, 1); // Septiembre = mes 8 (0-indexed)
    const fechaFin = new Date(2025, 8, 30, 23, 59, 59);

    console.log('Buscando reservas entre:');
    console.log('Inicio:', fechaInicio.toISOString());
    console.log('Fin:', fechaFin.toISOString());
    console.log('');

    const reservas = await prisma.reservation.findMany({
      where: {
        businessId: 'cmgb818x70000eyeov4f8lriu',
        reservedAt: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        qrCodes: true,
        promotor: true
      },
      orderBy: {
        reservedAt: 'asc'
      }
    });

    console.log(`✅ Encontradas ${reservas.length} reservas en septiembre 2025\n`);

    if (reservas.length > 0) {
      console.log('Primera reserva:');
      console.log('- ID:', reservas[0].id);
      console.log('- Fecha (reservedAt):', reservas[0].reservedAt);
      console.log('- Estado:', reservas[0].status);
      console.log('- Personas:', reservas[0].guestCount);
      console.log('- Scans:', reservas[0].qrCodes[0]?.scanCount || 0);
      console.log('- Promotor:', reservas[0].promotor?.nombre || 'N/A');
      
      console.log('\nÚltima reserva:');
      const ultima = reservas[reservas.length - 1];
      console.log('- ID:', ultima.id);
      console.log('- Fecha (reservedAt):', ultima.reservedAt);
      console.log('- Estado:', ultima.status);
      console.log('- Personas:', ultima.guestCount);
      console.log('- Scans:', ultima.qrCodes[0]?.scanCount || 0);
      console.log('- Promotor:', ultima.promotor?.nombre || 'N/A');
    } else {
      console.log('❌ No se encontraron reservas en septiembre 2025');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeptiembreReservations();
