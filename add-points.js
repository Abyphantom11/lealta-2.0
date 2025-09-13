const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPointsToClient() {
  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id: 'cmffrswy00000ey9wurnzsgc1' },
      data: { puntos: 300 }
    });
    
    console.log('Cliente actualizado con 300 puntos:', clienteActualizado);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPointsToClient();
