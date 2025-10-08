/**
 * Ver datos existentes del negocio demo
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function main() {
  console.log('📊 DATOS ACTUALES DEL NEGOCIO DEMO\n');
  
  const business = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
    include: {
      users: true,
      locations: true,
      clientes: {
        orderBy: { puntosAcumulados: 'desc' },
        take: 10
      },
      consumos: {
        orderBy: { registeredAt: 'desc' },
        take: 5
      }
    }
  });

  console.log(`🏢 Negocio: ${business.name}`);
  console.log(`📍 Ubicaciones: ${business.locations.length}`);
  console.log(`👥 Clientes: ${business.clientes.length}`);
  console.log(`💰 Consumos: ${business.consumos.length}\n`);

  if (business.clientes.length > 0) {
    console.log('👥 TOP CLIENTES:\n');
    business.clientes.forEach((c, i) => {
      console.log(`${i+1}. ${c.nombre} - ${c.puntosAcumulados} puntos - €${c.totalGastado.toFixed(2)}`);
    });
  }

  if (business.consumos.length > 0) {
    console.log('\n💰 ÚLTIMOS CONSUMOS:\n');
    business.consumos.forEach((c, i) => {
      console.log(`${i+1}. €${c.total} - ${c.registeredAt.toLocaleString('es-ES')}`);
    });
  }

  // Contar reservas
  const reservas = await prisma.reservation.count({
    where: { businessId: BUSINESS_ID }
  });
  console.log(`\n📅 Reservas: ${reservas}`);

  await prisma.$disconnect();
}

main().catch(console.error);
