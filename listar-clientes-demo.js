const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const business = await prisma.business.findFirst({
    where: { name: 'Demo Lealta' }
  });
  
  const clientes = await prisma.cliente.findMany({
    where: { businessId: business.id },
    orderBy: { nombre: 'asc' }
  });
  
  console.log('LISTA DE CLIENTES EN DEMO LEALTA:\n');
  clientes.forEach((c, i) => {
    console.log(`${String(i+1).padStart(2)}. ${c.nombre.padEnd(30)} (${c.cedula})`);
  });
}

check().then(() => prisma.$disconnect());
