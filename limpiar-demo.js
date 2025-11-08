const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });
  
  if (!business) {
    console.log('No se encontro negocio');
    return;
  }
  
  const consumos = await prisma.consumo.deleteMany({
    where: { businessId: business.id }
  });
  
  const clientes = await prisma.cliente.deleteMany({
    where: { businessId: business.id }
  });
  
  console.log('Eliminados:', clientes.count, 'clientes y', consumos.count, 'consumos');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
