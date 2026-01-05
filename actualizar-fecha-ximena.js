const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function actualizarReservaXimena() {
  try {
    // Buscar la reserva de Ximena German
    const reservas = await prisma.reservation.findMany({
      where: {
        customerName: {
          contains: 'Ximena'
        }
      },
      include: {
        Cliente: true
      }
    });

    console.log('📋 Reservas encontradas:', reservas.length);
    
    if (reservas.length === 0) {
      console.log('❌ No se encontró ninguna reserva para Ximena');
      return;
    }

    for (const reserva of reservas) {
      console.log('\n🔍 Reserva:', {
        id: reserva.id,
        cliente: reserva.customerName,
        fechaActual: reserva.reservedAt,
        mesa: reserva.tableNumber
      });

      // Si la fecha está en 2892 o superior, actualizarla a 2025
      const fechaActual = new Date(reserva.reservedAt);
      if (fechaActual.getFullYear() >= 2892) {
        // Cambiar el año a 2025 manteniendo mes y día
        const nuevaFecha = new Date(fechaActual);
        nuevaFecha.setFullYear(2025);

        console.log('🔄 Actualizando fecha de', fechaActual.toISOString(), 'a', nuevaFecha.toISOString());

        await prisma.reservation.update({
          where: { id: reserva.id },
          data: { reservedAt: nuevaFecha }
        });

        console.log('✅ Fecha actualizada correctamente');
      } else {
        console.log('ℹ️ La fecha ya está en un año razonable:', fechaActual.getFullYear());
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarReservaXimena();
