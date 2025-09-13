const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTarjetaLealtad() {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { nombre: 'abrahan' },
      include: { 
        tarjetaLealtad: true 
      }
    });
    
    console.log('Cliente completo:', JSON.stringify(cliente, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTarjetaLealtad();
