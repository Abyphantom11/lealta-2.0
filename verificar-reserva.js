const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
  const reserva = await prisma.reservation.findFirst({
    where: {
      customerName: {
        contains: 'Albarado',
        mode: 'insensitive'
      }
    },
    include: {
      HostTracking: true
    }
  });
  
  console.log('Reserva encontrada:');
  console.log(JSON.stringify(reserva, null, 2));
  
  await prisma.$disconnect();
}

verificar();
