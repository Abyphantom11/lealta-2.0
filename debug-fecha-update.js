const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFechaUpdate() {
  console.log('🔍 Debuggeando actualización de fecha...');
  
  try {
    // 1. Buscar una reserva de prueba
    const reservaPrueba = await prisma.reservation.findFirst({
      where: {
        businessId: 'cmgf5px5f0000eyy0elci9yds'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!reservaPrueba) {
      console.log('❌ No se encontró ninguna reserva para testing');
      return;
    }
    
    console.log('📋 Reserva encontrada para testing:', {
      id: reservaPrueba.id,
      customerName: reservaPrueba.customerName,
      fechaActual: reservaPrueba.reservedAt,
      fechaFormateada: reservaPrueba.reservedAt.toISOString().split('T')[0],
      horaFormateada: reservaPrueba.reservedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    });
    
    // 2. Revertir la fecha a la original para testing
    const fechaOriginal = '2025-10-08'; // Fecha original de la reserva
    const horaActual = reservaPrueba.reservedAt.toTimeString().split(' ')[0]; // HH:mm:ss
    const fechaOriginalCompleta = new Date(fechaOriginal + 'T' + horaActual + '.000Z');
    
    console.log('🔄 Revirtiendo fecha a la original:', {
      fechaOriginal,
      horaActual,
      fechaOriginalCompleta: fechaOriginalCompleta.toISOString(),
      fechaOriginalFormateada: fechaOriginalCompleta.toISOString().split('T')[0]
    });
    
    const reservaRevertida = await prisma.reservation.update({
      where: {
        id: reservaPrueba.id
      },
      data: {
        reservedAt: fechaOriginalCompleta
      }
    });
    
    console.log('✅ Fecha revertida a original:', {
      id: reservaRevertida.id,
      fechaRevertida: reservaRevertida.reservedAt.toISOString(),
      fechaFormateada: reservaRevertida.reservedAt.toISOString().split('T')[0]
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFechaUpdate();
