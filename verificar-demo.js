const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });
  
  if (!business) return;
  
  const clientes = await prisma.cliente.findMany({
    where: { businessId: business.id },
    select: { nombre: true, puntos: true, totalVisitas: true }
  });
  
  const consumos = await prisma.consumo.count({
    where: { businessId: business.id }
  });
  
  console.log('\n=== ESTADO ACTUAL ===');
  console.log('Clientes:', clientes.length);
  console.log('Consumos:', consumos);
  
  const niveles = {
    platino: clientes.filter(c => c.puntos >= 1000).length,
    diamante: clientes.filter(c => c.puntos >= 500 && c.puntos < 1000).length,
    oro: clientes.filter(c => c.puntos >= 250 && c.puntos < 500).length,
    plata: clientes.filter(c => c.puntos >= 100 && c.puntos < 250).length,
    bronce: clientes.filter(c => c.puntos < 100).length
  };
  
  console.log('\nDistribucion:');
  console.log('  Platino:', niveles.platino);
  console.log('  Diamante:', niveles.diamante);
  console.log('  Oro:', niveles.oro);
  console.log('  Plata:', niveles.plata);
  console.log('  Bronce:', niveles.bronce);
}

check().then(() => prisma.$disconnect());
