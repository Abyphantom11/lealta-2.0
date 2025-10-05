const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEndpointLogic() {
  try {
    const businessId = 'cmgb818x70000eyeov4f8lriu';
    const mes = 9; // Septiembre
    const año = 2025;

    // Lógica del endpoint actualizada
    const fechaInicio = new Date(Date.UTC(año, mes - 1, 1, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, 1, 0, 0, 0, 0));

    console.log('Buscando con nueva lógica:');
    console.log('fechaInicio:', fechaInicio.toISOString());
    console.log('fechaFin:', fechaFin.toISOString());
    console.log('');

    const reservations = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      include: {
        qrCodes: {
          select: {
            scanCount: true,
          },
        },
        promotor: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`✅ Reservas encontradas: ${reservations.length}`);

    if (reservations.length > 0) {
      // Calcular estadísticas como en el endpoint
      const totalReservas = reservations.length;
      const totalPersonasEsperadas = reservations.reduce((sum, r) => sum + r.guestCount, 0);
      const totalAsistentesReales = reservations.reduce((sum, r) => {
        const scanCount = r.qrCodes[0]?.scanCount || 0;
        return sum + scanCount;
      }, 0);

      console.log('');
      console.log('📊 Estadísticas:');
      console.log('Total Reservas:', totalReservas);
      console.log('Personas Esperadas:', totalPersonasEsperadas);
      console.log('Asistentes Reales:', totalAsistentesReales);
      console.log('Cumplimiento:', ((totalAsistentesReales / totalPersonasEsperadas) * 100).toFixed(1) + '%');

      // Contadores por estado
      let completadas = 0;
      let sobreaforo = 0;
      let parciales = 0;
      let caidas = 0;
      let canceladas = 0;

      reservations.forEach(r => {
        const scanCount = r.qrCodes[0]?.scanCount || 0;
        
        if (r.status === 'CANCELLED') {
          canceladas++;
          return;
        }

        if (scanCount === 0) {
          caidas++;
        } else if (scanCount === r.guestCount) {
          completadas++;
        } else if (scanCount > r.guestCount) {
          sobreaforo++;
        } else {
          parciales++;
        }
      });

      console.log('');
      console.log('Por Asistencia:');
      console.log('- Completadas:', completadas);
      console.log('- Sobreaforo:', sobreaforo);
      console.log('- Parciales:', parciales);
      console.log('- Caídas:', caidas);
      console.log('- Canceladas:', canceladas);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpointLogic();
